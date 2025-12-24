import cv2
import numpy as np

def overlay_hair(face_img, hair_img, landmarks):
    """
    Overlay hair image onto face image using facial landmarks with natural blending.
    
    Args:
        face_img: BGR face image
        hair_img: BGRA hair image with alpha channel
        landmarks: List of facial landmarks (x, y) tuples
    
    Returns:
        Face image with hair overlay
    """
    # Validate inputs
    print(f"[OVERLAY] Starting overlay_hair")
    print(f"[OVERLAY] face_img: {face_img.shape if face_img is not None else 'None'}")
    print(f"[OVERLAY] hair_img: {hair_img.shape if hair_img is not None else 'None'}")
    print(f"[OVERLAY] landmarks: {len(landmarks) if landmarks is not None else 'None'}")
    
    if face_img is None or hair_img is None or landmarks is None:
        print("[OVERLAY] ERROR: Invalid inputs, returning original")
        return face_img
    
    if len(landmarks) < 468:
        print(f"Warning: Not enough landmarks ({len(landmarks)})")
        return face_img
    
    # Check if hair image has alpha channel
    if hair_img.shape[2] != 4:
        print(f"Warning: Hair image doesn't have alpha channel, channels={hair_img.shape[2]}")
        if hair_img.shape[2] == 3:
            hair_img = cv2.cvtColor(hair_img, cv2.COLOR_BGR2BGRA)
        else:
            return face_img
    
    try:
        # Get key facial landmarks
        left = landmarks[234]   # Left temple
        right = landmarks[454]  # Right temple  
        forehead = landmarks[10]  # Top of forehead
        chin = landmarks[152]     # Bottom of chin
        
        # Calculate face dimensions
        face_width = abs(right[0] - left[0])
        face_height = abs(chin[1] - forehead[1])
        
        if face_width <= 0 or face_height <= 0:
            print("Warning: Invalid face dimensions")
            return face_img
        
        # Make hair significantly larger for better coverage
        hair_width = int(face_width * 2.0)  # Increased from 1.5 to 2.0
        ratio = hair_img.shape[0] / hair_img.shape[1]
        hair_height = int(hair_width * ratio)
        
        if hair_width <= 0 or hair_height <= 0:
            print("Warning: Invalid hair dimensions")
            return face_img
        
        # Resize hair with high quality interpolation
        hair = cv2.resize(hair_img, (hair_width, hair_height), interpolation=cv2.INTER_LANCZOS4)
        
        # Calculate position - center and optimal height
        x1 = int(left[0] - (hair_width - face_width) / 2)
        # Optimal positioning - covers hair area without covering face
        y1 = int(forehead[1] - hair_height * 0.85)  # Optimized value
        
        x2 = x1 + hair_width
        y2 = y1 + hair_height
        
        # Get face image dimensions
        face_h, face_w = face_img.shape[:2]
        
        # Crop hair if needed to fit within face image bounds
        hair_x1, hair_y1 = 0, 0
        hair_x2, hair_y2 = hair_width, hair_height
        
        if x1 < 0:
            hair_x1 = -x1
            x1 = 0
        if y1 < 0:
            hair_y1 = -y1
            y1 = 0
        if x2 > face_w:
            hair_x2 = hair_width - (x2 - face_w)
            x2 = face_w
        if y2 > face_h:
            hair_y2 = hair_height - (y2 - face_h)
            y2 = face_h
        
        # Check valid region
        if x2 <= x1 or y2 <= y1 or hair_x2 <= hair_x1 or hair_y2 <= hair_y1:
            print("Warning: No valid overlay region")
            return face_img
        
        # Crop hair to fit
        hair_cropped = hair[hair_y1:hair_y2, hair_x1:hair_x2]
        
        # Verify dimensions
        overlay_h = y2 - y1
        overlay_w = x2 - x1
        
        if hair_cropped.shape[0] != overlay_h or hair_cropped.shape[1] != overlay_w:
            hair_cropped = cv2.resize(hair_cropped, (overlay_w, overlay_h), 
                                     interpolation=cv2.INTER_LANCZOS4)
        
        # Extract RGB and alpha
        hair_rgb = hair_cropped[:, :, :3]
        alpha_original = hair_cropped[:, :, 3].astype(float) / 255.0
        
        # Create enhanced alpha with edge feathering for natural blend
        alpha = alpha_original.copy()
        
        # Apply Gaussian blur to alpha for soft edges
        alpha = cv2.GaussianBlur(alpha, (21, 21), 10)  # Larger kernel for softer blend
        
        # Create gradient mask for top-to-bottom fade
        gradient = np.linspace(1.0, 0.5, overlay_h).reshape(-1, 1)
        gradient = np.tile(gradient, (1, overlay_w))
        alpha = alpha * gradient
        
        # Add side feathering for even more natural look
        side_feather = 50  # pixels to feather from each side
        if overlay_w > side_feather * 2:
            for i in range(side_feather):
                fade = i / side_feather
                alpha[:, i] *= fade
                alpha[:, -(i+1)] *= fade
        
        # Expand alpha to 3 channels for blending
        alpha_3ch = np.stack([alpha, alpha, alpha], axis=2)
        
        # Get face region
        face_region = face_img[y1:y2, x1:x2].astype(float)
        
        # Adjust hair color to match face lighting (simple color correction)
        # Sample face region color for white balance
        face_mean = np.mean(face_region, axis=(0, 1))
        hair_mean = np.mean(hair_rgb, axis=(0, 1))
        
        # Color correction factor (subtle)
        color_ratio = face_mean / (hair_mean + 1e-6)
        color_ratio = np.clip(color_ratio, 0.8, 1.2)  # Limit correction
        
        hair_adjusted = hair_rgb.astype(float) * color_ratio
        hair_adjusted = np.clip(hair_adjusted, 0, 255)
        
        # Blend using alpha compositing with color-matched hair
        blended = (alpha_3ch * hair_adjusted + (1 - alpha_3ch) * face_region)
        blended = np.clip(blended, 0, 255).astype(np.uint8)
        
        # Copy back to face image
        face_img[y1:y2, x1:x2] = blended
        
        print(f"[OVERLAY] SUCCESS: Hair overlaid at ({x1},{y1}) to ({x2},{y2})")
        return face_img
        
    except Exception as e:
        print(f"Error in overlay_hair: {e}")
        import traceback
        traceback.print_exc()
        return face_img
