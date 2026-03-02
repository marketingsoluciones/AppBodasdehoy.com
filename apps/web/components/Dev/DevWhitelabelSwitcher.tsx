/**
 * DevWhitelabelSwitcher - Widget flotante para cambiar whitelabel en dev/test
 *
 * Solo visible en localhost y subdominios *-test.*.
 * Escribe localStorage.__dev_domain y recarga la página para que
 * getDevelopmentNameFromHostname() lo tome como override.
 *
 * Uso en consola (alternativa sin UI):
 *   localStorage.__dev_domain = 'vivetuboda'; location.reload()
 */

import { useState, useEffect } from 'react'
import { developments } from '@bodasdehoy/shared/types'

const DEV_DOMAIN_KEY = '__dev_domain'

function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.startsWith('localhost:') ||
    !h.includes('.') ||
    h.includes('-test.') ||
    h.startsWith('test.')
  )
}

export default function DevWhitelabelSwitcher() {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<string>('bodasdehoy')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isDevEnvironment()) return
    setVisible(true)
    const saved = localStorage.getItem(DEV_DOMAIN_KEY)
    if (saved) setCurrent(saved)
  }, [])

  if (!visible) return null

  const handleChange = (development: string) => {
    localStorage.setItem(DEV_DOMAIN_KEY, development)
    setOpen(false)
    window.location.reload()
  }

  const handleClear = () => {
    localStorage.removeItem(DEV_DOMAIN_KEY)
    setOpen(false)
    window.location.reload()
  }

  const currentConfig = developments.find(d => d.development === current)

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: 12,
    }}>
      {open && (
        <div style={{
          background: '#1e1e2e',
          border: '1px solid #444',
          borderRadius: 8,
          padding: '8px 0',
          marginBottom: 8,
          minWidth: 220,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          <div style={{ padding: '4px 12px 8px', color: '#888', borderBottom: '1px solid #333', marginBottom: 4 }}>
            🏷 Cambiar whitelabel
          </div>
          {developments.map(d => (
            <button
              key={d.development}
              onClick={() => handleChange(d.development)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 12px',
                textAlign: 'left',
                background: d.development === current ? '#2d2d4e' : 'transparent',
                border: 'none',
                color: d.development === current ? '#fff' : '#ccc',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {d.development === current ? '✓ ' : '  '}{d.development}
            </button>
          ))}
          <div style={{ borderTop: '1px solid #333', marginTop: 4, padding: '4px 12px 0' }}>
            <button
              onClick={handleClear}
              style={{
                width: '100%',
                padding: '6px 0',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✕ Limpiar override (auto-detect)
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        title={`Whitelabel activo: ${current}\nHaz clic para cambiar`}
        style={{
          background: currentConfig?.theme?.primaryColor ?? '#6771ae',
          border: 'none',
          borderRadius: 20,
          padding: '6px 12px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'monospace',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        🏷 {current}
      </button>
    </div>
  )
}
