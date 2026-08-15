# 🌊 AlgaeWatch — Algal Bloom Detection System

<p align="center">
  <strong>Satellite-powered algal bloom detection using Sentinel-2 imagery, Google Earth Engine, spectral indices, and machine learning.</strong>
</p>

<p align="center">
  Detect • Analyze • Visualize • Monitor
</p>

---

## 📌 Overview

**AlgaeWatch** is a full-stack web application designed to detect potential algal blooms in water bodies using real Sentinel-2 satellite imagery.

The system combines **Google Earth Engine**, **spectral indices**, and **unsupervised machine learning** to analyze selected geographic regions and identify areas that may contain algal blooms.

Users can select a region on an interactive map, specify a date range and cloud-cover threshold, run the detection pipeline, and visualize the resulting bloom analysis.

---

## ✨ Features

- 🛰️ Real Sentinel-2 satellite imagery
- 🌍 Google Earth Engine integration
- 🗺️ Interactive geographic region selection
- 📅 Custom date-range filtering
- ☁️ Cloud-cover filtering
- 🧮 NDWI water detection
- 🌱 NDVI vegetation analysis
- 🌊 FAI floating-algae detection
- 🤖 KMeans unsupervised clustering
- 📊 Bloom coverage statistics
- 🖼️ Multi-panel analysis visualization
- 🟢 Algal bloom overlay visualization
- 📥 Downloadable analysis results
- ⚡ React-based interactive frontend
- 🐍 Flask REST API backend
- 📱 Responsive web interface

---

## 🧠 How It Works

The detection pipeline follows these major steps:

```text
User selects region
        ↓
Select date range & cloud threshold
        ↓
Google Earth Engine
        ↓
Sentinel-2 satellite imagery
        ↓
Extract spectral bands
        ↓
Convert DN → Reflectance
        ↓
NDWI → Water Mask
        ↓
NDVI + FAI
        ↓
KMeans Clustering
        ↓
Identify Algae Cluster
        ↓
Morphological Cleanup
        ↓
Bloom Mask
        ↓
Coverage Calculation
        ↓
Visualization & Results
