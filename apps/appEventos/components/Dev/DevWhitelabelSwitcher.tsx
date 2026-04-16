/**
 * DevWhitelabelSwitcher - Widget flotante para cambiar whitelabel en dev/test
 *
 * Solo visible en entornos no-producción (cualquier subdominio o localhost).
 * Muestra el whitelabel efectivo actual y permite cambiarlo.
 *
 * Prioridad (igual que getDevelopmentNameFromHostname):
 *   1. NEXT_PUBLIC_DEV_WHITELABEL (env var) → solo info, no se puede cambiar desde aquí
 *   2. localStorage.__dev_domain → se puede cambiar desde este widget
 *   3. Detección automática por hostname
 *
 * Alternativa sin UI (consola del navegador):
 *   localStorage.__dev_domain = 'vivetuboda'; location.reload()
 */

import { useState, useEffect } from 'react'
import { developments } from '@bodasdehoy/shared/types'

const DEV_DOMAIN_KEY = '__dev_domain'

// Obtiene el valor efectivo: env var > localStorage > hostname
function getEffectiveWhitelabel(): { value: string; source: 'env' | 'localStorage' | 'hostname' } {
  const knownDevelopments = developments.map(d => d.development)

  // 1. Env var (NEXT_PUBLIC_ es visible en el bundle del cliente)
  const envVal = process.env.NEXT_PUBLIC_DEV_WHITELABEL ?? ''
  if (envVal && knownDevelopments.includes(envVal)) {
    return { value: envVal, source: 'env' }
  }

  // 2. localStorage
  const lsVal = typeof localStorage !== 'undefined' ? localStorage.getItem(DEV_DOMAIN_KEY) ?? '' : ''
  if (lsVal && knownDevelopments.includes(lsVal)) {
    return { value: lsVal, source: 'localStorage' }
  }

  // 3. Hostname
  const h = typeof window !== 'undefined' ? window.location.hostname : ''
  const parts = h.split('.')
  const idx = parts.findIndex(p => p === 'com' || p === 'mx')
  if (idx > 0 && knownDevelopments.includes(parts[idx - 1])) {
    return { value: parts[idx - 1], source: 'hostname' }
  }
  for (const dev of knownDevelopments) {
    if (h.includes(dev)) return { value: dev, source: 'hostname' }
  }

  return { value: 'bodasdehoy', source: 'hostname' }
}

function isLocalDevEnv(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
}

export default function DevWhitelabelSwitcher() {
  const [visible, setVisible] = useState(false)
  const [effective, setEffective] = useState<{ value: string; source: 'env' | 'localStorage' | 'hostname' }>({ value: 'bodasdehoy', source: 'hostname' })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isLocalDevEnv()) return
    setVisible(true)
    setEffective(getEffectiveWhitelabel())
  }, [])

  if (!visible) return null

  const isEnvLocked = effective.source === 'env'
  const currentConfig = developments.find(d => d.development === effective.value)

  const handleChange = (development: string) => {
    if (isEnvLocked) return
    localStorage.setItem(DEV_DOMAIN_KEY, development)
    setOpen(false)
    window.location.reload()
  }

  const handleClear = () => {
    if (isEnvLocked) return
    localStorage.removeItem(DEV_DOMAIN_KEY)
    setOpen(false)
    window.location.reload()
  }

  const sourceLabel = isEnvLocked
    ? '.env.local'
    : effective.source === 'localStorage'
      ? 'localStorage'
      : 'auto-detect'

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
          minWidth: 240,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          maxHeight: 360,
          overflowY: 'auto',
        }}>
          {/* Header con fuente activa */}
          <div style={{ padding: '4px 12px 8px', borderBottom: '1px solid #333', marginBottom: 4 }}>
            <div style={{ color: '#ccc', marginBottom: 2 }}>🏷 Whitelabel ({sourceLabel})</div>
            {isEnvLocked && (
              <div style={{
                color: '#facc15',
                fontSize: 10,
                lineHeight: '1.4',
                background: '#2d2500',
                borderRadius: 4,
                padding: '3px 6px',
                marginTop: 4,
              }}>
                Fijado por NEXT_PUBLIC_DEV_WHITELABEL.<br />
                Para cambiar: edita .env.local y reinicia.
              </div>
            )}
          </div>

          {/* Lista de whitelabels */}
          {developments.map(d => (
            <button
              key={d.development}
              onClick={() => handleChange(d.development)}
              disabled={isEnvLocked}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 12px',
                textAlign: 'left',
                background: d.development === effective.value ? '#2d2d4e' : 'transparent',
                border: 'none',
                color: isEnvLocked
                  ? (d.development === effective.value ? '#aaa' : '#555')
                  : (d.development === effective.value ? '#fff' : '#ccc'),
                cursor: isEnvLocked ? 'default' : 'pointer',
                fontSize: 12,
              }}
            >
              {d.development === effective.value ? '✓ ' : '  '}{d.development}
            </button>
          ))}

          {/* Botón limpiar override */}
          {!isEnvLocked && (
            <div style={{ borderTop: '1px solid #333', marginTop: 4, padding: '4px 12px 0' }}>
              <button
                onClick={handleClear}
                style={{
                  width: '100%',
                  padding: '6px 0',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  color: effective.source === 'localStorage' ? '#f87171' : '#555',
                  cursor: effective.source === 'localStorage' ? 'pointer' : 'default',
                  fontSize: 12,
                }}
              >
                ✕ Limpiar localStorage (volver a auto-detect)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Badge flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        title={`Whitelabel: ${effective.value} (${sourceLabel})\nHaz clic para ver opciones`}
        style={{
          background: currentConfig?.theme?.primaryColor ?? '#6771ae',
          border: isEnvLocked ? '2px solid #facc15' : 'none',
          borderRadius: 20,
          padding: '5px 12px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'monospace',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
          opacity: 0.9,
        }}
      >
        🏷 {effective.value}
        {isEnvLocked && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.8 }}>.env</span>}
      </button>
    </div>
  )
}
