import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Activity, Map, Search, BarChart3, Home, Menu, X } from 'lucide-react'

const links = [
  { to: '/',          label: 'Home',      Icon: Home },
  { to: '/dashboard', label: 'Dashboard', Icon: BarChart3 },
  { to: '/detector',  label: 'Detector',  Icon: Search },
  { to: '/map',       label: 'Map',       Icon: Map },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [location])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-void/95 border-b border-border backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Activity
              size={22}
              className="text-algae group-hover:animate-pulse"
            />
            <div className="absolute inset-0 text-algae opacity-40 blur-sm">
              <Activity size={22} />
            </div>
          </div>
          <span className="font-display text-bright font-bold tracking-wider text-sm">
            ALGAE<span className="text-algae">WATCH</span>
          </span>
        </NavLink>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* CTA */}
        <NavLink
          to="/detector"
          className="hidden md:block algae-btn-primary text-xs px-5 py-2"
        >
          Run Detection
        </NavLink>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          className="md:hidden text-muted hover:text-algae transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-deep border-b border-border px-6 pb-4">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link flex items-center gap-3 w-full mb-1 ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
          <NavLink to="/detector" className="algae-btn-primary block text-center mt-3 text-xs">
            Run Detection
          </NavLink>
        </div>
      )}
    </header>
  )
}
