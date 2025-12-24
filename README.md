# Face Shape & Hairstyle Recommender System 💇‍♀️

Sistem rekomendasi gaya rambut berbasis bentuk wajah menggunakan Deep Learning dan Computer Vision.

![Preview Mode](docs/preview-badge.svg)

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [Pendekatan Teknis](#pendekatan-teknis)
- [Limitasi](#limitasi)
- [Future Improvements](#future-improvements)

---

## ✨ Fitur Utama

### 1. **Face Shape Detection** 
- Klasifikasi 5 bentuk wajah: Oval, Round, Square, Heart, Oblong
- Menggunakan Convolutional Neural Network (CNN)
- Confidence score untuk setiap prediksi

### 2. **Hairstyle Recommendations**
- 190+ gaya rambut berdasarkan bentuk wajah
- Rekomendasi personalized untuk setiap face shape
- Gambar referensi berkualitas tinggi

### 3. **Virtual Try-On Preview**
- Real-time visualization hairstyle on user's face
- Face landmark detection menggunakan MediaPipe
- Alpha blending untuk hasil natural

### 4. **User-Friendly Interface**
- Upload foto atau gunakan kamera
- Responsive design
- One-click download hasil

---

## 🛠️ Teknologi

### Backend
- **FastAPI** - Modern Python web framework
- **PyTorch** - Deep learning framework
- **MediaPipe** - Face mesh detection
- **OpenCV** - Computer vision processing
- **Pillow** - Image processing

### Frontend
- **HTML5/CSS3/JavaScript** - Pure vanilla stack
- **Responsive Design** - Mobile-friendly

### Machine Learning
- **CNN Model** - Face shape classification
- **MediaPipe Face Mesh** - 468 facial landmarks
- **Alpha Blending** - Hair overlay technique

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (HTML/CSS/JS)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Image Upload / Camera Capture                │  │
│  │  2. Display Analysis Results                     │  │
│  │  3. Hairstyle Grid & Try-On UI                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST API
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI/Python)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /predict - Face Shape Classification            │  │
│  │  └─ CNN Model (PyTorch)                          │  │
│  │  └─ Returns: face_shape, confidence, hairstyles  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  /try-on - Virtual Hairstyle Try-On              │  │
│  │  └─ MediaPipe Face Landmarks                     │  │
│  │  └─ Hair Overlay Algorithm                       │  │
│  │  └─ Alpha Blending                               │  │
│  │  └─ Returns: Blended image                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    DATA & MODELS                        │
│  • face_shape_modelv2.pth (Trained CNN)                 │
│  • hairstyles/ (178 transparency-enabled images)        │
│  • recommender.py (Rule-based mapping)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📥 Instalasi

### Prerequisites
- Python 3.8+
- pip package manager
- CUDA-capable GPU (optional, untuk performa lebih baik)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-repo/Face-Shape-Hairstyle-Recommender.git
cd Face-Shape-Hairstyle-Recommender
```

### Step 2: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**Dependencies:**
```
fastapi
uvicorn
torch
torchvision
Pillow
opencv-python-headless
mediapipe
numpy
python-multipart
```

### Step 3: Download Pre-trained Model
Model sudah disediakan di folder `models/face_shape_modelv2.pth`

### Step 4: Run Backend Server
```bash
cd backend
uvicorn main:app --reload
```

Server akan berjalan di `http://127.0.0.1:8000`

### Step 5: Open Frontend
```bash
cd frontend
# Open index.html di browser
# Atau gunakan live server
python -m http.server 8080
```

Frontend akan accessible di `http://localhost:8080`

---

## 🚀 Penggunaan

### 1. Upload Foto atau Ambil dari Kamera
- Klik "Upload File" untuk upload foto wajah Anda
- Atau klik "Start Camera" untuk menggunakan webcam
- Ambil foto dengan klik "Snap Target"

### 2. Analisis Bentuk Wajah
- Klik tombol "Analysis!"
- Sistem akan mendeteksi bentuk wajah Anda
- Confidence score ditampilkan

### 3. Lihat Rekomendasi
- Scroll ke bawah untuk melihat rekomendasi hairstyle
- 10 hairstyle pertama ditampilkan
- Klik "Show More!" untuk lebih banyak opsi

### 4. Try-On Virtual
- Klik pada gambar hairstyle yang Anda suka
- Sistem akan memproses dan menampilkan preview
- Lihat hasil try-on dengan rambut overlay

### 5. Download Hasil
- Klik "Download Result" untuk menyimpan gambar
- Gunakan sebagai referensi konsultasi dengan hair stylist

---

## 🔬 Pendekatan Teknis

### 1. Face Shape Classification

**Model Architecture:**
- Convolutional Neural Network (CNN)
- Input: 380x380 RGB image
- Output: 5 classes (Oval, Round, Square, Heart, Oblong)
- Softmax activation untuk confidence score

**Preprocessing:**
```python
transforms.Compose([
    transforms.Resize((380, 380)),
    transforms.ToTensor(),
])
```

**Training Details:**
- Dataset: Custom face shape dataset
- Optimizer: Adam
- Loss: CrossEntropyLoss
- Epochs: 50+
- Validation accuracy: ~85%

### 2. Hairstyle Recommendation System

**Rule-Based Matching:**
```python
recommendations = {
    "Oval": [...],  # 59 hairstyles
    "Round": [...], # 40 hairstyles
    "Square": [...],# 30 hairstyles
    "Heart": [...], # 35 hairstyles
    "Oblong": [...] # 36 hairstyles
}
```

**Criteria:**
- Berdasarkan face proportions
- Professional hairstylist recommendations
- Trend terkini dari sumber terpercaya

### 3. Virtual Try-On Algorithm

**Step-by-Step Process:**

#### A. Face Landmark Detection
```python
# MediaPipe Face Mesh - 468 landmarks
mp_face = mp.solutions.face_mesh
face_mesh.process(image)  # Returns 468 (x, y, z) coordinates
```

**Key Landmarks Used:**
- Landmark #10: Top of forehead
- Landmark #234: Left temple
- Landmark #454: Right temple
- Landmark #152: Chin

#### B. Hair Positioning & Sizing
```python
# Calculate face dimensions
face_width = abs(right[0] - left[0])
face_height = abs(chin[1] - forehead[1])

# Scale hair proportionally
hair_width = int(face_width * 2.0)  # 2x multiplier for coverage
hair_height = int(hair_width * aspect_ratio)

# Position calculation
x1 = int(left[0] - (hair_width - face_width) / 2)
y1 = int(forehead[1] - hair_height * 0.75)  # 75% overlap
```

#### C. Alpha Blending with Edge Feathering
```python
# Extract alpha channel
alpha = hair_image[:, :, 3] / 255.0

# Apply Gaussian blur for soft edges
alpha = cv2.GaussianBlur(alpha, (21, 21), 10)

# Gradient fade (top to bottom)
gradient = np.linspace(1.0, 0.5, height)
alpha = alpha * gradient

# Side feathering (50px from each side)
for i in range(50):
    fade = i / 50
    alpha[:, i] *= fade
    alpha[:, -(i+1)] *= fade
```

#### D. Color Matching
```python
# Sample face region color
face_mean = np.mean(face_region, axis=(0, 1))
hair_mean = np.mean(hair_rgb, axis=(0, 1))

# Color correction (subtle)
color_ratio = face_mean / (hair_mean + 1e-6)
color_ratio = np.clip(color_ratio, 0.8, 1.2)

hair_adjusted = hair_rgb * color_ratio
```

#### E. Final Blending
```python
# Alpha compositing
blended = (alpha * hair_adjusted + (1 - alpha) * face_region)
face_image[y1:y2, x1:x2] = blended.astype(np.uint8)
```

---

## ⚠️ Limitasi

### Current Approach: Template-Based Overlay

**Known Limitations:**

1. **Not Photorealistic**
   - Uses 2D overlay, not 3D hair fitting
   - No consideration for head angle/rotation
   - Simplified lighting model

2. **Static Templates**
   - Hair images are pre-downloaded references
   - No dynamic hair generation
   - Limited by template quality

3. **Face Angle Dependency**
   - Works best with frontal face photos
   - Side angles may produce unrealistic results
   - Requires well-lit, clear images

4. **No Hair Type Adaptation**
   - Doesn't consider user's current hair texture
   - No distinction between straight/curly/wavy matching
   - Templates have fixed characteristics

5. **Edge Blending**
   - Despite feathering, edges may still be visible
   - Color matching is approximation
   - No advanced compositing (shadows, highlights)

### When Results May Not Be Optimal

- ❌ Extreme face angles (>30° rotation)
- ❌ Very low lighting or high contrast
- ❌ Partial face visibility
- ❌ Hair covering most of face
- ❌ Multiple faces in image

### Intended Use Case

✅ **This is a PREVIEW/VISUALIZATION tool, NOT a realistic simulator**
- Use untuk: Browsing hairstyle ideas
- Use untuk: Consultation reference dengan stylist
- Use untuk: General direction/inspiration

❌ **NOT intended for:**
- Photorealistic final result expectations
- Professional salon software replacement
- Exact color/texture matching

---

## 🔮 Future Improvements

### Short-Term (Achievable dengan current stack)
- [ ] Face angle detection & rotation correction
- [ ] Better hair template categorization (by length, style, color)
- [ ] Multi-face support
- [ ] Batch processing multiple hairstyles
- [ ] Comparison view (before/after side-by-side)

### Medium-Term (Requires additional models)
- [ ] Hair color changing feature
- [ ] Style transfer untuk natural blending
- [ ] Face parsing (BiSeNet) untuk precise segmentation
- [ ] Hair texture analysis

### Long-Term (Advanced AI approaches)
- [ ] **GAN-based realistic hair transfer**
  - Technologies: Barbershop, HairCLIP, MichiGAN
  - Pros: Photorealistic results, 3D-aware
  - Cons: Complex setup, high computational cost
  
- [ ] **3D face reconstruction**
  - Technologies: PRNet, 3DDFA, DECA
  - Enables: Proper hair fitting on 3D head model
  
- [ ] **Neural rendering**
  - Technologies: NeRF, Neural Radiance Fields
  - Enables: View-consistent results from any angle

### Research References for Future Work

**Realistic Hair Transfer:**
- Barbershop (Zhu et al., 2021) - GAN-based compositing
- HairCLIP (Wei et al., 2022) - Text-guided hair editing
- MichiGAN (Tan et al., 2020) - Multi-domain image translation

**Face Parsing:**
- BiSeNet - Real-time semantic segmentation
- CelebAMask-HQ - High-quality face parsing

**3D Reconstruction:**
- PRNet - Position map regression
- DECA - Detailed expression capture

---

## 📊 Performance

### Backend
- Face detection: ~100-200ms
- CNN inference: ~50-100ms (GPU) / ~500ms (CPU)
- Hair overlay: ~50-150ms
- Total: <500ms per request (GPU)

### Frontend
- Image upload/capture: Instant
- Result display: Real-time
- Smooth scrolling & interactions

### Scalability
- Current: Single-threaded, synchronous
- Future: Can add async processing, queue system
- Recommended: Deploy behind load balancer for production

---

## 🤝 Contributing

Contributions welcome! Areas yang bisa di-improve:
- Better hairstyle templates
- More accurate face shape model
- UI/UX enhancements  
- Documentation improvements
- Bug fixes

---

## 📝 License

[MIT License](LICENSE)

---

## 👥 Team

**Kelompok 5 - Computer Vision**
- [Member names]

---

## 🙏 Acknowledgments

- MediaPipe for face landmark detection
- PyTorch community
- Hairstyle images dari berbagai sumber (cited in code)
- OpenCV community

---

## 📞 Contact

Untuk pertanyaan atau feedback:
- Email: [your-email]
- GitHub Issues: [repo-link]

---

**Note:** This is an academic/learning project demonstrating computer vision concepts. Results are for preview/reference purposes only.