/**
 * Test del endpoint /api/copilot/chat
 *
 * Este script prueba directamente el endpoint que usa CopilotIframe
 * para verificar la conexión con el Backend IA.
 *
 * Uso: node apps/web/scripts/test-backend-ia-endpoint.js
 */

const https = require('https');
const http = require('http');

const tests = [
  {
    name: 'Backend IA directo (api-ia.bodasdehoy.com/api/providers)',
    url: 'https://api-ia.bodasdehoy.com/api/providers/bodasdehoy',
    method: 'GET',
  },
  {
    name: 'Backend IA chat directo',
    url: 'https://api-ia.bodasdehoy.com/api/chat/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Development': 'bodasdehoy',
    },
    body: JSON.stringify({
      message: 'ping',
      session_id: 'test-script-' + Date.now(),
    }),
  },
  {
    name: 'Proxy local /api/copilot/chat (app-test)',
    url: 'https://app-test.bodasdehoy.com/api/copilot/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Development': 'bodasdehoy',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'ping' }],
      stream: false,
      metadata: { development: 'bodasdehoy' },
    }),
  },
  {
    name: 'Proxy local (localhost:8080)',
    url: 'http://localhost:8080/api/copilot/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Development': 'bodasdehoy',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'ping' }],
      stream: false,
      metadata: { development: 'bodasdehoy' },
    }),
  },
];

async function makeRequest(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const parsedUrl = new URL(test.url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: test.method,
      headers: test.headers || {},
      timeout: 10000,
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          duration,
          data: data.substring(0, 500),
          headers: res.headers,
        });
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        error: err.message,
        code: err.code,
        duration,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
        duration: Date.now() - startTime,
      });
    });

    if (test.body) {
      req.write(test.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST ENDPOINT BACKEND IA ===\n');
  console.log('Fecha:', new Date().toISOString());
  console.log('');

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    console.log(`URL: ${test.url}`);
    console.log(`Method: ${test.method}`);

    const result = await makeRequest(test);

    if (result.success) {
      console.log(`✅ Status: ${result.status} (${result.duration}ms)`);
      try {
        const json = JSON.parse(result.data);
        console.log('Response:', JSON.stringify(json, null, 2).substring(0, 300));
      } catch {
        console.log('Response:', result.data.substring(0, 200));
      }
    } else {
      console.log(`❌ Error: ${result.error || result.status}`);
      if (result.code) console.log(`   Code: ${result.code}`);
      console.log(`   Duration: ${result.duration}ms`);
      if (result.data) {
        console.log('   Response:', result.data.substring(0, 200));
      }
    }
  }

  console.log('\n=== FIN DE TESTS ===\n');
}

runTests();
