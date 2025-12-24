import cv2
import numpy as np
import mediapipe as mp

class HairIsolator:
    """
    Robust hair isolation using MediaPipe:
    1. Selfie Segmentation to remove background
    2. Face Mesh to remove the face (skin)
    Result = Hair
    """
    def __init__(self):
        self.mp_selfie = mp.solutions.selfie_segmentation
        self.mp_face = mp.solutions.face_mesh
        
        # Initialize models
        self.segmenter = self.mp_selfie.SelfieSegmentation(model_selection=1) # 1 = landscape/better quality
        self.face_mesh = self.mp_face.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )

    def isolate_hair(self, image_rgb):
        """
        Extract hair mask from an image.
        Returns: binary mask (255=hair, 0=bg/face)
        """
        h, w = image_rgb.shape[:2]
        
        # 1. Get Person Mask (Person vs Background)
        results_seg = self.segmenter.process(image_rgb)
        person_mask = (results_seg.segmentation_mask > 0.5).astype(np.uint8) * 255
        
        # 2. Get Face Mask (Skin area to subtract)
        results_mesh = self.face_mesh.process(image_rgb)
        face_mask = np.zeros((h, w), dtype=np.uint8)
        
        if results_mesh.multi_face_landmarks:
            landmarks = results_mesh.multi_face_landmarks[0].landmark
            
            # Define face contour (chin + sides + forehead)
            # Use specific indices for face boundary
            face_oval_indices = [
                10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 
                397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 
                172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
            ]
            
            points = []
            for idx in face_oval_indices:
                x = int(landmarks[idx].x * w)
                y = int(landmarks[idx].y * h)
                points.append((x, y))
            
            # Draw filled polygon for face
            if points:
                # 1. Main Face Mask
                cv2.fillPoly(face_mask, [np.array(points)], 255)
                
                # 2. Neck Masking (Heuristic: Extend chin downwards)
                chin_pt = points[18] # Index 152 is roughly at index 18 in our list matching above? 
                # Wait, let's just use landmarks[152] directly for chin
                chin_x = int(landmarks[152].x * w)
                chin_y = int(landmarks[152].y * h)
                
                # Create a trapezoid extending down from chin/jaw
                # Jaw points: 234 (left ear/jaw), 454 (right ear/jaw)
                jaw_left_x = int(landmarks[234].x * w)
                jaw_left_y = int(landmarks[234].y * h)
                jaw_right_x = int(landmarks[454].x * w)
                jaw_right_y = int(landmarks[454].y * h)
                
                neck_poly = np.array([
                    [jaw_left_x, jaw_left_y],
                    [chin_x, chin_y],
                    [jaw_right_x, jaw_right_y],
                    [w, h], # Bottom right
                    [0, h]  # Bottom left
                ])
                cv2.fillPoly(face_mask, [neck_poly], 255)

                # 3. Aggressive Dilation (Remove ears, hairline skin)
                # Increased kernel size for cleaner removal
                kernel = np.ones((40, 40), np.uint8)
                face_mask = cv2.dilate(face_mask, kernel, iterations=1)
        
        # 3. Combine: Person AND (NOT Face)
        # Hair = Person - Face
        hair_mask = cv2.bitwise_and(person_mask, cv2.bitwise_not(face_mask))
        
        # Clean up noise
        kernel_clean = np.ones((5, 5), np.uint8)
        hair_mask = cv2.morphologyEx(hair_mask, cv2.MORPH_OPEN, kernel_clean)
        
        return hair_mask

# Singleton
_isolator = None
def get_hair_isolator():
    global _isolator
    if _isolator is None:
        _isolator = HairIsolator()
    return _isolator
