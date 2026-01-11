# Face Shape & Hairstyle Recommender

A system that classifies face shapes and recommends hairstyles with virtual try-on preview.

> ⚠️ **Note**: This system is still in development. The virtual try-on feature provides basic visualization and results may not be perfect.

## Features

- **Face Shape Classification** - Detects 5 face shapes (Oval, Round, Square, Heart, Oblong) using CNN
- **Hairstyle Recommendations** - Suggests suitable hairstyles based on detected face shape
- **Virtual Try-On** - Basic hair overlay using BiSeNet segmentation and MediaPipe landmarks

## Tech Stack

- **Backend**: FastAPI, PyTorch, OpenCV, MediaPipe
- **Frontend**: HTML, CSS, JavaScript
- **Models**: CNN for classification, BiSeNet for hair segmentation

## Installation

```bash
# Clone repository
git clone https://github.com/your-username/Face-Shape-Hairstyle-Recommender.git
cd Face-Shape-Hairstyle-Recommender

# Install dependencies
pip install -r requirements.txt

# Run backend
cd backend
uvicorn main:app --reload

# Run frontend (in new terminal)
cd frontend
python -m http.server 8080
```

Open `http://localhost:8080` in your browser.

## How It Works

1. Upload a photo or use camera
2. System classifies your face shape
3. Browse recommended hairstyles
4. Click a hairstyle to see try-on preview

## Known Limitations

- Works best with frontal face photos only
- Hair overlay is basic 2D blending
- Results may vary depending on image quality and lighting
- Single face detection only

## Project Structure

```
├── backend/
│   ├── main.py              # API endpoints
│   ├── model.py             # CNN model
│   ├── recommender.py       # Hairstyle mapping
│   ├── bisenet_simple.py    # Hair segmentation
│   └── utils/               # Helper functions
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
└── models/
    └── face_shape_modelv2.pth
```

## License

[MIT License](LICENSE)

---

*Academic project for Computer Vision course.*