import React from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Map, BarChart3, Download, ArrowRight,
  Waves, Leaf, Zap, Activity,
} from 'lucide-react'

const actions = [
  {
    to: '/detector',
    Icon: Search,
    label: 'Run Detection',
    desc: 'Select a region and detect algal blooms',
    accent: 'algae',
    primary: true,
  },
  {
    to: '/map',
    Icon: Map,
    label: 'Satellite Map',
    desc: 'View live Sentinel-2 satellite layer',
    accent: 'water',
  },
  {
    to: '/results',
    Icon: BarChart3,
    label: 'View Results',
    desc: 'Browse previous detection outputs',
    accent: 'algae',
  },
]

const indices = [
  {
    Icon: Waves,
    name: 'NDWI',
    formula: '(Green − NIR) / (Green + NIR)',
    purpose: 'Isolates open water pixels from land',
    threshold: '> 0.2',
    color: 'text-water border-water/30 bg-water/5',
  },
  {
    Icon: Leaf,
    name: 'NDVI',
    formula: '(NIR − Red) / (NIR + Red)',
    purpose: 'Measures photosynthetic biomass density',
    threshold: 'Feature input for KMeans',
    color: 'text-algae border-algae/30 bg-algae/5',
  },
  {
    Icon: Zap,
    name: 'FAI',
    formula: 'NIR − [Red + (SWIR−Red) × λ]',
    purpose: 'Detects floating algal biomass on surface',
    threshold: 'Feature input for KMeans',
    color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <p className="font-mono text-xs text-algae tracking-widest mb-2">// SYSTEM OVERVIEW</p>
          <h1 className="font-display text-4xl font-bold text-bright mb-3">Dashboard</h1>
          <p className="font-body text-muted max-w-xl">
            AlgaeWatch combines Google Earth Engine satellite imagery with spectral analysis
            algorithms to identify algal bloom events in water bodies globally.
          </p>
        </div>

        {/* Status bar */}
        <div className="algae-card mb-10 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-algae animate-pulse" />
            <span className="font-mono text-xs text-algae">SYSTEM ONLINE</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex gap-6">
            {[
              { label: 'Satellite', value: 'Sentinel-2 SR' },
              { label: 'Collection', value: 'COPERNICUS/S2_SR_HARMONIZED' },
              { label: 'Bands', value: 'B2 B3 B4 B8 B11' },
              { label: 'Algorithm', value: 'NDVI + FAI + KMeans' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="font-mono text-xs text-dim">{label}</div>
                <div className="font-mono text-xs text-text">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {actions.map(({ to, Icon, label, desc, primary }) => (
            <Link
              key={to}
              to={to}
              className={`algae-card group hover:border-${primary ? 'algae' : 'water'}/50
                         transition-all duration-300 flex flex-col gap-3`}
            >
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center
                              ${primary
                                ? 'bg-algae/10 border-algae/30 group-hover:bg-algae/20'
                                : 'bg-water/10 border-water/30 group-hover:bg-water/20'}
                              transition-colors`}>
                <Icon size={18} className={primary ? 'text-algae' : 'text-water'} />
              </div>
              <div>
                <div className="font-display text-sm text-bright font-bold mb-1">{label}</div>
                <div className="font-body text-xs text-muted">{desc}</div>
              </div>
              <div className={`flex items-center gap-1 font-mono text-xs mt-auto
                               ${primary ? 'text-algae' : 'text-water'}`}>
                Open <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>

        {/* Indices reference */}
        <div className="mb-12">
          <p className="font-mono text-xs text-algae tracking-widest mb-6">// SPECTRAL INDICES REFERENCE</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {indices.map(({ Icon, name, formula, purpose, threshold, color }) => (
              <div key={name} className={`algae-card border ${color}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Icon size={18} />
                  <span className="font-display text-base font-bold">{name}</span>
                </div>
                <div className="font-mono text-xs bg-void/60 border border-border rounded px-3 py-2 mb-3 break-all">
                  {formula}
                </div>
                <p className="font-body text-xs text-muted mb-2">{purpose}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="font-mono text-xs text-dim">Threshold:</span>
                  <span className="font-mono text-xs">{threshold}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline diagram */}
        <div>
          <p className="font-mono text-xs text-algae tracking-widest mb-6">// DETECTION PIPELINE</p>
          <div className="algae-card">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {[
                'GEE Fetch', '→', 'Band Extract', '→', 'NDWI Mask',
                '→', 'NDVI + FAI', '→', 'KMeans(4)', '→', 'Bloom Mask',
              ].map((item, i) => (
                <span
                  key={i}
                  className={item === '→'
                    ? 'text-dim text-lg'
                    : 'font-mono text-xs px-3 py-1.5 rounded bg-surface border border-border text-text'
                  }
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
