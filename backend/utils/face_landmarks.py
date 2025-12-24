import cv2
import mediapipe as mp

mp_face = mp.solutions.face_mesh

def detect_landmarks(image):
    h, w, _ = image.shape

    with mp_face.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True
    ) as face_mesh:

        result = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        if not result.multi_face_landmarks:
            return None

        landmarks = []
        for lm in result.multi_face_landmarks[0].landmark:
            landmarks.append((int(lm.x * w), int(lm.y * h)))

        return landmarks
