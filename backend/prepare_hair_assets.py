"""
Hair Asset Pre-Processing Script
Extracts isolated hair from full-person photos and saves as transparent PNGs.

Usage:
    python prepare_hair_assets.py [--input hairstyles] [--output hairstyles_processed]
"""

import sys
import cv2
import numpy as np
from pathlib import Path
import argparse
from tqdm import tqdm

# Add BiSeNet to path
BISENET_PATH = Path(__file__).parent / "BiSeNet"
sys.path.insert(0, str(BISENET_PATH))

# Try to import BiSeNet
try:
    import torch
    from torchvision import transforms
    from PIL import Image
    from model import BiSeNet as BiSeNetModel
    BISENET_AVAILABLE = True
except ImportError:
    BISENET_AVAILABLE = False
    print("[Warning] BiSeNet not available, will use MediaPipe only")

# Try to import MediaPipe
try:
    from utils.hair_isolator import get_hair_isolator
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print("[Warning] MediaPipe not available, will use thresholding only")


class HairExtractor:
    """Extract isolated hair using hybrid approach"""
    
    def __init__(self):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.bisenet = None
        self.isolator = None
        
        # Load BiSeNet if available
        if BISENET_AVAILABLE:
            self.bisenet = self._load_bisenet()
            if self.bisenet:
                self.transform = transforms.Compose([
                    transforms.Resize((512, 512)),
                    transforms.ToTensor(),
                    transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
                ])
        
        # Load MediaPipe if available
        if MEDIAPIPE_AVAILABLE:
            self.isolator = get_hair_isolator()
    
    def _load_bisenet(self):
        """Load BiSeNet model"""
        try:
            model_path = BISENET_PATH / "res" / "cp" / "79999_iter.pth"
            if not model_path.exists():
                print("[BiSeNet] Model not found")
                return None
            
            model = BiSeNetModel(n_classes=19)
            model.load_state_dict(torch.load(str(model_path), map_location=self.device))
            model.to(self.device)
            model.eval()
            print("[BiSeNet] Model loaded successfully")
            return model
        except Exception as e:
            print(f"[BiSeNet] Failed to load: {e}")
            return None
    
    def extract_mask(self, img):
        """Extract hair mask using hybrid approach"""
        
        # Strategy 1: BiSeNet (Best quality)
        if self.bisenet is not None:
            try:
                h, w = img.shape[:2]
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img_pil = Image.fromarray(img_rgb)
                img_tensor = self.transform(img_pil).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    out = self.bisenet(img_tensor)[0]
                
                parsing = out.squeeze(0).cpu().numpy().argmax(0)
                parsing_resized = cv2.resize(parsing.astype(np.uint8), (w, h), 
                                            interpolation=cv2.INTER_NEAREST)
                
                # Label 17 is Hair
                mask = (parsing_resized == 17).astype(np.uint8) * 255
                
                if cv2.countNonZero(mask) > 500:
                    print("  [BiSeNet] ✓")
                    return mask
            except Exception as e:
                print(f"  [BiSeNet] Failed: {e}")
        
        # Strategy 2: MediaPipe (Fallback)
        if self.isolator is not None:
            try:
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                mask = self.isolator.isolate_hair(img_rgb)
                if cv2.countNonZero(mask) > 500:
                    print("  [MediaPipe] ✓")
                    return mask
            except Exception as e:
                print(f"  [MediaPipe] Failed: {e}")
        
        # Strategy 3: Simple thresholding (Last resort)
        print("  [Threshold] ✓")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        return mask
    
    def feather_mask(self, mask, kernel_size=15, sigma=5):
        """Apply Gaussian blur to create soft edges"""
        # Ensure mask is float
        mask_float = mask.astype(float)
        
        # Apply Gaussian blur
        feathered = cv2.GaussianBlur(mask_float, (kernel_size, kernel_size), sigma)
        
        return feathered.astype(np.uint8)
    
    def crop_to_content(self, img, mask, padding=20):
        """Crop image to content bounding box"""
        # Find non-zero mask pixels
        coords = cv2.findNonZero(mask)
        if coords is None:
            return img, mask
        
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(coords)
        
        # Add padding
        img_h, img_w = img.shape[:2]
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(img_w, x + w + padding)
        y2 = min(img_h, y + h + padding)
        
        # Crop
        cropped_img = img[y1:y2, x1:x2]
        cropped_mask = mask[y1:y2, x1:x2]
        
        return cropped_img, cropped_mask
    
    def process_image(self, input_path, output_path):
        """Process single image: extract hair and save as RGBA PNG"""
        try:
            # Load image
            img = cv2.imread(str(input_path))
            if img is None:
                print(f"  ✗ Failed to load image")
                return False
            
            # Extract hair mask
            mask = self.extract_mask(img)
            
            # Feather edges for natural look
            feathered_mask = self.feather_mask(mask, kernel_size=21, sigma=7)
            
            # Crop to content
            cropped_img, cropped_mask = self.crop_to_content(img, feathered_mask, padding=30)
            
            # Create RGBA image
            rgba = np.dstack([cropped_img, cropped_mask])
            
            # Save
            output_path.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(output_path), rgba)
            
            return True
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return False


def process_directory(input_dir, output_dir, extractor):
    """Process all PNG files in directory structure"""
    
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    if not input_path.exists():
        print(f"Error: Input directory not found: {input_path}")
        return
    
    # Find all PNG files
    png_files = list(input_path.rglob("*.png"))
    
    if not png_files:
        print(f"No PNG files found in {input_path}")
        return
    
    print(f"\nFound {len(png_files)} PNG files to process")
    print(f"Input:  {input_path}")
    print(f"Output: {output_path}\n")
    
    success_count = 0
    fail_count = 0
    
    # Process each file with progress bar
    for png_file in tqdm(png_files, desc="Processing", unit="file"):
        # Calculate relative path
        rel_path = png_file.relative_to(input_path)
        out_file = output_path / rel_path
        
        print(f"\n{rel_path}")
        
        if extractor.process_image(png_file, out_file):
            success_count += 1
        else:
            fail_count += 1
    
    # Summary
    print(f"\n{'='*50}")
    print(f"Processing complete!")
    print(f"  Success: {success_count}")
    print(f"  Failed:  {fail_count}")
    print(f"{'='*50}\n")


def main():
    parser = argparse.ArgumentParser(description='Pre-process hair assets')
    parser.add_argument('--input', default='hairstyles', 
                       help='Input directory with hair assets')
    parser.add_argument('--output', default='hairstyles_processed',
                       help='Output directory for processed assets')
    
    args = parser.parse_args()
    
    print("="*50)
    print("Hair Asset Pre-Processing Tool")
    print("="*50)
    
    # Initialize extractor
    print("\nInitializing extractors...")
    extractor = HairExtractor()
    
    # Process directory
    process_directory(args.input, args.output, extractor)
    
    print(f"\nProcessed assets saved to: {args.output}")
    print("To use them, update HAIR_DIR in main.py to point to this directory.\n")


if __name__ == "__main__":
    main()
