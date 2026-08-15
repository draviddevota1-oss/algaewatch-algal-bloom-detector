/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void:    '#050810',
        deep:    '#0a0f1e',
        surface: '#0f1629',
        panel:   '#141c35',
        border:  '#1e2d4a',
        algae:   '#00ff88',
        water:   '#0ea5e9',
        dim:     '#4a6080',
        muted:   '#7a90b0',
        text:    '#c8d8f0',
        bright:  '#e8f4ff',
      },
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
        'scan':        'scan 4s linear infinite',
        'float':       'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%':   { 'box-shadow': '0 0 5px #00ff88, 0 0 10px #00ff8840' },
          '100%': { 'box-shadow': '0 0 20px #00ff88, 0 0 40px #00ff8860' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
