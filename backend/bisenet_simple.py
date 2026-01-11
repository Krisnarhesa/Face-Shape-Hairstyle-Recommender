import sys
from pathlib import Path
import cv2
import numpy as np
import torch
from torchvision import transforms
from PIL import Image

BISENET_PATH = Path(__file__).parent / "BiSeNet"
sys.path.insert(0, str(BISENET_PATH))

try:
    from model import BiSeNet as BiSeNetModel
    BISENET_AVAILABLE = True
except ImportError:
    BISENET_AVAILABLE = False

try:
    from utils.hair_isolator import get_hair_isolator
    ISOLATOR_AVAILABLE = True
except ImportError:
    ISOLATOR_AVAILABLE = False


class SimplifiedSmartOverlay:
    def __init__(self):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'

        self.bisenet = None
        if BISENET_AVAILABLE:
            self.bisenet = self._load_bisenet()
            self.transform = transforms.Compose([
                transforms.Resize((512, 512)),
                transforms.ToTensor(),
                transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
            ])

        self.isolator = None
        if ISOLATOR_AVAILABLE:
            self.isolator = get_hair_isolator()

    def _load_bisenet(self):
        try:
            model_path = BISENET_PATH / "res" / "cp" / "79999_iter.pth"
            if not model_path.exists():
                return None

            model = BiSeNetModel(n_classes=19)
            model.load_state_dict(torch.load(str(model_path), map_location=self.device))
            model.to(self.device)
            model.eval()
            return model
        except Exception:
            return None

    def get_hair_mask(self, img):
        if self.bisenet is not None:
            try:
                h_orig, w_orig = img.shape[:2]
                img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                img_tensor = self.transform(img_pil).unsqueeze(0).to(self.device)

                with torch.no_grad():
                    out = self.bisenet(img_tensor)[0]

                parsing = out.squeeze(0).cpu().numpy().argmax(0)
                parsing_resized = cv2.resize(
                    parsing.astype(np.uint8),
                    (w_orig, h_orig),
                    interpolation=cv2.INTER_NEAREST
                )

                mask_candidate = (parsing_resized == 17).astype(np.uint8) * 255
                if cv2.countNonZero(mask_candidate) > 500:
                    return mask_candidate
            except Exception:
                pass

        if self.isolator is not None:
            try:
                mask_candidate = self.isolator.isolate_hair(img)
                if cv2.countNonZero(mask_candidate) > 500:
                    return mask_candidate
            except Exception:
                pass

        return None

    def overlay_hair_simple(self, face_img, hair_img, landmarks):
        try:
            face_no_hair = self._remove_original_hair(face_img)
            positioned_hair, new_hair_mask = self._position_hair(
                face_no_hair, hair_img, landmarks
            )

            if positioned_hair is None:
                return face_img

            return self._smart_alpha_blend(
                face_no_hair, positioned_hair, new_hair_mask
            )

        except Exception:
            return face_img

    def _remove_original_hair(self, face_img):
        try:
            hair_mask = self.get_hair_mask(face_img)

            if hair_mask is None or cv2.countNonZero(hair_mask) < 500:
                return face_img

            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            hair_mask_dilated = cv2.dilate(hair_mask, kernel, iterations=2)

            return cv2.inpaint(
                face_img,
                hair_mask_dilated,
                inpaintRadius=5,
                flags=cv2.INPAINT_TELEA
            )
        except Exception:
            return face_img

    def _detect_hairline(self, alpha_mask):
        if alpha_mask is None:
            return 0

        coords = cv2.findNonZero(alpha_mask)
        if coords is None:
            return 0

        return int(coords[:, 0, 1].min())

    def _crop_to_content(self, img, mask):
        if mask is None:
            return img, mask

        coords = cv2.findNonZero(mask)
        if coords is None:
            return img, mask

        x, y, w, h = cv2.boundingRect(coords)

        pad = 10
        x = max(0, x - pad)
        y = max(0, y - pad)
        w = min(img.shape[1] - x, w + 2 * pad)
        h = min(img.shape[0] - y, h + 2 * pad)

        return img[y:y+h, x:x+w], mask[y:y+h, x:x+w]

    def _position_hair(self, face_img, hair_img, landmarks):
        try:
            face_h, face_w = face_img.shape[:2]

            left = landmarks[234]
            right = landmarks[454]
            forehead = landmarks[10]
            chin = landmarks[152]

            face_width = right[0] - left[0]
            face_height = chin[1] - forehead[1]

            if hair_img.shape[2] == 4:
                hair_rgb = hair_img[:, :, :3]
                original_alpha = hair_img[:, :, 3]
            else:
                hair_rgb = hair_img
                original_alpha = None

            if original_alpha is not None and cv2.countNonZero(original_alpha) > 100:
                alpha = original_alpha
            else:
                alpha = self.get_hair_mask(hair_rgb)
                if alpha is None or cv2.countNonZero(alpha) < 100:
                    gray = cv2.cvtColor(hair_rgb, cv2.COLOR_BGR2GRAY)
                    _, alpha = cv2.threshold(
                        gray, 240, 255, cv2.THRESH_BINARY_INV
                    )

            hair_rgb, alpha = self._crop_to_content(hair_rgb, alpha)

            hair_width = int(face_width * 1.6)
            hair_height = int(hair_rgb.shape[0] * (hair_width / hair_rgb.shape[1]))

            if cv2.countNonZero(alpha) < 100:
                alpha = np.ones(alpha.shape, dtype=np.uint8) * 255

            alpha_resized = cv2.resize(
                alpha, (hair_width, hair_height),
                interpolation=cv2.INTER_LANCZOS4
            )
            hair_resized = cv2.resize(
                hair_rgb, (hair_width, hair_height),
                interpolation=cv2.INTER_LANCZOS4
            )

            hairline_y = self._detect_hairline(alpha_resized)

            x1 = int(left[0] - (hair_width - face_width) / 2)
            offset = int(face_height * 0.35)
            y1 = int(forehead[1] - hairline_y - offset)

            x2 = x1 + hair_width
            y2 = y1 + hair_height

            positioned = np.zeros((face_h, face_w, 3), dtype=np.uint8)
            mask_canvas = np.zeros((face_h, face_w), dtype=np.uint8)

            hx1, hy1 = 0, 0
            hx2, hy2 = hair_width, hair_height

            if x1 < 0: hx1 = -x1; x1 = 0
            if y1 < 0: hy1 = -y1; y1 = 0
            if x2 > face_w: hx2 -= (x2 - face_w); x2 = face_w
            if y2 > face_h: hy2 -= (y2 - face_h); y2 = face_h

            if x2 <= x1 or y2 <= y1:
                return None, None

            positioned[y1:y2, x1:x2] = hair_resized[hy1:hy2, hx1:hx2]
            mask_canvas[y1:y2, x1:x2] = alpha_resized[hy1:hy2, hx1:hx2]

            return positioned, mask_canvas

        except Exception:
            return None, None

    def _smart_alpha_blend(self, face_img, hair_img, hair_mask):
        try:
            _, binary = cv2.threshold(hair_mask, 127, 255, cv2.THRESH_BINARY)
            alpha_soft = cv2.GaussianBlur(binary, (7, 7), 1.5)

            alpha = alpha_soft.astype(float) / 255.0
            alpha_3ch = np.stack([alpha] * 3, axis=2)

            face_f = face_img.astype(float)
            hair_f = hair_img.astype(float)

            result = hair_f * alpha_3ch + face_f * (1 - alpha_3ch)
            return np.clip(result, 0, 255).astype(np.uint8)

        except Exception:
            return face_img


_simple_overlay = None

def get_simple_bisenet_overlay():
    global _simple_overlay
    if _simple_overlay is None:
        _simple_overlay = SimplifiedSmartOverlay()
    return _simple_overlay
