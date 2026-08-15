"""
Google Earth Engine service for fetching Sentinel-2 imagery.
Handles authentication, image collection filtering, and band downloading.
"""

import ee
import requests
import os
import math
import numpy as np

SENTINEL2_COLLECTION = "COPERNICUS/S2_SR_HARMONIZED"

# Sentinel-2 wavelengths in nanometers (used for FAI)
WAVELENGTHS = {
    "red": 665,
    "nir": 842,
    "swir": 1610,
}


def initialize_gee(project: str = None):
    """Authenticate and initialize Google Earth Engine."""
    try:
        if project:
            ee.Initialize(project=project)
        else:
            ee.Initialize()
    except Exception:
        ee.Authenticate()
        if project:
            ee.Initialize(project=project)
        else:
            ee.Initialize()


def get_sentinel2_image(
    bbox: list,
    start_date: str,
    end_date: str,
    cloud_cover: int = 20,
) -> ee.Image:
    """
    Fetch a cloud-filtered, temporally-averaged Sentinel-2 image.

    Args:
        bbox: [min_lon, min_lat, max_lon, max_lat]
        start_date: ISO date string "YYYY-MM-DD"
        end_date: ISO date string "YYYY-MM-DD"
        cloud_cover: Maximum allowed cloud pixel percentage

    Returns:
        ee.Image: Mean composite image
    """
    region = ee.Geometry.BBox(*bbox)
    cloud_filter = ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_cover)

    collection = (
        ee.ImageCollection(SENTINEL2_COLLECTION)
        .filterDate(start_date, end_date)
        .filterBounds(region)
        .filter(cloud_filter)
    )

    count = collection.size().getInfo()
    if count == 0:
        raise ValueError(
            f"No Sentinel-2 images found for the given parameters. "
            f"Try extending the date range or increasing cloud cover threshold."
        )

    return collection.mean(), region


def download_band_as_array(
    image: ee.Image,
    band_name: str,
    region: ee.Geometry,
    scale: int = 100,
) -> np.ndarray:
    """
    Download a single band from GEE and return it as a NumPy array.

    For large regions, tiles the download to stay within the 25M pixel limit.

    Args:
        image: ee.Image containing the band
        band_name: Band identifier (e.g., 'B4')
        region: ee.Geometry defining the spatial extent
        scale: Spatial resolution in metres (default 100 m)

    Returns:
        np.ndarray: 2D float32 array of reflectance values (0–1)
    """
    import rasterio
    from rasterio.io import MemoryFile
    import io

    band_image = image.select(band_name)

    bounds = region.bounds().getInfo()["coordinates"][0]
    min_x = min(p[0] for p in bounds)
    max_x = max(p[0] for p in bounds)
    min_y = min(p[1] for p in bounds)
    max_y = max(p[1] for p in bounds)

    width_deg = max_x - min_x
    height_deg = max_y - min_y
    width_pixels = abs(width_deg * (1000 / scale))
    height_pixels = abs(height_deg * (1000 / scale))
    total_pixels = width_pixels * height_pixels
    max_pixels = 25_000_000

    if total_pixels <= max_pixels:
        return _download_tile(band_image, region, scale)

    # Tile the region
    tiles_needed = math.ceil(total_pixels / max_pixels)
    tiles_per_side = math.ceil(math.sqrt(tiles_needed))
    width_step = width_deg / tiles_per_side
    height_step = height_deg / tiles_per_side

    rows = []
    for j in range(tiles_per_side):
        row_tiles = []
        for i in range(tiles_per_side):
            tile_geom = ee.Geometry.Rectangle([
                min_x + i * width_step,
                min_y + j * height_step,
                min_x + (i + 1) * width_step,
                min_y + (j + 1) * height_step,
            ])
            tile_arr = _download_tile(band_image, tile_geom, scale)
            row_tiles.append(tile_arr)
        rows.append(np.concatenate(row_tiles, axis=1))

    return np.concatenate(rows[::-1], axis=0)


def _download_tile(band_image: ee.Image, region: ee.Geometry, scale: int) -> np.ndarray:
    """Download a single tile and return as NumPy array."""
    import rasterio
    from rasterio.io import MemoryFile

    url = band_image.getDownloadURL({
        "scale": scale,
        "region": region,
        "format": "GEO_TIFF",
        "crs": "EPSG:4326",
        "filePerBand": True,
    })

    response = requests.get(url, stream=True, timeout=300)
    response.raise_for_status()

    with MemoryFile(response.content) as memfile:
        with memfile.open() as dataset:
            arr = dataset.read(1).astype(np.float32)

    return arr


def fetch_bands(
    bbox: list,
    start_date: str,
    end_date: str,
    cloud_cover: int = 20,
    scale: int = 100,
    project: str = None,
) -> dict:
    """
    High-level function: initialise GEE, fetch image, download required bands.

    Returns dict of band_name -> np.ndarray (reflectance 0–1).
    Bands fetched: B2 (blue), B3 (green), B4 (red), B8 (NIR), B11 (SWIR).
    """
    initialize_gee(project)

    image, region = get_sentinel2_image(bbox, start_date, end_date, cloud_cover)

    band_names = ["B2", "B3", "B4", "B8", "B11"]
    bands = {}
    for band in band_names:
        arr = download_band_as_array(image, band, region, scale)
        bands[band] = arr / 10000.0  # DN → reflectance

    return bands
