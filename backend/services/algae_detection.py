"""
Algae Bloom Detection Service
Algorithm preserved exactly from the original notebook (DIP__1___3_.ipynb).
DO NOT modify formula logic or processing steps.
"""

import os
import uuid
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from sklearn.cluster import KMeans
from scipy import ndimage

from services.gee_service import fetch_bands

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

# Sentinel-2 wavelengths in nanometers — used for FAI
WAVELENGTHS = {
    "red": 665,
    "nir": 842,
    "swir": 1610,
}


# ─────────────────────────────────────────────
#  Core algorithm (from notebook, unmodified)
# ─────────────────────────────────────────────

def compute_indices(bands: dict) -> dict:
    """
    Compute NDWI, NDVI, and FAI from Sentinel-2 bands.
    Formulae taken directly from the notebook.
    """
    blue  = bands["B2"]
    green = bands["B3"]
    red   = bands["B4"]
    nir   = bands["B8"]
    swir  = bands["B11"]

    # NDWI — water detection
    ndwi = (green - nir) / (green + nir + 1e-10)

    # NDVI — vegetation
    ndvi = (nir - red) / (nir + red + 1e-10)

    # FAI (Floating Algae Index) — corrected formula from notebook
    wavelength_ratio = (
        (WAVELENGTHS["nir"] - WAVELENGTHS["red"])
        / (WAVELENGTHS["swir"] - WAVELENGTHS["red"])
    )
    baseline_nir = red + (swir - red) * wavelength_ratio
    fai = nir - baseline_nir

    return {"ndwi": ndwi, "ndvi": ndvi, "fai": fai}


def create_water_mask(ndwi: np.ndarray) -> np.ndarray:
    """
    Build a binary water mask using NDWI threshold + morphological clean-up.
    Identical to notebook implementation.
    """
    water_mask = ndwi > 0.2
    water_mask = ndimage.binary_opening(water_mask,  structure=np.ones((3, 3)))
    water_mask = ndimage.binary_closing(water_mask, structure=np.ones((3, 3)))
    return water_mask


def apply_kmeans_clustering(
    ndvi: np.ndarray,
    fai: np.ndarray,
    water_mask: np.ndarray,
    n_clusters: int = 4,
) -> tuple:
    """
    Run KMeans on the NDVI + FAI feature stack masked to water pixels.
    Returns cluster labels array and the cluster_id most likely to be algae.
    """
    h, w = ndvi.shape

    feature_stack = np.stack([ndvi, fai], axis=-1).reshape(-1, 2)
    water_flat    = water_mask.reshape(-1)

    labels = np.full(h * w, -1, dtype=int)

    water_features = feature_stack[water_flat]

    if water_features.shape[0] < n_clusters:
        raise ValueError(
            "Not enough water pixels for KMeans clustering. "
            "Try selecting a region with more open water."
        )

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(water_features)

    labels[water_flat] = kmeans.labels_
    labels_2d = labels.reshape(h, w)

    # Identify algal bloom cluster: highest mean FAI + NDVI within water pixels
    fai_flat  = fai.reshape(-1)
    ndvi_flat = ndvi.reshape(-1)

    cluster_scores = {}
    for cid in range(n_clusters):
        cluster_mask = (labels == cid) & water_flat
        if cluster_mask.sum() > 0:
            score = float(fai_flat[cluster_mask].mean() + ndvi_flat[cluster_mask].mean())
            cluster_scores[cid] = score

    algae_cluster = max(cluster_scores, key=cluster_scores.get)

    return labels_2d, algae_cluster


def detect_algal_blooms(bands: dict) -> dict:
    """
    Full algal bloom detection pipeline (from notebook).

    Steps:
      1. Compute NDWI, NDVI, FAI
      2. Create water mask
      3. KMeans clustering on water pixels
      4. Identify algal bloom cluster
      5. Produce bloom mask

    Returns dict with indices arrays, masks, cluster info.
    """
    indices = compute_indices(bands)
    ndwi, ndvi, fai = indices["ndwi"], indices["ndvi"], indices["fai"]

    water_mask = create_water_mask(ndwi)
    labels_2d, algae_cluster = apply_kmeans_clustering(ndvi, fai, water_mask)

    bloom_mask = (labels_2d == algae_cluster) & water_mask

    # Clean up bloom mask
    bloom_mask = ndimage.binary_opening(bloom_mask,  structure=np.ones((3, 3)))
    bloom_mask = ndimage.binary_closing(bloom_mask, structure=np.ones((3, 3)))

    bloom_pixel_count = int(bloom_mask.sum())
    water_pixel_count = int(water_mask.sum())
    bloom_coverage_pct = (
        round(bloom_pixel_count / water_pixel_count * 100, 2)
        if water_pixel_count > 0 else 0.0
    )

    return {
        "ndwi":           ndwi,
        "ndvi":           ndvi,
        "fai":            fai,
        "water_mask":     water_mask,
        "labels":         labels_2d,
        "algae_cluster":  algae_cluster,
        "bloom_mask":     bloom_mask,
        "bloom_pixels":   bloom_pixel_count,
        "water_pixels":   water_pixel_count,
        "bloom_coverage": bloom_coverage_pct,
    }


# ─────────────────────────────────────────────
#  Visualisation helpers
# ─────────────────────────────────────────────

def _save_figure(fig, filename: str) -> str:
    filepath = os.path.join(RESULTS_DIR, filename)
    fig.savefig(filepath, dpi=150, bbox_inches="tight", facecolor="#0d1117")
    plt.close(fig)
    return filename


def render_results(bands: dict, detection: dict, job_id: str) -> dict:
    """
    Produce a 2×3 results figure and individual panel images.
    Returns dict of image filenames.
    """
    blue  = bands["B2"]
    green = bands["B3"]
    red   = bands["B4"]

    ndwi       = detection["ndwi"]
    ndvi       = detection["ndvi"]
    fai        = detection["fai"]
    water_mask = detection["water_mask"]
    bloom_mask = detection["bloom_mask"]

    # ── RGB composite ──────────────────────────────────────────────────────
    rgb = np.stack([
        np.clip(red   * 3.5, 0, 1),
        np.clip(green * 3.5, 0, 1),
        np.clip(blue  * 3.5, 0, 1),
    ], axis=-1)

    # ── Cluster overlay ────────────────────────────────────────────────────
    overlay = rgb.copy()
    overlay[bloom_mask] = [0.0, 1.0, 0.3]   # bright green for algae
    overlay[water_mask & ~bloom_mask] = [0.1, 0.4, 0.9]  # blue for clean water

    dark = "#0d1117"
    accent = "#00ff88"

    # ── Combined 2×3 figure ───────────────────────────────────────────────
    fig, axes = plt.subplots(2, 3, figsize=(18, 11), facecolor=dark)
    fig.suptitle(
        "Algal Bloom Detection — Sentinel-2",
        color="#e6edf3", fontsize=16, fontweight="bold", y=0.98,
    )

    panels = [
        (axes[0, 0], rgb,        "RGB Composite",       "gray",    None),
        (axes[0, 1], ndwi,       "NDWI (Water Index)",  "Blues",   [-1, 1]),
        (axes[0, 2], ndvi,       "NDVI (Vegetation)",   "RdYlGn",  [-1, 1]),
        (axes[1, 0], fai,        "FAI (Floating Algae)","Greens",  None),
        (axes[1, 1], water_mask, "Water Mask",          "Blues",   None),
        (axes[1, 2], overlay,    "Detected Algae (green) / Water (blue)", None, None),
    ]

    for ax, data, title, cmap, vrange in panels:
        ax.set_facecolor(dark)
        if data.ndim == 3:
            ax.imshow(data)
        elif vrange:
            ax.imshow(data, cmap=cmap, vmin=vrange[0], vmax=vrange[1])
        else:
            ax.imshow(data, cmap=cmap)
        ax.set_title(title, color="#e6edf3", fontsize=11, pad=6)
        ax.axis("off")

    # Legend on overlay panel
    legend_elements = [
        Patch(facecolor=[0.0, 1.0, 0.3],  label=f"Algal Bloom ({detection['bloom_coverage']}%)"),
        Patch(facecolor=[0.1, 0.4, 0.9],  label="Clean Water"),
    ]
    axes[1, 2].legend(
        handles=legend_elements,
        loc="lower right",
        fontsize=9,
        framealpha=0.6,
        facecolor=dark,
        labelcolor="#e6edf3",
    )

    plt.tight_layout(rect=[0, 0, 1, 0.96])

    combined_file = _save_figure(fig, f"result_{job_id}.png")

    # ── Individual overlay image ───────────────────────────────────────────
    fig2, ax2 = plt.subplots(figsize=(8, 8), facecolor=dark)
    ax2.imshow(overlay)
    ax2.set_title(
        f"Algal Bloom Detection  |  Coverage: {detection['bloom_coverage']}%",
        color="#e6edf3", fontsize=13, pad=10,
    )
    ax2.axis("off")
    legend_elements2 = [
        Patch(facecolor=[0.0, 1.0, 0.3], label=f"Algal Bloom ({detection['bloom_coverage']}%)"),
        Patch(facecolor=[0.1, 0.4, 0.9], label="Clean Water"),
    ]
    ax2.legend(
        handles=legend_elements2,
        loc="lower right",
        fontsize=10,
        framealpha=0.7,
        facecolor=dark,
        labelcolor="#e6edf3",
    )
    overlay_file = _save_figure(fig2, f"overlay_{job_id}.png")

    return {
        "combined": combined_file,
        "overlay":  overlay_file,
    }


# ─────────────────────────────────────────────
#  Public entry-point called by the route
# ─────────────────────────────────────────────

def run_algae_detection(
    bbox: list,
    start_date: str,
    end_date: str,
    cloud_cover: int = 20,
    scale: int = 100,
    gee_project: str = None,
) -> dict:
    """
    Orchestrates the full workflow:
      1. Fetch Sentinel-2 bands from GEE
      2. Run algal bloom detection algorithm
      3. Render and save result images
      4. Return metadata + image filenames to the API

    Args:
        bbox: [min_lon, min_lat, max_lon, max_lat]
        start_date / end_date: ISO date strings
        cloud_cover: max CLOUDY_PIXEL_PERCENTAGE
        scale: resolution in metres (default 100)
        gee_project: optional GEE project ID

    Returns dict suitable for JSON response.
    """
    job_id = uuid.uuid4().hex[:10]

    # Step 1 — fetch bands
    bands = fetch_bands(
        bbox=bbox,
        start_date=start_date,
        end_date=end_date,
        cloud_cover=cloud_cover,
        scale=scale,
        project=gee_project,
    )

    # Step 2 — run detection algorithm (unchanged from notebook)
    detection = detect_algal_blooms(bands)

    # Step 3 — render visualisations
    images = render_results(bands, detection, job_id)

    return {
        "job_id":          job_id,
        "status":          "success",
        "bloom_coverage":  detection["bloom_coverage"],
        "bloom_pixels":    detection["bloom_pixels"],
        "water_pixels":    detection["water_pixels"],
        "combined_image":  images["combined"],
        "overlay_image":   images["overlay"],
        "bbox":            bbox,
        "start_date":      start_date,
        "end_date":        end_date,
        "scale_m":         scale,
    }
