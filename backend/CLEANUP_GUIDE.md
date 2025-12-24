# Files to Delete Before Commit

## Unused Files (Safe to Delete)

These files are no longer used in the current implementation:

```bash
# In backend/ directory:
del improved_hair_overlay.py
del hairfast_api.py
del download_bisenet_model.py
```

## Explanation

- **improved_hair_overlay.py**: Old BiSeNet implementation, replaced by `bisenet_simple.py`
- **hairfast_api.py**: HairFast GAN integration, not currently used
- **download_bisenet_model.py**: One-time setup script, no longer needed

## Files to KEEP

These are actively used:
- ✅ `bisenet_simple.py` - Current hair overlay system
- ✅ `main.py` - FastAPI backend
- ✅ `model.py` - Face shape classifier
- ✅ `recommender.py` - Hairstyle recommendations
- ✅ `prepare_hair_assets.py` - Pre-processing tool
- ✅ `utils/` - Helper functions
- ✅ `BiSeNet/` - Model code
- ✅ `hairstyles_processed/` - Pre-processed assets
- ✅ `BISENET_SETUP.md`, `HAIR_PREPROCESSING_GUIDE.md` - Documentation

## To Delete Manually

Open Command Prompt in backend folder:
```bash
cd "c:\Semester 7\Visi Komputer\Tugas Besar backup\Face-Shape-Hairstyle-Recommender\backend"
del improved_hair_overlay.py
del hairfast_api.py  
del download_bisenet_model.py
```

Or delete through File Explorer.

## Optional: Also Exclude from Git

Add to `.gitignore`:
```
__pycache__/
*.pyc
output_*.jpg
debug_*.jpg
debug_log.txt
```
