"""
Realistic Hair Overlay with Poisson Blending and LAB Color Matching
Achieves natural-looking hair try-on without requiring deep learning models.
"""

import cv2
import numpy as np


def overlay_hair_realistic(face_img, hair_img, landmarks):
    """
    Overlay hair image onto face with realistic blending using Poisson and LAB color matching.
    
    Args:
        face_img: BGR face image
        hair_img: BGRA hair image with alpha channel (or BGR)
        landmarks: List of facial landmarks (x, y) tuples (468 landmarks from MediaPipe)
    
    Returns:
        Face image with realistic hair overlay
    """
    # Validate inputs
    print(f"[REALISTIC] Starting realistic overlay")
    print(f"[REALISTIC] face_img: {face_img.shape if face_img is not None else 'None'}")
    print(f"[REALISTIC] hair_img: {hair_img.shape if hair_img is not None else 'None'}")
    print(f"[REALISTIC] landmarks: {len(landmarks) if landmarks is not None else 'None'}")
    
    if face_img is None or hair_img is None or landmarks is None:
        print("[REALISTIC] ERROR: Invalid inputs")
        return face_img
    
    if len(landmarks) < 468:
        print(f"[REALISTIC] WARNING: Not enough landmarks ({len(landmarks)})")
        return face_img
    
    # Ensure hair image has alpha channel
    if hair_img.shape[2] == 3:
        # Convert BGR to BGRA by adding full opacity alpha channel
        print("[REALISTIC] Adding alpha channel to hair image")
        alpha = np.ones((hair_img.shape[0], hair_img.shape[1], 1), dtype=np.uint8) * 255
        hair_img = np.concatenate([hair_img, alpha], axis=2)
    elif hair_img.shape[2] != 4:
        print(f"[REALISTIC] ERROR: Unexpected hair channels: {hair_img.shape[2]}")
        return face_img
    
    try:
        # Step 1: Position and resize hair based on facial landmarks
        positioned_hair, alpha_mask, region_coords = _position_hair(face_img, hair_img, landmarks)
        
        if positioned_hair is None or alpha_mask is None:
            print("[REALISTIC] ERROR: Hair positioning failed")
            return face_img
        
        x1, y1, x2, y2 = region_coords
        
        # Step 2: LAB color matching for natural lighting harmony
        face_region = face_img[y1:y2, x1:x2]
        hair_rgb = positioned_hair[y1:y2, x1:x2]
        
        hair_color_matched = _match_lab_color(hair_rgb, face_region)
        
        # Step 3: Create enhanced alpha mask with multi-level feathering
        overlay_h = y2 - y1
        overlay_w = x2 - x1
        alpha_region = alpha_mask[y1:y2, x1:x2]
        
        enhanced_alpha = _create_enhanced_mask(alpha_region, overlay_h, overlay_w)
        
        # Step 4: Try Poisson blending (seamless clone) for best results
        result = _poisson_blend_safe(
            face_img.copy(),
            positioned_hair,
            alpha_mask,
            (x1, y1, x2, y2),
            hair_color_matched,
            enhanced_alpha
        )
        
        # Step 5: Add subtle shadows for depth perception
        result = _add_soft_shadows(result, (x1, y1, x2, y2), enhanced_alpha)
        
        print(f"[REALISTIC] SUCCESS: Realistic overlay at ({x1},{y1}) to ({x2},{y2})")
        return result
        
    except Exception as e:
        print(f"[REALISTIC] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return face_img


def _position_hair(face_img, hair_img, landmarks):
    """
    Position and resize hair based on facial landmarks.
    
    Returns:
        (positioned_hair, alpha_mask, (x1, y1, x2, y2)) or (None, None, None)
    """
    # Extract RGB and alpha from hair
    hair_rgb = hair_img[:, :, :3]
    alpha = hair_img[:, :, 3]
    
    # Get key facial landmarks
    left_temple = landmarks[234]    # Left temple
    right_temple = landmarks[454]   # Right temple  
    forehead = landmarks[10]        # Top of forehead
    chin = landmarks[152]           # Bottom of chin
    
    # Calculate face dimensions
    face_width = abs(right_temple[0] - left_temple[0])
    face_height = abs(chin[1] - forehead[1])
    
    if face_width <= 0 or face_height <= 0:
        print("[REALISTIC] Invalid face dimensions")
        return None, None, None
    
    # Size hair for good coverage (2x width)
    hair_width = int(face_width * 2.0)
    ratio = hair_rgb.shape[0] / hair_rgb.shape[1]
    hair_height = int(hair_width * ratio)
    
    if hair_width <= 0 or hair_height <= 0:
        print("[REALISTIC] Invalid hair dimensions")
        return None, None, None
    
    # Resize hair and alpha with high quality
    hair_resized = cv2.resize(hair_rgb, (hair_width, hair_height), 
                             interpolation=cv2.INTER_LANCZOS4)
    alpha_resized = cv2.resize(alpha, (hair_width, hair_height),
                              interpolation=cv2.INTER_LANCZOS4)
    
    # Calculate position - center horizontally, optimal vertical
    x1 = int(left_temple[0] - (hair_width - face_width) / 2)
    y1 = int(forehead[1] - hair_height * 0.85)  # Cover hair area without covering face
    
    x2 = x1 + hair_width
    y2 = y1 + hair_height
    
    # Get face image dimensions
    face_h, face_w = face_img.shape[:2]
    
    # Create full-size canvas for positioned hair
    positioned = np.zeros((face_h, face_w, 3), dtype=np.uint8)
    alpha_canvas = np.zeros((face_h, face_w), dtype=np.uint8)
    
    # Crop hair if it extends beyond image bounds
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
        print("[REALISTIC] No valid overlay region")
        return None, None, None
    
    # Place cropped hair on canvas
    hair_crop = hair_resized[hair_y1:hair_y2, hair_x1:hair_x2]
    alpha_crop = alpha_resized[hair_y1:hair_y2, hair_x1:hair_x2]
    
    positioned[y1:y2, x1:x2] = hair_crop
    alpha_canvas[y1:y2, x1:x2] = alpha_crop
    
    return positioned, alpha_canvas, (x1, y1, x2, y2)


def _match_lab_color(hair_rgb, face_region):
    """
    Match hair color to face lighting using LAB color space.
    LAB separates luminance (L) from color (A, B) for better matching.
    
    Args:
        hair_rgb: Hair image region (BGR)
        face_region: Face image region (BGR)
    
    Returns:
        Color-matched hair (BGR)
    """
    if hair_rgb.shape != face_region.shape:
        print(f"[REALISTIC] LAB matching skipped - shape mismatch")
        return hair_rgb
    
    try:
        # Convert to LAB color space
        hair_lab = cv2.cvtColor(hair_rgb, cv2.COLOR_BGR2LAB).astype(np.float32)
        face_lab = cv2.cvtColor(face_region, cv2.COLOR_BGR2LAB).astype(np.float32)
        
        # Calculate mean and std for each channel
        hair_mean = np.mean(hair_lab, axis=(0, 1))
        hair_std = np.std(hair_lab, axis=(0, 1))
        face_mean = np.mean(face_lab, axis=(0, 1))
        face_std = np.std(face_lab, axis=(0, 1))
        
        # Match statistics (Reinhard color transfer)
        matched_lab = hair_lab.copy()
        for i in range(3):
            if hair_std[i] > 1e-6:  # Avoid division by zero
                matched_lab[:, :, i] = ((hair_lab[:, :, i] - hair_mean[i]) * 
                                        (face_std[i] / hair_std[i])) + face_mean[i]
        
        # Clip to valid LAB ranges
        matched_lab[:, :, 0] = np.clip(matched_lab[:, :, 0], 0, 255)    # L: 0-100 (scaled to 0-255)
        matched_lab[:, :, 1] = np.clip(matched_lab[:, :, 1], 0, 255)    # A: 0-255 (shifted)
        matched_lab[:, :, 2] = np.clip(matched_lab[:, :, 2], 0, 255)    # B: 0-255 (shifted)
        
        # Convert back to BGR
        matched_bgr = cv2.cvtColor(matched_lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
        
        # Blend with original for subtle effect (70% matched, 30% original)
        result = cv2.addWeighted(matched_bgr, 0.7, hair_rgb, 0.3, 0)
        
        print("[REALISTIC] LAB color matching applied")
        return result
        
    except Exception as e:
        print(f"[REALISTIC] LAB matching failed: {e}, using original")
        return hair_rgb


def _create_enhanced_mask(alpha, overlay_h, overlay_w):
    """
    Create enhanced alpha mask with multi-level feathering for natural blending.
    
    Args:
        alpha: Original alpha channel (2D array)
        overlay_h: Height of overlay region
        overlay_w: Width of overlay region
    
    Returns:
        Enhanced alpha mask (2D float array, 0.0-1.0)
    """
    # Convert to float [0, 1]
    alpha_float = alpha.astype(float) / 255.0
    
    # Apply Gaussian blur for soft edges
    alpha_smooth = cv2.GaussianBlur(alpha_float, (21, 21), 10)
    
    # Create vertical gradient (top=1.0, bottom=0.6) for natural fade
    gradient_vertical = np.linspace(1.0, 0.6, overlay_h).reshape(-1, 1)
    gradient_vertical = np.tile(gradient_vertical, (1, overlay_w))
    
    # Apply vertical gradient
    alpha_smooth = alpha_smooth * gradient_vertical
    
    # Add horizontal feathering from sides (50 pixels)
    side_feather = min(50, overlay_w // 4)
    if overlay_w > side_feather * 2:
        for i in range(side_feather):
            fade_factor = i / side_feather
            alpha_smooth[:, i] *= fade_factor
            alpha_smooth[:, -(i+1)] *= fade_factor
    
    # Add top feathering for even more natural hairline
    top_feather = min(30, overlay_h // 6)
    for i in range(top_feather):
        fade_factor = i / top_feather
        alpha_smooth[i, :] *= fade_factor
    
    return alpha_smooth


def _poisson_blend_safe(face_img, positioned_hair, alpha_mask, coords, color_matched_hair, enhanced_alpha):
    """
    Safely apply Poisson blending with fallback to enhanced alpha blending.
    
    Args:
        face_img: Full face image
        positioned_hair: Full-size positioned hair
        alpha_mask: Full-size alpha mask
        coords: (x1, y1, x2, y2) region coordinates
        color_matched_hair: Color-matched hair region
        enhanced_alpha: Enhanced alpha mask for region
    
    Returns:
        Blended result
    """
    x1, y1, x2, y2 = coords
    
    # Try Poisson blending first
    try:
        # Create binary mask from alpha (Poisson needs binary mask)
        _, mask_binary = cv2.threshold(alpha_mask, 10, 255, cv2.THRESH_BINARY)
        
        # Find center of mass for cloning
        moments = cv2.moments(mask_binary)
        if moments["m00"] > 0:
            center_x = int(moments["m10"] / moments["m00"])
            center_y = int(moments["m01"] / moments["m00"])
            center = (center_x, center_y)
            
            # Apply Poisson blending
            print("[REALISTIC] Applying Poisson blending")
            result = cv2.seamlessClone(
                positioned_hair,
                face_img,
                mask_binary,
                center,
                cv2.MIXED_CLONE  # MIXED_CLONE blends textures naturally
            )
            
            # Post-process: re-apply color matched hair with alpha for even better result
            face_region = result[y1:y2, x1:x2].astype(float)
            hair_region = color_matched_hair.astype(float)
            alpha_3ch = np.stack([enhanced_alpha, enhanced_alpha, enhanced_alpha], axis=2)
            
            # Gentle blend on top of Poisson result
            final_region = (alpha_3ch * 0.3 * hair_region + 
                          (1 - alpha_3ch * 0.3) * face_region)
            final_region = np.clip(final_region, 0, 255).astype(np.uint8)
            
            result[y1:y2, x1:x2] = final_region
            return result
            
    except Exception as e:
        print(f"[REALISTIC] Poisson blending failed: {e}, using enhanced alpha blend")
    
    # Fallback: Enhanced alpha blending
    return _enhanced_alpha_blend(face_img, coords, color_matched_hair, enhanced_alpha)


def _enhanced_alpha_blend(face_img, coords, hair_region, alpha_mask):
    """
    Fallback: Enhanced alpha blending with color-matched hair.
    
    Args:
        face_img: Full face image
        coords: (x1, y1, x2, y2)
        hair_region: Color-matched hair for region
        alpha_mask: Enhanced alpha mask (2D float)
    
    Returns:
        Blended result
    """
    x1, y1, x2, y2 = coords
    result = face_img.copy()
    
    # Get face region
    face_region = result[y1:y2, x1:x2].astype(float)
    hair_float = hair_region.astype(float)
    
    # Expand alpha to 3 channels
    alpha_3ch = np.stack([alpha_mask, alpha_mask, alpha_mask], axis=2)
    
    # Alpha blending
    blended = (alpha_3ch * hair_float + (1 - alpha_3ch) * face_region)
    blended = np.clip(blended, 0, 255).astype(np.uint8)
    
    result[y1:y2, x1:x2] = blended
    
    print("[REALISTIC] Enhanced alpha blending applied")
    return result


def _add_soft_shadows(face_img, coords, alpha_mask):
    """
    Add subtle shadows around hairline for depth perception.
    
    Args:
        face_img: Face image with hair overlay
        coords: (x1, y1, x2, y2)
        alpha_mask: Enhanced alpha mask
    
    Returns:
        Image with shadows
    """
    try:
        x1, y1, x2, y2 = coords
        
        # Create shadow mask from alpha edges
        alpha_uint8 = (alpha_mask * 255).astype(np.uint8)
        
        # Detect edges of hair
        edges = cv2.Canny(alpha_uint8, 50, 150)
        
        # Dilate edges to create shadow region
        kernel = np.ones((5, 5), np.uint8)
        shadow_mask = cv2.dilate(edges, kernel, iterations=2)
        
        # Blur shadow for soft effect
        shadow_mask = cv2.GaussianBlur(shadow_mask, (15, 15), 5)
        shadow_mask = shadow_mask.astype(float) / 255.0 * 0.15  # 15% max darkening
        
        # Apply shadow to face region
        result = face_img.copy()
        region = result[y1:y2, x1:x2].astype(float)
        
        # Darken based on shadow mask
        shadow_3ch = np.stack([shadow_mask, shadow_mask, shadow_mask], axis=2)
        darkened = region * (1 - shadow_3ch)
        darkened = np.clip(darkened, 0, 255).astype(np.uint8)
        
        result[y1:y2, x1:x2] = darkened
        
        print("[REALISTIC] Soft shadows added")
        return result
        
    except Exception as e:
        print(f"[REALISTIC] Shadow generation failed: {e}")
        return face_img
