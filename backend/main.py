from pathlib import Path
import torch
import torchvision.transforms as transforms
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from model import CLASSES, load_model
from PIL import Image
from recommender import recommend_hairstyle

app = FastAPI(title="Face Shape Hairstyle Recommender")

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "face_shape_modelv2.pth"


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model(MODEL_PATH)

transform = transforms.Compose([
    transforms.Resize((380, 380)),
    transforms.ToTensor(),
])

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
