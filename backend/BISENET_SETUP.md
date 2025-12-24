# BiSeNet Model Setup

## Untuk Menggunakan BiSeNet Hair Overlay

BiSeNet memberikan hasil yang lebih akurat dengan face parsing untuk segmentasi rambut.

### Langkah 1: Install Dependencies

```bash
pip install gdown opencv-python mediapipe
```

Atau install semua dari requirements.txt:
```bash
cd "c:\Semester 7\Visi Komputer\Tugas Besar backup\Face-Shape-Hairstyle-Recommender\backend"
pip install -r ../requirements.txt
```

### Langkah 2: Download BiSeNet Model

**Otomatis (Recommended):**
```bash
python download_bisenet_model.py
```

**Manual (Jika otomatis gagal):**

1. Visit: https://drive.google.com/file/d/154JgKpzCPW82qINcVieuPH3fZ2e0P812/view
2. Download file `79999_iter.pth` (~50MB)
3. Buat folder: `BiSeNet/res/cp/`
4. Simpan file ke: `c:\Semester 7\Visi Komputer\Tugas Besar backup\Face-Shape-Hairstyle-Recommender\backend\BiSeNet\res\cp\79999_iter.pth`

### Langkah 3: Restart Backend

```bash
# Stop server (Ctrl+C)
# Then restart:
uvicorn main:app --reload --port 8000
```

You should see:
```
[Backend] BiSeNet Smart Overlay loaded (Hybrid System)
```

### Verifikasi

Coba upload foto dan try hairstyle. Di console seharusnya muncul:
```
[Try-On] Using BiSeNet Smart Overlay (Hybrid)
[Smart Overlay] BiSeNet Success (Clean Hair Extraction)
```

## Troubleshooting

**Jika BiSeNet gagal**, sistem otomatis fallback ke basic alpha blending:
```
[Try-On] BiSeNet failed: ..., using basic fallback
```

**Jika model tidak ditemukan**:
```
[Backend] BiSeNet not available: ...
[Backend] Using basic alpha blending as fallback
```

Cek apakah file model ada di path yang benar.

## Keuntungan BiSeNet

- ✅ Face parsing untuk segmentasi akurat
- ✅ Hybrid system (BiSeNet + MediaPipe fallback)
- ✅ Smart cropping untuk positioning yang lebih baik  
- ✅ Removes background/clothes dari hair assets
- ✅ Alpha blending dengan edge smoothing

## Fallback Hierarchy

```
BiSeNet Face Parsing
  ↓ (jika gagal)
MediaPipe Hair Isolation  
  ↓ (jika gagal)
Basic Alpha Blending
  ↓ (selalu)
Return valid result
```
