import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Satellite, Layers, Cpu, Globe, Activity, ChevronDown } from 'lucide-react'

const features = [
  {
    Icon: Satellite,
    title: 'Sentinel-2 Imagery',
    desc: 'Live satellite data fetched directly from Google Earth Engine — real pixels, real places, no mocks.',
  },
  {
    Icon: Layers,
    title: 'NDVI & NDWI Indices',
    desc: 'Normalised Difference Vegetation and Water Indices computed from Red, Green, NIR, and SWIR bands.',
  },
  {
    Icon: Cpu,
    title: 'KMeans Clustering',
    desc: 'Unsupervised machine learning separates algal bloom clusters from clean water with precision.',
  },
  {
    Icon: Globe,
    title: 'FAI Detection',
    desc: 'Floating Algae Index using spectrally-corrected NIR baseline to isolate surface blooms.',
  },
]

const stats = [
  { value: '10m', label: 'Native Resolution' },
  { value: 'S-2', label: 'Sentinel-2 SR' },
  { value: 'NDVI', label: 'Veg. Index' },
  { value: 'FAI', label: 'Algae Index' },
]

export default function Home() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    let raf

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }))

    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${p.alpha})`
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > W) p.dx *= -1
        if (p.y < 0 || p.y > H) p.dy *= -1
      })
      raf = requestAnimationFrame(draw)
    }

    draw()
    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-40" />

      {/* Grid background */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-algae/30 bg-algae/5 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-algae animate-pulse" />
          <span className="font-mono text-xs text-algae tracking-widest">SENTINEL-2 · LIVE GEE PIPELINE</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold text-bright leading-tight mb-6 max-w-4xl">
          ALGAL BLOOM<br />
          <span className="text-algae relative">
            DETECTION
            <span className="absolute -inset-1 text-algae/20 blur-md">DETECTION</span>
          </span>
          <br />SYSTEM
        </h1>

        <p className="font-body text-muted text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          Select any region on Earth. Fetch real Sentinel-2 satellite imagery.
          Compute NDVI, NDWI, and FAI. Detect algal blooms with KMeans clustering —
          all in your browser.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link to="/detector" className="algae-btn-primary flex items-center gap-2">
            Start Detection <ArrowRight size={16} />
          </Link>
          <Link to="/dashboard" className="algae-btn-secondary flex items-center gap-2">
            View Dashboard
          </Link>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-display text-2xl font-bold text-algae">{value}</div>
              <div className="font-body text-xs text-dim uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 animate-bounce text-dim">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-algae tracking-widest mb-3">// HOW IT WORKS</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-bright">
            Science-Grade Pipeline
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className="algae-card hover:border-algae/40 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-algae/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-algae/10 border border-algae/20 flex items-center justify-center">
                  <Icon size={16} className="text-algae" />
                </div>
                <span className="font-mono text-xs text-dim">0{i + 1}</span>
              </div>
              <h3 className="font-display text-sm font-bold text-bright mb-2 tracking-wide">{title}</h3>
              <p className="font-body text-xs text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline flow */}
      <section className="relative px-6 pb-32 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-algae tracking-widest mb-3">// ALGORITHM FLOW</p>
          <h2 className="font-display text-3xl font-bold text-bright">Detection Pipeline</h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-algae/40 via-water/40 to-transparent" />

          {[
            { step: '01', title: 'Fetch Sentinel-2', desc: 'GEE filters by date, cloud cover ≤20%, spatial bounds' },
            { step: '02', title: 'Extract Bands',    desc: 'B2 Blue · B3 Green · B4 Red · B8 NIR · B11 SWIR' },
            { step: '03', title: 'Compute NDWI',     desc: '(Green − NIR) / (Green + NIR) → water mask at 0.2 threshold' },
            { step: '04', title: 'Compute NDVI',     desc: '(NIR − Red) / (NIR + Red) → vegetation density proxy' },
            { step: '05', title: 'Compute FAI',      desc: 'NIR − [Red + (SWIR−Red) × λ_ratio] → floating algae' },
            { step: '06', title: 'KMeans Clustering',desc: '4-cluster unsupervised ML on water pixels (NDVI + FAI features)' },
            { step: '07', title: 'Bloom Mask',       desc: 'Highest FAI+NDVI cluster → morphological open/close cleanup' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-6 mb-8 group">
              <div className="relative z-10 w-16 h-16 shrink-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-surface border border-border group-hover:border-algae transition-colors flex items-center justify-center">
                  <span className="font-mono text-xs text-algae">{step}</span>
                </div>
              </div>
              <div className="algae-card flex-1 group-hover:border-algae/30 transition-colors">
                <h3 className="font-display text-sm text-bright font-bold mb-1">{title}</h3>
                <p className="font-mono text-xs text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/detector" className="algae-btn-primary inline-flex items-center gap-2">
            Launch Detector <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
