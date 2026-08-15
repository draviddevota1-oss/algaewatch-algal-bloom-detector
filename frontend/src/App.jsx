import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Detector from './pages/Detector'
import Results from './pages/Results'
import MapView from './pages/MapView'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-void relative">
        {/* Ambient scan line */}
        <div className="scan-line" />

        <Navbar />

        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/detector"  element={<Detector />} />
          <Route path="/results"   element={<Results />} />
          <Route path="/map"       element={<MapView />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#141c35',
              color:      '#c8d8f0',
              border:     '1px solid #1e2d4a',
              fontFamily: 'DM Sans, sans-serif',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
