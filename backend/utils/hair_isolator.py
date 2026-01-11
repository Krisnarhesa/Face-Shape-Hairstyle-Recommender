import cv2
import numpy as np
import mediapipe as mp

class HairIsolator:
    def __init__(self):
        self.mp_selfie = mp.solutions.selfie_segmentation
        self.mp_face = mp.solutions.face_mesh

        self.segmenter = self.mp_selfie.SelfieSegmentation(model_selection=1)
        self.face_mesh = self.mp_face.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )

    def isolate_hair(self, image_rgb):
        h, w = image_rgb.shape[:2]

        results_seg = self.segmenter.process(image_rgb)
        person_mask = (results_seg.segmentation_mask > 0.5).astype(np.uint8) * 255

        results_mesh = self.face_mesh.process(image_rgb)
        face_mask = np.zeros((h, w), dtype=np.uint8)

        if results_mesh.multi_face_landmarks:
            landmarks = results_mesh.multi_face_landmarks[0].landmark

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

            if points:
                cv2.fillPoly(face_mask, [np.array(points)], 255)

                chin_x = int(landmarks[152].x * w)
                chin_y = int(landmarks[152].y * h)

                jaw_left_x = int(landmarks[234].x * w)
                jaw_left_y = int(landmarks[234].y * h)
                jaw_right_x = int(landmarks[454].x * w)
                jaw_right_y = int(landmarks[454].y * h)

                neck_poly = np.array([
                    [jaw_left_x, jaw_left_y],
                    [chin_x, chin_y],
                    [jaw_right_x, jaw_right_y],
                    [w, h],
                    [0, h]
                ])
                cv2.fillPoly(face_mask, [neck_poly], 255)

                kernel = np.ones((40, 40), np.uint8)
                face_mask = cv2.dilate(face_mask, kernel, iterations=1)

        hair_mask = cv2.bitwise_and(person_mask, cv2.bitwise_not(face_mask))

        kernel_clean = np.ones((5, 5), np.uint8)
        hair_mask = cv2.morphologyEx(hair_mask, cv2.MORPH_OPEN, kernel_clean)

        return hair_mask

_isolator = None
def get_hair_isolator():
    global _isolator
    if _isolator is None:
        _isolator = HairIsolator()
    return _isolator
