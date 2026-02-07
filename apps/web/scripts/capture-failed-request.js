/**
 * Script para capturar un request fallido completo para el equipo de api-ia
 *
 * Ejecutar: node apps/web/scripts/capture-failed-request.js
 */

const fs = require('fs');

// Configuración
const API_URL = 'https://api-ia.bodasdehoy.com/webapi/chat/auto';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_ID = 'qDhAGOktSbOJzYflxb_ATv5-yqQ3'; // Firebase UID real
const DEVELOPMENT = 'bodasdehoy';
const EVENT_ID = 'test-event-123'; // Reemplazar con ID real si lo tienes
const EVENT_NAME = 'Boda Luis y Carla';

async function captureRequest() {
  console.log('='.repeat(70));
  console.log('CAPTURA DE REQUEST PARA DEBUG - api-ia.bodasdehoy.com');
  console.log('='.repeat(70));
  console.log(`Fecha: ${new Date().toISOString()}\n`);

  // Construir el payload exactamente como lo hace el frontend
  const payload = {
    messages: [
      {
        role: 'system',
        content: `Eres Copilot, el asistente personal de Bodas de Hoy. Tu rol es ayudar a los usuarios a organizar sus eventos.

## Contexto del Evento Actual
El usuario está trabajando en el evento: "${EVENT_NAME}"
ID del evento: ${EVENT_ID}

Recuerda: SIEMPRE incluye links de navegación [texto](url) cuando menciones secciones de la aplicación.`
      },
      {
        role: 'user',
        content: '¿Cuánto tengo gastado en mi presupuesto?'
      }
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 2000,
    // NO incluir model para que use auto-routing
  };

  // Headers exactos que envía el frontend
  const headers = {
    'Content-Type': 'application/json',
    'X-Development': DEVELOPMENT,
    'X-User-Id': USER_EMAIL, // También probamos con UID
    'X-Event-Id': EVENT_ID,
    'X-Request-Id': `debug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    // Authorization se omite en este test (no tenemos JWT válido)
  };

  // También incluimos metadata en el body (como hace el frontend)
  const payloadWithMetadata = {
    ...payload,
    metadata: {
      userId: USER_EMAIL,
      development: DEVELOPMENT,
      eventId: EVENT_ID,
      eventName: EVENT_NAME,
      sessionId: `test_${Date.now()}`,
    }
  };

  console.log('REQUEST COMPLETO:');
  console.log('-'.repeat(70));
  console.log(`URL: POST ${API_URL}`);
  console.log('\nHEADERS:');
  console.log(JSON.stringify(headers, null, 2));
  console.log('\nBODY:');
  console.log(JSON.stringify(payloadWithMetadata, null, 2));
  console.log('-'.repeat(70));

  try {
    console.log('\nEnviando request...\n');

    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payloadWithMetadata),
    });
    const elapsed = Date.now() - startTime;

    console.log('RESPONSE:');
    console.log('-'.repeat(70));
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Tiempo: ${elapsed}ms`);
    console.log('\nResponse Headers:');

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log(JSON.stringify(responseHeaders, null, 2));

    // Leer el body (puede ser SSE o JSON)
    const contentType = response.headers.get('content-type') || '';
    console.log(`\nContent-Type: ${contentType}`);

    if (contentType.includes('text/event-stream')) {
      console.log('\nSSE Response (primeros 5000 chars):');
      const text = await response.text();
      console.log(text.substring(0, 5000));
      if (text.length > 5000) {
        console.log(`\n... (truncado, total: ${text.length} chars)`);
      }
    } else {
      console.log('\nJSON Response:');
      try {
        const json = await response.json();
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log('Raw text:', text.substring(0, 2000));
      }
    }

    console.log('-'.repeat(70));

    // Guardar el reporte
    const report = {
      timestamp: new Date().toISOString(),
      request: {
        url: API_URL,
        method: 'POST',
        headers,
        body: payloadWithMetadata,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        elapsed_ms: elapsed,
      }
    };

    const reportPath = 'apps/web/docs/DEBUG_REQUEST_API_IA.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReporte guardado en: ${reportPath}`);

  } catch (error) {
    console.error('\nERROR DE CONEXIÓN:');
    console.error(error.message);
    console.error(error.stack);
  }

  // Segunda prueba: con Firebase UID en lugar de email
  console.log('\n' + '='.repeat(70));
  console.log('SEGUNDA PRUEBA: Usando Firebase UID como X-User-Id');
  console.log('='.repeat(70));

  const headers2 = {
    ...headers,
    'X-User-Id': USER_ID, // Usando UID de Firebase
    'X-Request-Id': `debug2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };

  const payload2 = {
    ...payloadWithMetadata,
    metadata: {
      ...payloadWithMetadata.metadata,
      userId: USER_ID, // Usando UID de Firebase
    }
  };

  console.log('\nHEADERS (con UID):');
  console.log(JSON.stringify(headers2, null, 2));
  console.log('\nmetadata.userId:', payload2.metadata.userId);

  try {
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: headers2,
      body: JSON.stringify(payload2),
    });

    console.log(`\nStatus: ${response2.status}`);

    if (response2.headers.get('content-type')?.includes('event-stream')) {
      const text = await response2.text();
      console.log('SSE Response (primeros 2000 chars):');
      console.log(text.substring(0, 2000));
    } else {
      const json = await response2.json().catch(() => null);
      if (json) console.log(JSON.stringify(json, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('FIN DE LA CAPTURA');
  console.log('='.repeat(70));
}

captureRequest();
