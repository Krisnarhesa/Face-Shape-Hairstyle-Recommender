# Hair Asset Pre-Processing Guide

## Quick Start

### 1. Install Dependencies (if needed)

```bash
pip install tqdm
```

### 2. Run Pre-Processing

**Process all hairstyles (recommended):**
```bash
cd "c:\Semester 7\Visi Komputer\Tugas Besar backup\Face-Shape-Hairstyle-Recommender\backend"
python prepare_hair_assets.py
```

**Process specific folder (for testing):**
```bash
python prepare_hair_assets.py --input hairstyles\round --output hairstyles_processed\round
```

### 3. Update main.py

After pre-processing, update `main.py` to use processed assets:

```python
# Around line 43
HAIR_DIR = Path(__file__).resolve().parent / "hairstyles_processed"
```

### 4. Restart Backend

```bash
uvicorn main:app --reload --port 8000
```

### 5. Test

- Upload a face photo
- Try different hairstyles
- Hair should now actually change!

---

## What the Script Does

1. **Loads each PNG** from `hairstyles/` folders
2. **Extracts hair** using:
   - BiSeNet face parsing (best quality)
   - MediaPipe (fallback)
   - Thresholding (last resort)
3. **Feathers edges** with Gaussian blur for natural look
4. **Crops to content** removing empty space
5. **Saves as RGBA PNG** in `hairstyles_processed/`

---

## Expected Output

```
==================================================
Hair Asset Pre-Processing Tool
==================================================

Initializing extractors...
[BiSeNet] Model loaded successfully

Found 260 PNG files to process
Input:  hairstyles
Output: hairstyles_processed

Processing: 100%|████████████| 260/260 [05:30<00:00]

==================================================
Processing complete!
  Success: 258
  Failed:  2
==================================================
```

---

## Troubleshooting

**If BiSeNet model not found:**
- Run `python download_bisenet_model.py` first
- Or it will auto-fallback to MediaPipe

**If some files fail:**
- Check error messages
- Failed files will be skipped
- Can process manually later

**If process is slow:**
- Normal! Each file takes 1-3 seconds
- 260 files ≈ 5-10 minutes total
- Progress bar shows ETA

---

## Folder Structure After Processing

```
backend/
├── hairstyles/              # Original (full photos)
│   ├── oval/
│   ├── round/
│   ├── square/
│   ├── heart/
│   └── oblong/
│
└── hairstyles_processed/    # Processed (isolated hair)
    ├── oval/
    ├── round/
    ├── square/
    ├── heart/
    └── oblong/
```

---

## Next Steps

1. ✅ Run pre-processing script
2. ✅ Update HAIR_DIR in main.py  
3. ✅ Restart backend
4. ✅ Test hair try-on
5. ✅ Enjoy realistic results!
