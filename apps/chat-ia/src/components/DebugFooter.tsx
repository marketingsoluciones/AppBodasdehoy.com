'use client'

import { FC, useEffect, useState } from 'react'

/**
 * DebugFooter — QA 30-jun. Chat-ia edition.
 * Muestra en dev/-dev/-test: commit SHA + BUILD_ID + tenant + auth flags.
 * Oculto en producción real (chat.bodasdehoy.com, app.bodasdehoy.com, etc.).
 */
const HIDDEN_HOSTS_PATTERN =
  /^(app|chat|memories|editor|wedding-creator|organizador)\.bodasdehoy\.com$/

const DebugFooter: FC = () => {
  const [expanded, setExpanded] = useState(false)
  const [state, setState] = useState({
    hostname: '',
    buildId: 'reading…',
    tenant: 'unresolved',
    hasSessionBodas: false,
    hasIdToken: false,
    hasDevUserConfig: false,
    hasMcpJwt: false,
    hasFirebase: false,
    authDegraded: null as null | Record<string, unknown>,
  })
  const commit = (process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown').slice(0, 7)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const cookieHas = (name: string): boolean => {
      try {
        return document.cookie.split('; ').some((c) => c.startsWith(`${name}=`) && c.split('=')[1])
      } catch { return false }
    }
    const lsHas = (key: string): boolean => {
      try { return !!window.localStorage.getItem(key) } catch { return false }
    }
    const readBuildId = (): string => {
      try {
        const scripts = Array.from(document.scripts)
        for (const s of scripts) {
          const src = s.src || ''
          const m = src.match(/\/_next\/static\/([^/]+)\/_buildManifest/)
          if (m) return m[1]
        }
        // fallback: buscar en __next_f
        const raw = document.querySelector('script[id="__NEXT_DATA__"]')?.textContent
        if (raw) {
          try {
            const j = JSON.parse(raw)
            if (j?.buildId) return String(j.buildId).slice(0, 21)
          } catch {}
        }
        // Última opción: primer chunk hash del __next_f del stream
        const bodyText = document.body?.innerHTML?.match(/"b":"([A-Za-z0-9_-]+)"/)
        if (bodyText?.[1]) return bodyText[1]
      } catch {}
      return 'unknown'
    }
    const refresh = () => {
      const hostname = window.location.hostname
      const parts = hostname.split('.')
      const tenant = parts.length >= 3 ? parts[parts.length - 3] : hostname
      setState({
        hostname,
        buildId: readBuildId(),
        tenant,
        hasSessionBodas: cookieHas('sessionBodas'),
        hasIdToken: cookieHas('idTokenV0.1.0'),
        hasDevUserConfig: lsHas('dev-user-config'),
        hasMcpJwt: lsHas('mcp_jwt_token'),
        hasFirebase: lsHas('user_uid'),
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
        maxWidth: expanded ? 340 : 240,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        pointerEvents: 'auto',
      }}
      onClick={() => setExpanded((v) => !v)}
      title="click para expandir/colapsar"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ color: '#a78bfa', fontWeight: 700 }}>dbg</span>
        <span>{commit}</span>
        <span style={{ color: '#94a3b8' }}>|</span>
        <span title="cookies">
          {okDot(state.hasSessionBodas)}sB
          {okDot(state.hasIdToken)}iT
          {okDot(state.hasMcpJwt)}mcp
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
          <div><b>tenant</b>: {state.tenant}</div>
          <div>{okDot(state.hasSessionBodas)}<b>sessionBodas</b> (cookie)</div>
          <div>{okDot(state.hasIdToken)}<b>idTokenV0.1.0</b> (cookie)</div>
          <div>{okDot(state.hasDevUserConfig)}<b>dev-user-config</b> (LS)</div>
          <div>{okDot(state.hasMcpJwt)}<b>mcp_jwt_token</b> (LS)</div>
          <div>{okDot(state.hasFirebase)}<b>user_uid</b> (LS)</div>
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
