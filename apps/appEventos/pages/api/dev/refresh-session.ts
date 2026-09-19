/**
 * API para autenticación de desarrollo
 *
 * Uso desde consola del navegador:
 *
 * // Opción 1: Con email (más fácil)
 * fetch('/api/dev/refresh-session', {
 *   method: 'POST',
 *   headers: {'Content-Type': 'application/json'},
 *   body: JSON.stringify({email: 'jcc@bodasdehoy.com'}),
 *   credentials: 'include'
 * }).then(r => r.json()).then(d => { console.log(d); if(d.success) location.reload() })
 *
 * // Opción 2: Desde idToken existente en cookies
 * fetch('/api/dev/refresh-session', {method: 'POST', credentials: 'include'})
 *   .then(r => r.json())
 *   .then(d => { if(d.success) location.reload() })
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import Cookies from 'cookies'
import { resolveApiBodasGraphqlUrl, resolveApiIaOrigin } from '../../../utils/apiEndpoints'

const BACKEND_URL = resolveApiIaOrigin()
const API_URL = resolveApiBodasGraphqlUrl()

// Identificar usuario por email usando el backend
async function identifyUserByEmail(email: string, development: string = 'bodasdehoy') {
  const backendUrl = `${BACKEND_URL.replace(/\/$/, '')}/api/auth/identify-user`

  try {
    const response = await fetch(backendUrl, {
      body: JSON.stringify({ developer: development, email }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(7000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`⚠️ identify-user devolvió HTTP ${response.status}: ${errorText.slice(0, 150)}`)
      return null
    }

    return await response.json()
  } catch (error: any) {
    console.warn('⚠️ No se pudo contactar al backend identify-user:', error?.message || error)
    return null
  }
}

// Obtener sessionCookie desde idToken
async function getSessionFromIdToken(idToken: string) {
  const authResult = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation Auth($idToken: String!) {
          auth(idToken: $idToken) {
            sessionCookie
          }
        }
      `,
      variables: { idToken }
    })
  })

  const data = await authResult.json()
  return data?.data?.auth?.sessionCookie || null
}

/**
 * QA-R6 (2-jul): el bypass "force" antes emitía `Buffer.from(JSON.stringify(...)).toString('base64')`
 * → una sola parte, sin puntos → parseSessionJwt lo rechazaba y chat-dev quedaba
 * en guest shell tras SSO. Ahora emitimos un pseudo-JWT (header.payload.signature)
 * con firma placeholder — el shape valida en el front (isLikelyJwt requiere 3
 * partes separadas por '.'), aunque el backend real lo rechazaría por firma.
 * El campo `dev:true + force:true` sigue marcando el token como no-productivo.
 */
function mintDevPseudoJwt(payload: Record<string, unknown>): string {
  const b64url = (s: string) => Buffer.from(s).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const header = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = b64url('dev-refresh-session-force-bypass-not-verified');
  return `${header}.${body}.${sig}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Solo permitir en desarrollo o subdominios de test/dev
  // QA 30-jun: app-dev y chat-dev (entornos de desarrollo servidos en
  // producción Next) estaban fuera del whitelist → bypass 403 en QA.
  // Patrón `-dev` también cubre subdominios *-dev futuros sin abrir el
  // endpoint a hosts arbitrarios que contengan "dev".
  const host = req.headers.host || ''
  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1')
  const isDevOrTest =
    isLocalHost ||
    host.includes('-test') ||
    host.includes('-dev') ||
    host.includes('chat-test') ||
    host.includes('app-test')

  // Detectar si estamos detrás de un proxy (Cloudflare Tunnel)
  // En ese caso, la conexión interna es HTTP aunque el cliente use HTTPS
  const isBehindProxy = req.headers['x-forwarded-proto'] === 'https' || req.headers['cf-visitor']
  // Para dev/test, desactivar secure cookies cuando estamos detrás de proxy local
  const useSecureCookies = !isLocalHost && !isBehindProxy

  if (!isDevOrTest && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is only available in development/test environments' })
  }

  try {
    const cookies = new Cookies(req, res)
    const { email, development } = req.body || {}

    // Opción 1: Autenticación por email (más fácil para desarrollo)
    if (email) {
      console.log(`[dev/refresh-session] Intentando identificar usuario por email: ${email} (development: ${development || 'bodasdehoy'})`)

      const { force } = req.body || {}
      const userData = await identifyUserByEmail(email, development || 'bodasdehoy')

      // Si force=true y estamos en localhost o test, crear sesión sin verificar backend
      if (force && isDevOrTest && !userData?.success) {
        console.log(`[dev/refresh-session] Modo FORCE: Creando sesión sin verificar backend (host: ${host})`)
        const oneYear = 365 * 24 * 60 * 60 * 1000
        const expires = new Date(Date.now() + oneYear)

        const devSessionToken = mintDevPseudoJwt({
          email,
          sub: 'dev_user_' + Date.now(),
          user_id: 'dev_user_' + Date.now(),
          uid: 'dev_user_' + Date.now(),
          role: 'user',
          dev: true,
          force: true,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        })

        cookies.set('sessionBodas', devSessionToken, {
          domain: isLocalHost ? undefined : '.bodasdehoy.com',
          path: '/',
          expires,
          httpOnly: false,
          secure: useSecureCookies,
          sameSite: 'lax'
        })

        return res.status(200).json({
          success: true,
          message: `Sesión FORCE creada para ${email}. Recarga la página.`,
          warning: 'Esta sesión es solo para desarrollo/test',
          expires: expires.toISOString()
        })
      }

      if (userData?.success) {
        // El usuario existe, establecer cookies de sesión simuladas
        const oneYear = 365 * 24 * 60 * 60 * 1000
        const expires = new Date(Date.now() + oneYear)

        // QA-R6 (2-jul): pseudo-JWT 3 partes para que chat-dev acepte cookie
        // cross-domain (parseSessionJwt requiere `header.payload.signature`).
        const devSessionToken = mintDevPseudoJwt({
          email,
          sub: userData.user_id,
          user_id: userData.user_id,
          uid: userData.user_id,
          role: userData.role,
          dev: true,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        })

        cookies.set('sessionBodas', devSessionToken, {
          domain: isLocalHost ? undefined : '.bodasdehoy.com',
          path: '/',
          expires,
          httpOnly: false,
          secure: useSecureCookies,
          sameSite: 'lax'
        })

        return res.status(200).json({
          success: true,
          message: `Sesión de desarrollo creada para ${email}. Recarga la página.`,
          user: userData.user_data,
          eventos: userData.eventos?.length || 0,
          expires: expires.toISOString()
        })
      } else {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          email,
          hint: 'Verifica que el email esté registrado en el sistema'
        })
      }
    }

    // Opción 2: Refrescar desde idToken existente
    const idToken = cookies.get('idTokenV0.1.0')

    if (!idToken) {
      return res.status(401).json({
        error: 'No idToken found and no email provided',
        hint: 'Usa {email: "tu@email.com"} en el body o asegúrate de tener idTokenV0.1.0 en las cookies',
        usage: 'fetch("/api/dev/refresh-session", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: "jcc@bodasdehoy.com"}), credentials: "include"})'
      })
    }

    const sessionCookie = await getSessionFromIdToken(idToken)

    if (sessionCookie) {
      const oneYear = 365 * 24 * 60 * 60 * 1000
      const expires = new Date(Date.now() + oneYear)

      // Establecer sessionBodas con expiración de 365 días
      cookies.set('sessionBodas', sessionCookie, {
        domain: isLocalHost ? undefined : '.bodasdehoy.com',
        path: '/',
        expires,
        httpOnly: false,
        secure: useSecureCookies,
        sameSite: 'lax'
      })

      // También actualizar la expiración del idToken si es necesario
      // El idToken ya está establecido, solo asegurarnos de que tenga la expiración correcta
      cookies.set('idTokenV0.1.0', idToken, {
        domain: isLocalHost ? undefined : '.bodasdehoy.com',
        path: '/',
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora para idToken
        httpOnly: false,
        secure: useSecureCookies,
        sameSite: 'lax'
      })

      return res.status(200).json({
        success: true,
        message: 'Session refreshed from idToken! Reload the page.',
        expires: expires.toISOString(),
        idTokenExpires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      })
    } else {
      return res.status(400).json({
        error: 'Could not get sessionCookie from backend',
        hint: 'El idToken puede haber expirado. Intenta con email en su lugar.',
        usage: 'fetch("/api/dev/refresh-session", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: "jcc@bodasdehoy.com"}), credentials: "include"})'
      })
    }
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal error',
      message: error?.message
    })
  }
}
