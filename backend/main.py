import os
import cv2
import torch
import numpy as np
from pathlib import Path
from PIL import Image

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import torchvision.transforms as transforms

from model import CLASSES, load_model
from recommender import recommend_hairstyle
from utils.face_landmarks import detect_landmarks
from utils.hair_overlay import overlay_hair

# Import BiSeNet Smart Overlay (Hybrid BiSeNet + MediaPipe)
try:
    from bisenet_simple import get_simple_bisenet_overlay
    BISENET_AVAILABLE = True
    print("[Backend] BiSeNet Smart Overlay loaded (Hybrid System)")
except Exception as e:
    BISENET_AVAILABLE = False
    print(f"[Backend] BiSeNet not available: {e}")
    print("[Backend] Using basic alpha blending as fallback")

# =====================
# APP INIT
# =====================
app = FastAPI(title="Face Shape Hairstyle Recommender")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "face_shape_modelv2.pth"
HAIR_DIR = Path(__file__).resolve().parent / "hairstyles_processed"  # Fixed: use backend/hairstyles

model = load_model(MODEL_PATH)

transform = transforms.Compose([
    transforms.Resize((380, 380)),
    transforms.ToTensor(),
])

# =====================
# PREDICT FACE SHAPE
# =====================
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image = Image.open(file.file).convert("RGB")
    img_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)
        conf, pred = torch.max(probs, 1)

    face_shape = CLASSES[pred.item()]
    confidence = round(conf.item() * 100, 2)

    hairstyles = recommend_hairstyle(face_shape)

    return {
        "face_shape": face_shape,
        "confidence": confidence,
        "recommendations": hairstyles
    }

# =====================
# TRY ON HAIRSTYLE
# =====================
@app.post("/try-on")
async def try_on(
    file: UploadFile = File(...),
    hairstyle: str = Form(...)
):
    try:
        image = Image.open(file.file).convert("RGB")
        img_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        landmarks = detect_landmarks(img_np)
        if landmarks is None:
            # Return original image with error text
            error_img = img_np.copy()
            cv2.putText(error_img, "Face not detected!", (50, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            output_path = BASE_DIR / "output_error.jpg"
            cv2.imwrite(str(output_path), error_img)
            return FileResponse(str(output_path), media_type="image/jpeg")

        # klasifikasi ulang (biar konsisten)
        img_tensor = transform(image).unsqueeze(0)
        with torch.no_grad():
            outputs = model(img_tensor)
            face_shape = CLASSES[outputs.argmax(1).item()]

        hair_path = HAIR_DIR / face_shape / f"{hairstyle}.png"
        if not hair_path.exists():
            # Return original image with error text
            error_img = img_np.copy()
            cv2.putText(error_img, f"Hair image not found!", (50, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.putText(error_img, f"Path: {hair_path}", (50, 100), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            output_path = BASE_DIR / "output_error.jpg"
            cv2.imwrite(str(output_path), error_img)
            return FileResponse(str(output_path), media_type="image/jpeg")

        hair_img = cv2.imread(str(hair_path), cv2.IMREAD_UNCHANGED)
        if hair_img is None:
            # Return original image with error text
            error_img = img_np.copy()
            cv2.putText(error_img, "Failed to load hair image!", (50, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            output_path = BASE_DIR / "output_error.jpg"
            cv2.imwrite(str(output_path), error_img)
            return FileResponse(str(output_path), media_type="image/jpeg")
        
        
        # Use BiSeNet Smart Overlay if available (Best accuracy)
        if BISENET_AVAILABLE:
            try:
                print("[Try-On] Using BiSeNet Smart Overlay (Hybrid)")
                smart_overlay = get_simple_bisenet_overlay()
                result = smart_overlay.overlay_hair_simple(img_np, hair_img, landmarks)
            except Exception as e:
                print(f"[Try-On] BiSeNet failed: {e}, using basic fallback")
                result = overlay_hair(img_np, hair_img, landmarks)
        else:
            print("[Try-On] Using basic alpha blending")
            result = overlay_hair(img_np, hair_img, landmarks)

        output_path = BASE_DIR / "output_tryon.jpg"
        cv2.imwrite(str(output_path), result)

        return FileResponse(str(output_path), media_type="image/jpeg")
    
    except Exception as e:
        # Return error image
        try:
            error_img = np.zeros((400, 600, 3), dtype=np.uint8)
            cv2.putText(error_img, "Try-on failed!", (50, 150), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
            cv2.putText(error_img, str(e)[:50], (50, 250), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            output_path = BASE_DIR / "output_error.jpg"
            cv2.imwrite(str(output_path), error_img)
            return FileResponse(str(output_path), media_type="image/jpeg")
        except:
            raise e
