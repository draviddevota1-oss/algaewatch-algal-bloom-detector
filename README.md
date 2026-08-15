# 🌊 AlgaeWatch — Algal Bloom Detection System

A full-stack web application that detects algal blooms in water bodies using **real Sentinel-2 satellite imagery** from Google Earth Engine, processed with NDVI, NDWI, FAI, and KMeans clustering.

---

## 📸 Features

- 🛰️ **Live Sentinel-2 data** via Google Earth Engine API
- 🗺️ **Interactive map** — draw any region of interest with a rectangle tool
- 🧮 **Full spectral pipeline**: NDWI water mask → NDVI + FAI → KMeans(4) → bloom mask
- 📊 **Results dashboard** with bloom coverage statistics
- ⬇️ **Download** result images (overlay + full analysis)
- 🌍 Pre-loaded known bloom hotspots worldwide

---

## 🏗️ Project Structure

```
algae-bloom-detector/
├── backend/
│   ├── app.py                      # Flask entry point
│   ├── routes/
│   │   ├── detection.py            # POST /api/detect
│   │   └── download.py             # GET /api/download/:file
│   ├── services/
│   │   ├── algae_detection.py      # Core algorithm (preserved from notebook)
│   │   └── gee_service.py          # Google Earth Engine integration
│   ├── utils/
│   │   └── helpers.py
│   ├── results/                    # Auto-created, stores output PNGs
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx            # Landing page with algorithm overview
    │   │   ├── Dashboard.jsx       # System overview & index reference
    │   │   ├── Detector.jsx        # Main feature: map + detection controls
    │   │   ├── Results.jsx         # View & download results
    │   │   └── MapView.jsx         # Satellite map explorer
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── hooks/
    │   │   └── useDetection.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Earth Engine account (free at [earthengine.google.com](https://earthengine.google.com))
- A GEE Cloud Project ID

---

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Authenticate with Google Earth Engine

Run once to authenticate your machine:
```bash
earthengine authenticate
```

Or, to authenticate programmatically inside the app, edit `services/gee_service.py` and
set your project ID:
```python
initialize_gee(project="your-gee-project-id")
```

#### Start the backend

```bash
python app.py
# Runs on http://localhost:5000
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 Usage Workflow

1. Open `http://localhost:3000`
2. Navigate to **Detector**
3. Draw a rectangle on the map (or choose a preset region)
4. Set date range (e.g., `2022-01-01` → `2022-01-31`)
5. Adjust cloud cover threshold (default: 20%)
6. Click **Detect Algae**
7. Results are displayed with:
   - Bloom overlay image
   - Full 6-panel analysis (RGB, NDWI, NDVI, FAI, water mask, bloom mask)
   - Coverage statistics
   - Download buttons

---

## 🧮 Algorithm Details

Implemented in `backend/services/algae_detection.py` — **unchanged** from the original notebook.

### Spectral Indices

| Index | Formula | Purpose |
|-------|---------|---------|
| NDWI  | `(Green − NIR) / (Green + NIR)` | Detect water pixels (threshold > 0.2) |
| NDVI  | `(NIR − Red) / (NIR + Red)` | Vegetation biomass proxy |
| FAI   | `NIR − [Red + (SWIR−Red) × λ_ratio]` | Floating algae biomass |

### FAI Wavelength Ratio
```
λ_ratio = (842 − 665) / (1610 − 665) = 0.1873...
baseline_NIR = Red + (SWIR − Red) × λ_ratio
FAI = NIR − baseline_NIR
```

### Pipeline Steps
1. Fetch Sentinel-2 SR (`COPERNICUS/S2_SR_HARMONIZED`) — cloud-filtered, date-filtered mean composite
2. Download bands B2, B3, B4, B8, B11 as GeoTIFFs (with automatic tiling for large regions)
3. Convert DN to reflectance (÷ 10 000)
4. Compute NDWI → binary water mask with morphological open/close
5. Compute NDVI and FAI
6. Stack NDVI + FAI features for water pixels → KMeans(k=4, random_state=42)
7. Identify algae cluster: highest mean (FAI + NDVI) score
8. Apply morphological cleanup to bloom mask
9. Compute bloom coverage % = bloom pixels / water pixels × 100

---

## 🌐 API Endpoints

### `POST /api/detect`

**Request body:**
```json
{
  "bbox": [80.1, 13.5, 80.4, 14.0],
  "start_date": "2022-01-01",
  "end_date": "2022-01-31",
  "cloud_cover": 20,
  "scale": 100
}
```

**Response:**
```json
{
  "job_id": "a3f9c12d45",
  "status": "success",
  "bloom_coverage": 12.4,
  "bloom_pixels": 3820,
  "water_pixels": 30812,
  "combined_image": "result_a3f9c12d45.png",
  "overlay_image": "overlay_a3f9c12d45.png",
  "bbox": [80.1, 13.5, 80.4, 14.0],
  "start_date": "2022-01-01",
  "end_date": "2022-01-31",
  "scale_m": 100
}
```

### `GET /api/download/<filename>`

Downloads a result PNG as an attachment.

### `GET /api/results/<filename>`

Serves a result PNG inline (for display).

---

## 🛠️ Environment Variables (Optional)

Create `backend/.env`:
```
GEE_PROJECT=your-gee-project-id
```

And load it in `app.py` with `python-dotenv` if desired.

---

## 📦 Dependencies

### Backend
- `flask` + `flask-cors` — REST API
- `earthengine-api` + `geemap` — GEE integration
- `rasterio` — GeoTIFF reading
- `numpy` + `scipy` — array processing + morphological ops
- `scikit-learn` — KMeans clustering
- `matplotlib` — result visualisation

### Frontend
- `react` + `react-router-dom` — SPA routing
- `leaflet` + `react-leaflet` + `leaflet-draw` — interactive maps
- `tailwindcss` — utility-first styling
- `axios` — HTTP client
- `framer-motion` — animations
- `react-hot-toast` — notifications

---

## 📝 License

MIT — open for research, education, and environmental monitoring use.
