import React, { useState } from 'react'
import { MapContainer, TileLayer, LayersControl, ScaleControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers, Info } from 'lucide-react'

const { BaseLayer, Overlay } = LayersControl

const TILE_LAYERS = [
  {
    name: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, GeoEye',
  },
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  {
    name: 'Stamen Terrain',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
    attribution: 'Stadia Maps, Stamen Design',
  },
]

const KNOWN_REGIONS = [
  { name: 'Chilika Lake, India',    lat: 19.75, lng: 85.3, zoom: 11,
    note: 'Largest brackish water lagoon in Asia, prone to seasonal algal blooms' },
  { name: 'Lake Taihu, China',      lat: 31.2, lng: 120.2, zoom: 10,
    note: 'Heavily eutrophied lake with frequent cyanobacteria blooms' },
  { name: 'Lake Erie, USA/Canada',  lat: 42.0, lng: -81.0, zoom: 8,
    note: 'Western basin experiences annual Microcystis blooms in summer' },
  { name: 'Baltic Sea',             lat: 59.5, lng: 23.0, zoom: 7,
    note: 'Recurring summer cyanobacteria blooms, visible from space' },
  { name: 'Pulicat Lake, India',    lat: 13.75, lng: 80.25, zoom: 11,
    note: 'Second-largest brackish water lake in India' },
]

export default function MapView() {
  const [center, setCenter] = useState([20, 80])
  const [zoom, setZoom]     = useState(5)
  const [active, setActive] = useState(null)

  return (
    <div className="min-h-screen pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="font-mono text-xs text-algae tracking-widest mb-1">// SATELLITE VIEW</p>
          <h1 className="font-display text-3xl font-bold text-bright">Map View</h1>
          <p className="font-body text-sm text-muted mt-1">
            Explore Sentinel-2 compatible regions. Navigate to an area of interest,
            then use the Detector to run analysis.
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="algae-card">
              <h3 className="font-display text-xs text-bright font-bold tracking-wider mb-3 flex items-center gap-2">
                <Layers size={12} className="text-algae" /> KNOWN BLOOM SITES
              </h3>
              <div className="flex flex-col gap-1.5">
                {KNOWN_REGIONS.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => { setCenter([r.lat, r.lng]); setZoom(r.zoom); setActive(r) }}
                    className={`text-left px-3 py-2 rounded-lg border transition-all font-body text-xs
                                ${active?.name === r.name
                                  ? 'border-algae text-algae bg-algae/10'
                                  : 'border-border text-muted hover:border-algae/30 hover:text-text'}`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {active && (
              <div className="algae-card border-algae/20 bg-algae/5">
                <div className="flex items-start gap-2">
                  <Info size={13} className="text-algae mt-0.5 shrink-0" />
                  <div>
                    <div className="font-display text-xs text-algae font-bold mb-1">{active.name}</div>
                    <p className="font-body text-xs text-muted leading-relaxed">{active.note}</p>
                    <div className="font-mono text-xs text-dim mt-2">
                      {active.lat.toFixed(2)}°N, {active.lng.toFixed(2)}°E
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="algae-card">
              <h3 className="font-display text-xs text-bright font-bold tracking-wider mb-3">
                TILE SOURCES
              </h3>
              <p className="font-body text-xs text-muted">
                Use the layers icon in the map top-right to switch between:
              </p>
              <ul className="mt-2 space-y-1">
                {TILE_LAYERS.map(l => (
                  <li key={l.name} className="font-mono text-xs text-dim">· {l.name}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Map */}
          <div className="algae-card !p-0 overflow-hidden rounded-xl" style={{ height: '620px' }}>
            <MapContainer
              center={center}
              zoom={zoom}
              key={`${center[0]}-${center[1]}-${zoom}`}
              style={{ height: '100%', width: '100%' }}
            >
              <LayersControl position="topright">
                {TILE_LAYERS.map((layer, i) => (
                  <BaseLayer key={layer.name} checked={i === 0} name={layer.name}>
                    <TileLayer url={layer.url} attribution={layer.attribution} />
                  </BaseLayer>
                ))}
              </LayersControl>
              <ScaleControl position="bottomleft" />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
