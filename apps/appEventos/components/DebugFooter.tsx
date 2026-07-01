import { FC, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { AuthContextProvider } from '../context'

/**
 * DebugFooter — QA 30-jun. Pinta esquina inferior derecha con:
 *   - commit SHA (inyectado en build por next.config.js)
 *   - BUILD_ID (leído del HTML)
 *   - hostname / tenant activo
 *   - flags de sesión (idTokenV0.1.0 presente, sessionBodas presente)
 *   - window.__authDegraded flag
 *
 * Solo se monta cuando hostname contiene "-dev" o "-test" o "localhost"
 * (nunca en producción real app.bodasdehoy.com / chat.bodasdehoy.com).
 * Colapsable: click en la pastilla para abrir/cerrar detalles.
 */
const HIDDEN_HOSTS_PATTERN = /^(app|chat|memories|editor|wedding-creator)\.bodasdehoy\.com$/

const DebugFooter: FC = () => {
  const [expanded, setExpanded] = useState(false)
  const [state, setState] = useState({
    hostname: '',
    buildId: 'reading…',
    hasSessionBodas: false,
    hasIdToken: false,
    hasDevUserConfig: false,
    authDegraded: null as null | Record<string, unknown>,
  })
  const commit = (process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown').slice(0, 7)
  let devContext: any = null
  try { devContext = AuthContextProvider() } catch { devContext = null }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const readBuildId = (): string => {
      try {
        const nd = (window as any).__NEXT_DATA__
        if (nd?.buildId) return String(nd.buildId).slice(0, 21)
      } catch {}
      return 'unknown'
    }
    const readLocalStorageKey = (key: string): boolean => {
      try { return !!window.localStorage.getItem(key) } catch { return false }
    }
    const refresh = () => {
      setState({
        hostname: window.location.hostname,
        buildId: readBuildId(),
        hasSessionBodas: !!Cookies.get('sessionBodas'),
        hasIdToken: !!Cookies.get('idTokenV0.1.0'),
        hasDevUserConfig: readLocalStorageKey('dev-user-config'),
        authDegraded: (window as any).__authDegraded ?? null,
      })
    }
    refresh()
    const id = window.setInterval(refresh, 3000)
    return () => window.clearInterval(id)
  }, [])

  if (typeof window === 'undefined') return null
  if (!state.hostname) return null
  if (HIDDEN_HOSTS_PATTERN.test(state.hostname)) return null

  const okDot = (ok: boolean) => (
    <span style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: ok ? '#22c55e' : '#ef4444',
      marginRight: 4,
    }} />
  )

  return (
    <div
      data-testid="debug-footer"
      style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        zIndex: 2_147_483_000,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 10,
        color: '#f9fafb',
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        borderRadius: 6,
        padding: expanded ? '8px 10px' : '4px 8px',
        maxWidth: expanded ? 320 : 220,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
      onClick={() => setExpanded((v) => !v)}
      title="click para expandir/colapsar"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#a78bfa', fontWeight: 700 }}>dbg</span>
        <span>{commit}</span>
        <span style={{ color: '#94a3b8' }}>|</span>
        <span title="cookies">
          {okDot(state.hasSessionBodas)}sB
          {okDot(state.hasIdToken)}iT
        </span>
        {state.authDegraded ? (
          <span style={{ color: '#fbbf24', marginLeft: 4 }} title="auth degraded">deg</span>
        ) : null}
      </div>
      {expanded ? (
        <div style={{ marginTop: 8, lineHeight: 1.4 }}>
          <div><b>host</b>: {state.hostname}</div>
          <div><b>buildId</b>: {state.buildId}</div>
          <div><b>commit</b>: {commit}</div>
          <div><b>tenant</b>: {devContext?.config?.development || 'unresolved'}</div>
          <div>{okDot(state.hasSessionBodas)}<b>sessionBodas</b></div>
          <div>{okDot(state.hasIdToken)}<b>idTokenV0.1.0</b></div>
          <div>{okDot(state.hasDevUserConfig)}<b>dev-user-config</b> (LS)</div>
          {state.authDegraded ? (
            <div style={{ marginTop: 6, color: '#fbbf24' }}>
              <b>__authDegraded</b>: {JSON.stringify(state.authDegraded).slice(0, 200)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default DebugFooter
