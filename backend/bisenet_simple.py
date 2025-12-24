"""
SIMPLIFIED SMART HAIR OVERLAY (HYBRID)
Combines BiSeNet (Precision) + MediaPipe (Robustness)
Best of both worlds: "Instagram Filter" quality with reliable fail-safes.
"""

import sys
from pathlib import Path
import cv2
import numpy as np
import torch
from torchvision import transforms
from PIL import Image

# 1. SETUP BISENET PATH
BISENET_PATH = Path(__file__).parent / "BiSeNet"
sys.path.insert(0, str(BISENET_PATH))

# 2. IMPORT MODULES
try:
    from model import BiSeNet as BiSeNetModel
    BISENET_AVAILABLE = True
except ImportError:
    print("[Smart Overlay] BiSeNet model not available")
    BISENET_AVAILABLE = False

try:
    from utils.hair_isolator import get_hair_isolator
    ISOLATOR_AVAILABLE = True
except ImportError:
    print("[Smart Overlay] MediaPipe Isolator not found")
    ISOLATOR_AVAILABLE = False


class SimplifiedSmartOverlay:
    """Hybrid Smart Overlay: BiSeNet -> MediaPipe -> Fallback"""
    
    def __init__(self):
        print(f"[Smart Overlay] Initializing Hybrid System...")
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        # Load BiSeNet (Primary)
        self.bisenet = None
        if BISENET_AVAILABLE:
            self.bisenet = self._load_bisenet()
            self.transform = transforms.Compose([
                transforms.Resize((512, 512)),
                transforms.ToTensor(),
                transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
            ])
            
        # Load Isolator (Secondary)
        self.isolator = None
        if ISOLATOR_AVAILABLE:
            self.isolator = get_hair_isolator()
            
    def _load_bisenet(self):
        """Load BiSeNet model"""
        try:
            model_path = BISENET_PATH / "res" / "cp" / "79999_iter.pth"
            if not model_path.exists():
                return None
            
            model = BiSeNetModel(n_classes=19)
            model.load_state_dict(torch.load(str(model_path), map_location=self.device))
            model.to(self.device)
            model.eval()
            print("[Smart Overlay] BiSeNet Loaded (Primary Engine)")
            return model
        except Exception:
            return None

    def get_hair_mask(self, img):
        """Get hair mask using Hybrid Strategy"""
        mask = None
        
        # STRATEGY 1: BiSeNet (Best for "Hair Only" / Removing Clothes)
        if self.bisenet is not None:
            try:
                h_orig, w_orig = img.shape[:2]
                img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                img_tensor = self.transform(img_pil).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    out = self.bisenet(img_tensor)[0]
                
                parsing = out.squeeze(0).cpu().numpy().argmax(0)
                parsing_resized = cv2.resize(parsing.astype(np.uint8), (w_orig, h_orig), interpolation=cv2.INTER_NEAREST)
                
                # Label 17 is Hair
                mask_candidate = (parsing_resized == 17).astype(np.uint8) * 255
                
                # Validate
                if cv2.countNonZero(mask_candidate) > 500:
                    print("[Smart Overlay] BiSeNet Success (Clean Hair Extraction)")
                    return mask_candidate
                else:
                    print("[Smart Overlay] BiSeNet returned empty mask")
            except Exception as e:
                print(f"[Smart Overlay] BiSeNet Failed: {e}")
        
        # STRATEGY 2: MediaPipe Isolator (Robustness)
        if self.isolator is not None:
            try:
                print("[Smart Overlay] Trying MediaPipe Fallback...")
                mask_candidate = self.isolator.isolate_hair(img)
                if cv2.countNonZero(mask_candidate) > 500:
                    print("[Smart Overlay] MediaPipe Success")
                    return mask_candidate
            except Exception as e:
                print(f"[Smart Overlay] MediaPipe Failed: {e}")
                
        return None  # All failed
    
    def overlay_hair_simple(self, face_img, hair_img, landmarks):
        """Smart overlay: Hybrid Mask + Poisson Blending"""
        try:
            print("[Smart Overlay] Starting overlay phase...")
            
            # Position new hair
            positioned_hair, new_hair_mask = self._position_hair(face_img, hair_img, landmarks)
            
            if positioned_hair is None:
                print("[Smart Overlay] Positioning failed")
                return face_img
            
            # Smart blending
            result = self._smart_alpha_blend(face_img, positioned_hair, new_hair_mask)
            
            print("[Smart Overlay] Completed Successfully")
            return result
            
        except Exception as e:
            msg = f"[Smart Overlay] ERROR: {e}"
            print(msg)
            try:
                with open("debug_log.txt", "a") as f:
                    f.write(msg + "\n")
                    import traceback
                    f.write(traceback.format_exc() + "\n")
            except:
                pass
            return face_img
    
    def _crop_to_content(self, img, mask):
        """Crop image to the bounding box of the mask content"""
        if mask is None:
            return img, mask
        
        coords = cv2.findNonZero(mask)
        if coords is None:
            return img, mask
            
        x, y, w, h = cv2.boundingRect(coords)
        
        # Add small padding
        pad = 10
        x = max(0, x - pad)
        y = max(0, y - pad)
        w = min(img.shape[1] - x, w + 2*pad)
        h = min(img.shape[0] - y, h + 2*pad)
        
        img_cropped = img[y:y+h, x:x+w]
        mask_cropped = mask[y:y+h, x:x+w]
        return img_cropped, mask_cropped

    def _position_hair(self, face_img, hair_img, landmarks):
        """Position hair based on landmarks"""
        try:
            face_h, face_w = face_img.shape[:2]
        
            # Landmarks (pixel coords)
            left = landmarks[234]
            right = landmarks[454]
            forehead = landmarks[10]
            
            face_width = right[0] - left[0]
            
            # Extract RGB/Alpha
            if hair_img.shape[2] == 4:
                hair_rgb = hair_img[:, :, :3]
                original_alpha = hair_img[:, :, 3]
            else:
                hair_rgb = hair_img
                original_alpha = None  

            # PRIORITY: Use pre-processed alpha channel if available
            if original_alpha is not None and cv2.countNonZero(original_alpha) > 100:
                print("  [Using pre-processed alpha]")
                alpha = original_alpha
            else:
                # Fallback: Extract hair if no alpha or alpha is empty
                print("  [Extracting hair - no pre-processed alpha]")
                alpha = self.get_hair_mask(hair_rgb)
                
                # If extraction failed, use simple threshold
                if alpha is None or cv2.countNonZero(alpha) < 100:
                    gray = cv2.cvtColor(hair_rgb, cv2.COLOR_BGR2GRAY)
                    _, alpha = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

            # SMART CROP: Remove empty whitespace around hair
            # This is critical for correct positioning!
            hair_rgb, alpha = self._crop_to_content(hair_rgb, alpha)

            # Now calculate dimensions based on CROPPED hair
            hair_width = int(face_width * 1.6)  # Balanced size for natural coverage
            hair_height = int(hair_rgb.shape[0] * (hair_width / hair_rgb.shape[1]))
            
            # NUCLEAR OPTION: If still empty
            if cv2.countNonZero(alpha) < 100:
                print("[Smart Overlay] NUCLEAR OPTION: Full Visibility")
                alpha = np.ones((hair_img.shape[0], hair_img.shape[1]), dtype=np.uint8) * 255

            # Resize hair and alpha mask
            alpha_resized = cv2.resize(alpha, (hair_width, hair_height), interpolation=cv2.INTER_LANCZOS4)
            hair_resized = cv2.resize(hair_rgb, (hair_width, hair_height), interpolation=cv2.INTER_LANCZOS4)
            
            # Position 
            x1 = int(left[0] - (hair_width - face_width) / 2)
            # Adjusted positioning for natural hairline (not too high, not covering face)
            y1 = int(forehead[1] - hair_height * 0.70) 
            
            x2 = x1 + hair_width
            y2 = y1 + hair_height
            
            # Create canvas
            positioned = np.zeros((face_h, face_w, 3), dtype=np.uint8)
            mask_canvas = np.zeros((face_h, face_w), dtype=np.uint8)
            
            # Boundaries logic
            hair_x1, hair_y1 = 0, 0
            hair_x2, hair_y2 = hair_width, hair_height
            
            if x1 < 0: hair_x1 = -x1; x1 = 0
            if y1 < 0: hair_y1 = -y1; y1 = 0
            if x2 > face_w: hair_x2 = hair_width - (x2 - face_w); x2 = face_w
            if y2 > face_h: hair_y2 = hair_height - (y2 - face_h); y2 = face_h
            
            if x2 <= x1 or y2 <= y1: 
                return None, None
            
            positioned[y1:y2, x1:x2] = hair_resized[hair_y1:hair_y2, hair_x1:hair_x2]
            mask_canvas[y1:y2, x1:x2] = alpha_resized[hair_y1:hair_y2, hair_x1:hair_x2]
            
            return positioned, mask_canvas
            
        except Exception as e:
            print(f"[Smart Overlay] Position error: {e}")
            return None, None
    
    def _smart_alpha_blend(self, face_img, hair_img, hair_mask):
        """
        Applies Standard Alpha Blending with improved edge handling.
        """
        try:
            # 1. Clean the mask (Binary Threshold)
            _, binary_mask = cv2.threshold(hair_mask, 127, 255, cv2.THRESH_BINARY)
            
            # 2. Slightly blur for anti-aliased edges (no erosion to prevent face transparency)
            alpha_soft = cv2.GaussianBlur(binary_mask, (7, 7), 1.5)
            
            # 4. Standard Alpha Blending
            # Normalize alpha to 0.0 - 1.0
            alpha_norm = alpha_soft.astype(float) / 255.0
            alpha_3ch = np.stack([alpha_norm]*3, axis=2)
            
            # Blend: Result = (Hair * Alpha) + (Face * (1 - Alpha))
            face_float = face_img.astype(float)
            hair_float = hair_img.astype(float)
            
            result = (hair_float * alpha_3ch) + (face_float * (1 - alpha_3ch))
            
            return np.clip(result, 0, 255).astype(np.uint8)
            
        except Exception as e:
            print(f"[Smart Overlay] Blending Failed: {e}")
            return face_img


# Singleton
_simple_overlay = None

def get_simple_bisenet_overlay():
    """Get singleton instance (Updated to Smart Overlay)"""
    global _simple_overlay
    if _simple_overlay is None:
        _simple_overlay = SimplifiedSmartOverlay()
    return _simple_overlay
