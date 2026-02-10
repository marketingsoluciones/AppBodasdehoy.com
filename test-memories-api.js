#!/usr/bin/env node

/**
 * Script de prueba rápida para Memories API
 * Valida los 8 endpoints críticos (P0 + P1)
 */

const BACKEND_URL = 'https://api-ia.bodasdehoy.com';
const USER_ID = 'test@bodasdehoy.com';
const DEVELOPMENT = 'bodasdehoy';

// Firebase token (obtener desde la consola del navegador)
// Para obtenerlo: firebase.auth().currentUser.getIdToken().then(console.log)
const FIREBASE_TOKEN = process.env.FIREBASE_TOKEN || '';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const results = {
  passed: 0,
  failed: 0,
  times: [],
};

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = new URL(endpoint, BACKEND_URL);
  url.searchParams.append('user_id', USER_ID);
  url.searchParams.append('development', DEVELOPMENT);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Development': DEVELOPMENT,
    },
  };

  // Agregar token de Firebase si está disponible
  if (FIREBASE_TOKEN) {
    options.headers['Authorization'] = `Bearer ${FIREBASE_TOKEN}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const start = Date.now();
  try {
    const response = await fetch(url.toString(), options);
    const duration = Date.now() - start;
    const data = await response.json();

    results.times.push(duration);

    if (response.ok && data.success !== false) {
      results.passed++;
      console.log(`${colors.green}✓${colors.reset} ${method} ${endpoint} - ${duration}ms`);
      return { ok: true, data, duration };
    } else {
      results.failed++;
      const errorMsg = data.error || data.message || response.statusText || 'Unknown error';
      console.log(`${colors.red}✗${colors.reset} ${method} ${endpoint} - ${response.status} - ${errorMsg} - ${duration}ms`);
      return { ok: false, data, duration, status: response.status };
    }
  } catch (error) {
    const duration = Date.now() - start;
    results.failed++;
    console.log(`${colors.red}✗${colors.reset} ${method} ${endpoint} - Error: ${error.message}`);
    return { ok: false, error: error.message, duration };
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}===========================================`);
  console.log(`  Validación Memories API`);
  console.log(`  Backend: ${BACKEND_URL}`);
  console.log(`===========================================${colors.reset}\n`);

  if (!FIREBASE_TOKEN) {
    console.log(`${colors.yellow}⚠ Advertencia: No hay token de Firebase${colors.reset}`);
    console.log(`${colors.yellow}  Los endpoints POST/PUT/DELETE pueden fallar${colors.reset}`);
    console.log(`${colors.yellow}  Para obtener token: FIREBASE_TOKEN=xxx node test-memories-api.js${colors.reset}\n`);
  }

  console.log(`${colors.blue}[P0] Endpoints Críticos${colors.reset}\n`);

  // P0-1: Listar álbums
  await makeRequest('/api/memories/albums');

  // P0-2: Detalle de álbum (usar un ID de prueba)
  // Nota: Este endpoint puede fallar si no existe el álbum
  console.log(`${colors.yellow}ℹ ${colors.reset}Nota: Detalle de álbum omitido (requiere ID real)\n`);

  // P0-3: Media del álbum (omitido por la misma razón)
  console.log(`${colors.yellow}ℹ ${colors.reset}Nota: Media de álbum omitido (requiere ID real)\n`);

  // P0-4: Miembros del álbum (omitido por la misma razón)
  console.log(`${colors.yellow}ℹ ${colors.reset}Nota: Miembros de álbum omitido (requiere ID real)\n`);

  console.log(`${colors.blue}[P1] Endpoints Altos${colors.reset}\n`);

  // P1-1: Crear álbum
  const createResult = await makeRequest('/api/memories/albums', 'POST', {
    name: 'Test Album - Validación API',
    description: 'Álbum de prueba creado por script de validación',
    eventType: 'wedding',
    eventDate: '2026-06-15',
  });

  let albumId = null;
  if (createResult.ok && createResult.data && createResult.data.album) {
    albumId = createResult.data.album._id || createResult.data.album.id;
    console.log(`${colors.cyan}→${colors.reset} Álbum creado con ID: ${albumId}\n`);
  }

  // Si tenemos un ID, probar endpoints que requieren ID
  if (albumId) {
    // P0-2: Detalle del álbum recién creado
    await makeRequest(`/api/memories/albums/${albumId}`);

    // P0-3: Media del álbum
    await makeRequest(`/api/memories/albums/${albumId}/media`);

    // P0-4: Miembros del álbum
    await makeRequest(`/api/memories/albums/${albumId}/members`);

    // P1-2: Actualizar álbum
    await makeRequest(`/api/memories/albums/${albumId}`, 'PUT', {
      name: 'Test Album - Actualizado',
      description: 'Descripción actualizada',
    });

    // P1-3: Invitar miembro (puede fallar si ya existe)
    await makeRequest(`/api/memories/albums/${albumId}/members`, 'POST', {
      email: 'test-invite@example.com',
      role: 'viewer',
    });

    // P1-4: Generar link compartido
    await makeRequest(`/api/memories/albums/${albumId}/share-link`, 'POST', {
      permissions: 'view',
      expiresInDays: 30,
    });
  }

  // Resultados finales
  console.log(`\n${colors.cyan}===========================================`);
  console.log(`  Resultados`);
  console.log(`===========================================${colors.reset}`);
  console.log(`${colors.green}✓ Exitosos:${colors.reset} ${results.passed}`);
  console.log(`${colors.red}✗ Fallidos:${colors.reset} ${results.failed}`);

  if (results.times.length > 0) {
    const avg = (results.times.reduce((a, b) => a + b, 0) / results.times.length).toFixed(1);
    const min = Math.min(...results.times);
    const max = Math.max(...results.times);

    console.log(`\n${colors.cyan}Performance:${colors.reset}`);
    console.log(`  Promedio: ${avg}ms`);
    console.log(`  Más rápido: ${min}ms`);
    console.log(`  Más lento: ${max}ms`);

    const targetMet = avg < 500;
    if (targetMet) {
      console.log(`\n${colors.green}✓ Performance objetivo alcanzado (<500ms)${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠ Performance por encima del objetivo (500ms)${colors.reset}`);
    }
  }

  console.log(`\n${colors.cyan}===========================================\n${colors.reset}`);

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Ejecutar pruebas
runTests().catch((error) => {
  console.error(`${colors.red}Error fatal:${colors.reset}`, error);
  process.exit(1);
});
