/**
 * API para autenticación de desarrollo
 *
 * Uso desde consola del navegador:
 *
 * // Opción 1: Con email (más fácil)
 * fetch('/api/dev/refresh-session', {
 *   method: 'POST',
 *   headers: {'Content-Type': 'application/json'},
 *   body: JSON.stringify({email: 'bodasdehoy.com@gmail.com'}),
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

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-chat-test.bodasdehoy.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.bodasdehoy.com/graphql'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Solo permitir en desarrollo o subdominios de test
  const host = req.headers.host || ''
  const isDevOrTest = host.includes('localhost') || host.includes('chat-test') || host.includes('test')

  if (!isDevOrTest && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is only available in development/test environments' })
  }

  try {
    const cookies = new Cookies(req, res)
    const { email } = req.body || {}

    // Opción 1: Autenticación por email (más fácil para desarrollo)
    if (email) {
      console.log(`[dev/refresh-session] Intentando identificar usuario por email: ${email}`)

      const userData = await identifyUserByEmail(email)

      if (userData?.success) {
        // El usuario existe, establecer cookies de sesión simuladas
        const oneYear = 365 * 24 * 60 * 60 * 1000
        const expires = new Date(Date.now() + oneYear)

        // Crear un token de desarrollo simple (NO usar en producción real)
        const devSessionToken = Buffer.from(JSON.stringify({
          email,
          user_id: userData.user_id,
          role: userData.role,
          dev: true,
          exp: Date.now() + oneYear
        })).toString('base64')

        cookies.set('sessionBodas', devSessionToken, {
          domain: host.includes('localhost') ? undefined : '.bodasdehoy.com',
          path: '/',
          expires,
          httpOnly: false,
          secure: !host.includes('localhost'),
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
        usage: 'fetch("/api/dev/refresh-session", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: "bodasdehoy.com@gmail.com"}), credentials: "include"})'
      })
    }

    const sessionCookie = await getSessionFromIdToken(idToken)

    if (sessionCookie) {
      const oneYear = 365 * 24 * 60 * 60 * 1000
      const expires = new Date(Date.now() + oneYear)

      // Establecer sessionBodas con expiración de 365 días
      cookies.set('sessionBodas', sessionCookie, {
        domain: host.includes('localhost') ? undefined : '.bodasdehoy.com',
        path: '/',
        expires,
        httpOnly: false,
        secure: !host.includes('localhost'),
        sameSite: 'lax'
      })

      // También actualizar la expiración del idToken si es necesario
      // El idToken ya está establecido, solo asegurarnos de que tenga la expiración correcta
      cookies.set('idTokenV0.1.0', idToken, {
        domain: host.includes('localhost') ? undefined : '.bodasdehoy.com',
        path: '/',
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora para idToken
        httpOnly: false,
        secure: !host.includes('localhost'),
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
        usage: 'fetch("/api/dev/refresh-session", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: "bodasdehoy.com@gmail.com"}), credentials: "include"})'
      })
    }
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal error',
      message: error?.message
    })
  }
}
