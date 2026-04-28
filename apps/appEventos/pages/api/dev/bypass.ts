/**
 * API Endpoint para activar el bypass de desarrollo
 * 
 * Uso:
 * - GET /api/dev/bypass?email=jcc@bodasdehoy.com
 * - O simplemente GET /api/dev/bypass (usa email por defecto)
 * 
 * Esto establece sessionStorage y redirige a la página principal
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Bloquear en producción siempre
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' })
  }

  // Solo permitir en localhost (desarrollo local)
  const host = req.headers.host || ''
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  if (!isLocalhost) {
    return res.status(403).json({ error: 'Bypass only available on localhost' })
  }

  // Requiere secret para evitar uso accidental
  const secret = req.query.secret || req.headers['x-dev-secret']
  if (secret !== process.env.DEV_BYPASS_SECRET && !process.env.DEV_BYPASS_SECRET) {
    // Si no hay DEV_BYPASS_SECRET configurado, permitir solo en localhost (ya validado arriba)
  } else if (secret !== process.env.DEV_BYPASS_SECRET) {
    return res.status(403).json({ error: 'Invalid secret' })
  }

  // Obtener email del query string o usar el por defecto
  const email = (req.query.email as string) || 'jcc@bodasdehoy.com'

  // Retornar HTML que establece sessionStorage y redirige
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Activating Dev Bypass...</title>
  <meta charset="utf-8">
</head>
<body>
  <div style="font-family: system-ui; padding: 40px; text-align: center;">
    <h1>🔓 Activando Bypass de Desarrollo</h1>
    <p>Email: <strong>${email}</strong></p>
    <p>Redirigiendo...</p>
  </div>
  <script>
    // Establecer flags de bypass (localStorage para que sobreviva al cerrar pestaña)
    localStorage.setItem('dev_bypass', 'true');
    localStorage.setItem('dev_bypass_email', '${email}');
    const uid = new URLSearchParams(window.location.search).get('uid');
    if (uid) localStorage.setItem('dev_bypass_uid', uid);
    
    console.log('[Dev Bypass] ✅ Bypass activado para:', '${email}');
    console.log('[Dev Bypass] Redirigiendo a la página principal...');
    
    // Redirigir a la página principal
    const queryD = new URLSearchParams(window.location.search).get('d');
    const redirectPath = queryD || '/';
    window.location.href = redirectPath;
  </script>
</body>
</html>
  `

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
