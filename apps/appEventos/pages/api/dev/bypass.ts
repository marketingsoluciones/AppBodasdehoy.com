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
  // Solo permitir en desarrollo o subdominios de test
  const host = req.headers.host || ''
  const isDevOrTest = host.includes('localhost') || host.includes('chat-test') || host.includes('app-test') || host.includes('test')

  if (!isDevOrTest && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is only available in development/test environments' })
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
    // Establecer flags de bypass
    sessionStorage.setItem('dev_bypass', 'true');
    sessionStorage.setItem('dev_bypass_email', '${email}');
    const uid = new URLSearchParams(window.location.search).get('uid');
    if (uid) sessionStorage.setItem('dev_bypass_uid', uid);
    
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
