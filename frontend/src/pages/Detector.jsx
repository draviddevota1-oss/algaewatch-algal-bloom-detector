import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Search, Calendar, Cloud, Sliders, Loader2,
  Square, Trash2, Info, ChevronDown,
} from 'lucide-react'

// ── Draw control component ──────────────────────────────────────────────────
function DrawControl({ onBBoxChange, clearRef }) {
  const map = useMap()
  const drawnRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    // Load leaflet-draw
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js'
    script.onload = () => {
      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)
      drawnRef.current = drawnItems

      const drawControl = new L.Control.Draw({
        draw: {
          rectangle: {
            shapeOptions: { color: '#00ff88', weight: 2, fillOpacity: 0.1 },
          },
          polygon: false, polyline: false, circle: false,
          circlemarker: false, marker: false,
        },
        edit: { featureGroup: drawnItems, remove: true },
      })
      map.addControl(drawControl)
      layerRef.current = drawControl

      map.on(L.Draw.Event.CREATED, e => {
        drawnItems.clearLayers()
        drawnItems.addLayer(e.layer)
        const b = e.layer.getBounds()
        onBBoxChange([
          parseFloat(b.getWest().toFixed(4)),
          parseFloat(b.getSouth().toFixed(4)),
          parseFloat(b.getEast().toFixed(4)),
          parseFloat(b.getNorth().toFixed(4)),
        ])
      })

      map.on(L.Draw.Event.DELETED, () => onBBoxChange(null))
    }
    document.head.appendChild(script)

    return () => {
      try { map.removeControl(layerRef.current) } catch (_) {}
      try { map.removeLayer(drawnRef.current) } catch (_) {}
    }
  }, [map])

  // Expose clear function
  useEffect(() => {
    if (clearRef) {
      clearRef.current = () => {
        drawnRef.current?.clearLayers()
        onBBoxChange(null)
      }
    }
  }, [clearRef, onBBoxChange])

  return null
}

// ── Preset regions ──────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Chilika Lake, India',     bbox: [85.0, 19.6, 85.6, 19.9], center: [19.75, 85.3], zoom: 11 },
  { label: 'Pulicat Lake, India',     bbox: [80.1, 13.5, 80.4, 14.0], center: [13.75, 80.25], zoom: 11 },
  { label: 'Lake Erie, USA',          bbox: [-83.5, 41.5, -78.8, 42.9], center: [42.2, -81.0], zoom: 8 },
  { label: 'Baltic Sea (Gulf of Fin)',bbox: [22.0, 59.5, 27.0, 60.5], center: [60.0, 24.5], zoom: 8 },
  { label: 'Lake Taihu, China',       bbox: [119.9, 30.9, 120.6, 31.6], center: [31.25, 120.2], zoom: 10 },
]

export default function Detector() {
  const navigate = useNavigate()

  const [bbox, setBbox]           = useState(null)
  const [startDate, setStartDate] = useState('2022-01-01')
  const [endDate, setEndDate]     = useState('2022-01-31')
  const [cloudCover, setCloudCover] = useState(20)
  const [scale, setScale]         = useState(100)
  const [loading, setLoading]     = useState(false)
  const [mapCenter, setMapCenter] = useState([20, 80])
  const [mapZoom, setMapZoom]     = useState(5)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const clearDrawRef = useRef(null)
  const mapRef       = useRef(null)

  const handlePreset = (preset) => {
    setBbox(preset.bbox)
    setMapCenter(preset.center)
    setMapZoom(preset.zoom)
    toast.success(`Region set: ${preset.label}`)
  }

  const handleDetect = async () => {
    if (!bbox) {
      toast.error('Please draw a rectangle on the map first.')
      return
    }
    if (!startDate || !endDate) {
      toast.error('Please provide start and end dates.')
      return
    }

    setLoading(true)
    toast.loading('Fetching Sentinel-2 imagery from GEE…', { id: 'detect' })

    try {
      const { data } = await axios.post('/api/detect', {
        bbox,
        start_date: startDate,
        end_date:   endDate,
        cloud_cover: cloudCover,
        scale,
      })

      toast.success('Algal bloom detection complete!', { id: 'detect' })
      navigate('/results', { state: { result: data } })
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      toast.error(`Detection failed: ${msg}`, { id: 'detect' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="font-mono text-xs text-algae tracking-widest mb-1">// DETECTION MODULE</p>
          <h1 className="font-display text-3xl font-bold text-bright">Algae Detector</h1>
          <p className="font-body text-sm text-muted mt-1">
            Draw a rectangle on the map, configure parameters, then run detection.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-5">

          {/* ── Map ─────────────────────────────────────────────────────── */}
          <div className="algae-card !p-0 overflow-hidden h-[560px] relative">
            <div className="absolute top-3 left-3 z-[500] bg-void/80 border border-border rounded-lg px-3 py-2">
              <p className="font-mono text-xs text-algae">
                {bbox
                  ? `BBox: [${bbox.map(v => v.toFixed(3)).join(', ')}]`
                  : 'Draw a rectangle to select region'}
              </p>
            </div>

            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Esri World Imagery"
              />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.2}
                attribution="OSM"
              />
              <DrawControl onBBoxChange={setBbox} clearRef={clearDrawRef} />
            </MapContainer>

            {/* Clear button */}
            {bbox && (
              <button
                onClick={() => clearDrawRef.current?.()}
                className="absolute bottom-3 left-3 z-[500] flex items-center gap-1.5
                           bg-void/80 border border-border hover:border-red-500/50
                           text-muted hover:text-red-400 transition-colors
                           rounded-lg px-3 py-1.5 font-mono text-xs"
              >
                <Trash2 size={11} /> Clear
              </button>
            )}
          </div>

          {/* ── Controls ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Presets */}
            <div className="algae-card">
              <h3 className="font-display text-xs text-bright font-bold tracking-wider mb-3 flex items-center gap-2">
                <Square size={12} className="text-algae" /> QUICK PRESETS
              </h3>
              <div className="flex flex-col gap-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p)}
                    className="text-left px-3 py-2 rounded-lg border border-border
                               hover:border-algae/50 hover:bg-algae/5 transition-all
                               font-body text-xs text-muted hover:text-text"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="algae-card">
              <h3 className="font-display text-xs text-bright font-bold tracking-wider mb-3 flex items-center gap-2">
                <Calendar size={12} className="text-algae" /> DATE RANGE
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Start', value: startDate, set: setStartDate },
                  { label: 'End',   value: endDate,   set: setEndDate },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="font-mono text-xs text-dim mb-1 block">{label}</label>
                    <input
                      type="date"
                      value={value}
                      onChange={e => set(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2
                                 font-mono text-xs text-text focus:border-algae/50 outline-none
                                 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Cloud cover */}
            <div className="algae-card">
              <h3 className="font-display text-xs text-bright font-bold tracking-wider mb-3 flex items-center gap-2">
                <Cloud size={12} className="text-algae" /> CLOUD COVER
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={5} max={90} value={cloudCover}
                  onChange={e => setCloudCover(Number(e.target.value))}
                  className="flex-1 accent-algae"
                />
                <span className="font-mono text-sm text-algae w-10 text-right">
                  {cloudCover}%
                </span>
              </div>
              <p className="font-body text-xs text-dim mt-2">
                Max cloud pixel percentage filter for GEE
              </p>
            </div>

            {/* Advanced */}
            <div className="algae-card">
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className="w-full flex items-center justify-between font-display text-xs text-bright font-bold tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <Sliders size={12} className="text-algae" /> ADVANCED
                </span>
                <ChevronDown
                  size={14}
                  className={`text-dim transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              {showAdvanced && (
                <div className="mt-4">
                  <label className="font-mono text-xs text-dim mb-1 block">
                    Scale (metres/pixel)
                  </label>
                  <select
                    value={scale}
                    onChange={e => setScale(Number(e.target.value))}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2
                               font-mono text-xs text-text focus:border-algae/50 outline-none"
                  >
                    {[30, 60, 100, 200, 500].map(s => (
                      <option key={s} value={s}>{s} m — {s <= 60 ? 'High detail (slow)' : s <= 100 ? 'Balanced' : 'Fast overview'}</option>
                    ))}
                  </select>
                  <p className="font-body text-xs text-dim mt-2">
                    Lower scale = higher resolution but slower download
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            {bbox && (
              <div className="algae-card border-algae/20 bg-algae/5">
                <div className="flex items-start gap-2">
                  <Info size={13} className="text-algae mt-0.5 shrink-0" />
                  <p className="font-mono text-xs text-algae leading-relaxed">
                    Region: [{bbox.map(v => v.toFixed(3)).join(', ')}]<br />
                    {startDate} → {endDate} · ≤{cloudCover}% cloud · {scale}m/px
                  </p>
                </div>
              </div>
            )}

            {/* Detect button */}
            <button
              onClick={handleDetect}
              disabled={loading || !bbox}
              className={`algae-btn-primary w-full flex items-center justify-center gap-2
                          ${(!bbox || loading) ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none' : ''}`}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                : <><Search size={16} /> Detect Algae</>
              }
            </button>

            {!bbox && (
              <p className="font-mono text-xs text-dim text-center">
                ↑ Draw a rectangle on the map first
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
