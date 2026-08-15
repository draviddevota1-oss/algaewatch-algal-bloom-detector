import React, { useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Download, ZoomIn, ZoomOut, ArrowLeft, Search, BarChart3, RefreshCw } from 'lucide-react'

function StatCard({ label, value, unit, accent }) {
  return (
    <div className="stat-card">
      <div className="font-mono text-xs text-dim">{label}</div>
      <div className={`font-display text-2xl font-bold ${accent || 'text-bright'}`}>
        {value}
        {unit && <span className="text-sm font-normal text-muted ml-1">{unit}</span>}
      </div>
    </div>
  )
}

export default function Results() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const result    = state?.result

  const [activeImg, setActiveImg] = useState('overlay')  // 'overlay' | 'combined'
  const [zoom, setZoom]           = useState(1)

  if (!result) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-6">
        <div className="algae-card text-center max-w-md">
          <BarChart3 size={40} className="text-dim mx-auto mb-4" />
          <h2 className="font-display text-xl text-bright font-bold mb-2">No Results Yet</h2>
          <p className="font-body text-sm text-muted mb-6">
            Run a detection first to see results here.
          </p>
          <Link to="/detector" className="algae-btn-primary inline-flex items-center gap-2">
            <Search size={14} /> Go to Detector
          </Link>
        </div>
      </div>
    )
  }

  const imgSrc = (name) => `/api/results/${name}`

  const handleDownload = async (filename) => {
    try {
      const res = await fetch(`/api/download/${filename}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Make sure the backend is running.')
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs text-algae tracking-widest mb-1">// DETECTION RESULTS</p>
            <h1 className="font-display text-3xl font-bold text-bright">
              Job <span className="text-algae">{result.job_id}</span>
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/detector')}
              className="algae-btn-ghost flex items-center gap-2"
            >
              <RefreshCw size={14} /> New Detection
            </button>
            <Link to="/detector" className="algae-btn-secondary flex items-center gap-2">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Bloom Coverage"
            value={result.bloom_coverage}
            unit="%"
            accent="text-algae"
          />
          <StatCard
            label="Bloom Pixels"
            value={result.bloom_pixels?.toLocaleString()}
            accent="text-algae"
          />
          <StatCard
            label="Water Pixels"
            value={result.water_pixels?.toLocaleString()}
            accent="text-water"
          />
          <StatCard
            label="Resolution"
            value={result.scale_m}
            unit="m/px"
            accent="text-text"
          />
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">

          {/* Image viewer */}
          <div className="algae-card !p-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {['overlay', 'combined'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveImg(t)}
                    className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors
                                ${activeImg === t
                                  ? 'border-algae text-algae bg-algae/10'
                                  : 'border-border text-muted hover:border-algae/30'}`}
                  >
                    {t === 'overlay' ? 'Bloom Overlay' : 'Full Analysis'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  className="w-8 h-8 rounded-lg border border-border hover:border-algae/30
                             flex items-center justify-center text-muted hover:text-text transition-colors"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="font-mono text-xs text-dim w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="w-8 h-8 rounded-lg border border-border hover:border-algae/30
                             flex items-center justify-center text-muted hover:text-text transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="overflow-auto rounded-lg bg-void border border-border"
                 style={{ maxHeight: '520px' }}>
              <img
                src={imgSrc(activeImg === 'overlay' ? result.overlay_image : result.combined_image)}
                alt="Detection result"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left',
                         transition: 'transform 0.2s' }}
                className="max-w-none"
              />
            </div>

            {/* Download buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleDownload(result.overlay_image)}
                className="algae-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download Overlay
              </button>
              <button
                onClick={() => handleDownload(result.combined_image)}
                className="algae-btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download Analysis
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-4">
            <div className="algae-card">
              <h3 className="font-display text-xs text-bright font-bold tracking-wider mb-4">
                DETECTION PARAMETERS
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Bounding Box',
                    value: result.bbox?.map(v => v.toFixed(3)).join(', ') },
                  { label: 'Date Range',
                    value: `${result.start_date} → ${result.end_date}` },
                  { label: 'Scale', value: `${result.scale_m} m/pixel` },
                  { label: 'Status', value: result.status },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-dim">{label}</span>
                    <span className="font-mono text-xs text-text break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="algae-card border-algae/20 bg-algae/5">
              <h3 className="font-display text-xs text-algae font-bold tracking-wider mb-3">
                BLOOM ANALYSIS
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-dim">Coverage</span>
                  <span className="font-mono text-xs text-algae">{result.bloom_coverage}%</span>
                </div>
                <div className="w-full h-2 bg-void rounded-full overflow-hidden">
                  <div
                    className="h-full bg-algae rounded-full transition-all"
                    style={{ width: `${Math.min(result.bloom_coverage, 100)}%` }}
                  />
                </div>
                <p className="font-body text-xs text-muted mt-2">
                  {result.bloom_coverage > 30
                    ? '⚠️ High bloom coverage detected. Water quality may be significantly impacted.'
                    : result.bloom_coverage > 10
                    ? '⚡ Moderate bloom presence. Monitor for further growth.'
                    : '✓ Low bloom coverage. Water body appears mostly clear.'}
                </p>
              </div>
            </div>

            <div className="algae-card">
              <h3 className="font-display text-xs text-bright font-bold tracking-wider mb-3">
                LEGEND
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#00ff58]" />
                  <span className="font-body text-xs text-muted">Algal Bloom (FAI cluster)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#1a66e8]" />
                  <span className="font-body text-xs text-muted">Clean Water (NDWI &gt; 0.2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#444]" />
                  <span className="font-body text-xs text-muted">Land / Non-water</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
