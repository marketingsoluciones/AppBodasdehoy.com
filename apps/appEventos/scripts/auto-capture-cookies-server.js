#!/usr/bin/env node

/**
 * Servidor local para capturar cookies automáticamente
 * Método más rápido - visita el servidor y las cookies se copian automáticamente
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const COOKIES_FILE = path.join(__dirname, 'copilot-test-cookies.json');

const HTML_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Auto-captura de Cookies</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-top: 0; }
    .step {
      padding: 15px;
      margin: 15px 0;
      background: #f0f7ff;
      border-left: 4px solid #0066cc;
      border-radius: 4px;
    }
    .success {
      background: #d4edda;
      border-left-color: #28a745;
      color: #155724;
    }
    .error {
      background: #f8d7da;
      border-left-color: #dc3545;
      color: #721c24;
    }
    button {
      background: #0066cc;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      margin: 10px 5px 10px 0;
    }
    button:hover { background: #0052a3; }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    pre {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
    #status { font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍪 Auto-Captura de Cookies para Copilot Tests</h1>

    <div class="step">
      <h3>Paso 1: Abre app-test en otra pestaña</h3>
      <p>Abre <a href="https://app-test.bodasdehoy.com" target="_blank">app-test.bodasdehoy.com</a> y asegúrate de estar logueado.</p>
      <button onclick="window.open('https://app-test.bodasdehoy.com', '_blank')">
        🚀 Abrir app-test.bodasdehoy.com
      </button>
    </div>

    <div class="step">
      <h3>Paso 2: Ejecuta esto en la consola de app-test</h3>
      <p>En la pestaña de app-test:</p>
      <ol>
        <li>Abre DevTools (F12 o Cmd+Option+I)</li>
        <li>Ve a la pestaña "Console"</li>
        <li>Copia y pega este código:</li>
      </ol>
      <pre id="code">// Este código se enviará automáticamente al servidor local
fetch('http://localhost:${PORT}/capture', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    idToken: document.cookie.split('; ').find(c => c.startsWith('idTokenV0.1.0='))?.split('=')[1],
    session: document.cookie.split('; ').find(c => c.startsWith('sessionBodas='))?.split('=')[1]
  })
}).then(r => r.json()).then(data => {
  console.log('✅', data.message);
  alert('✅ Cookies capturadas! Cierra esta pestaña y vuelve al servidor.');
}).catch(err => console.error('❌ Error:', err));</pre>
      <button onclick="copyCode()">📋 Copiar código</button>
    </div>

    <div id="status"></div>
    <div id="result"></div>
  </div>

  <script>
    function copyCode() {
      const code = document.getElementById('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        alert('✅ Código copiado al portapapeles!\\n\\nAhora pégalo en la consola de app-test.bodasdehoy.com');
      });
    }

    // Poll para ver si las cookies fueron capturadas
    setInterval(() => {
      fetch('/status')
        .then(r => r.json())
        .then(data => {
          if (data.captured) {
            document.getElementById('status').innerHTML =
              '<div class="step success"><h3>✅ ¡Cookies capturadas exitosamente!</h3></div>';
            document.getElementById('result').innerHTML =
              '<div class="step"><h3>🎉 ¡Todo listo!</h3>' +
              '<p>Las cookies se guardaron en:</p>' +
              '<pre>${COOKIES_FILE}</pre>' +
              '<p>Ahora puedes ejecutar:</p>' +
              '<pre>node test-copilot-automated-with-cookies.js</pre>' +
              '<button onclick="window.close()">Cerrar</button></div>';
          }
        })
        .catch(() => {});
    }, 1000);
  </script>
</body>
</html>
`;

let cookiesCaptured = false;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Página principal
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_PAGE);
    return;
  }

  // Endpoint de captura
  if (req.url === '/capture' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);

        if (!data.idToken || !data.session) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing cookies' }));
          return;
        }

        const expires = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        const cookies = [
          {
            name: 'idTokenV0.1.0',
            value: data.idToken,
            domain: 'app-test.bodasdehoy.com',
            path: '/',
            expires,
            httpOnly: false,
            secure: true,
            sameSite: 'Lax'
          },
          {
            name: 'sessionBodas',
            value: data.session,
            domain: 'app-test.bodasdehoy.com',
            path: '/',
            expires,
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
          }
        ];

        fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
        cookiesCaptured = true;

        console.log('\n✅ ¡Cookies capturadas exitosamente!');
        console.log(`   Guardadas en: ${COOKIES_FILE}`);
        console.log('\n🚀 Ahora puedes ejecutar:');
        console.log('   node test-copilot-automated-with-cookies.js\n');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Cookies guardadas' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Status endpoint
  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ captured: cookiesCaptured }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('\n======================================================================');
  console.log('  🍪 SERVIDOR DE AUTO-CAPTURA DE COOKIES');
  console.log('======================================================================\n');
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
  console.log('\n📋 INSTRUCCIONES:\n');
  console.log('1. Abre http://localhost:' + PORT + ' en tu navegador');
  console.log('2. Sigue los pasos en la página');
  console.log('3. Las cookies se capturarán automáticamente\n');
  console.log('======================================================================\n');
  console.log('💡 Presiona Ctrl+C para detener el servidor\n');
});

// Abrir navegador automáticamente
const open = require('child_process').exec;
setTimeout(() => {
  const url = `http://localhost:${PORT}`;
  const cmd = process.platform === 'darwin' ? 'open' :
               process.platform === 'win32' ? 'start' : 'xdg-open';
  open(`${cmd} ${url}`);
  console.log('🌐 Abriendo navegador...\n');
}, 1000);
