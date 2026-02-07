#!/usr/bin/env node
/**
 * Batería de tests reales para Copilot API
 * Prueba el flujo completo: proxy -> backend IA -> fallback
 *
 * Ejecutar: node apps/web/scripts/test-copilot-battery.js
 *
 * Requiere: dev server corriendo en localhost:3000
 */

const BASE = 'http://localhost:3000';

// Datos REALES del evento "Boda de Paco y Pico" obtenidos del test anterior
const REAL_METADATA = {
  userId: 'bodasdehoy.com@gmail.com',
  development: 'bodasdehoy',
  eventId: '695e98c1e4c78d86fe107f71',
  eventName: 'Boda de Paco y Pico',
  pageContext: {
    pageName: 'resumen-evento',
    eventName: 'Boda de Paco y Pico',
    screenData: {
      totalInvitados: 25,
      confirmados: 12,
      pendientes: 13,
      presupuestoTotal: 15000,
      pagado: 5000,
      currency: 'EUR',
      totalMesas: 5,
      totalItinerarios: 2,
      tipoEvento: 'Boda',
      fechaEvento: '2026-06-15',
    },
    eventsList: [
      { name: 'Boda de Paco y Pico', type: 'Boda', date: '2026-06-15', id: '695e98c1e4c78d86fe107f71' },
    ],
  },
};

const TESTS = [
  {
    id: 'T01',
    name: 'Saludo básico',
    message: 'Hola',
    expect: {
      hasContent: true,
      minLength: 10,
      shouldContain: [],
      shouldNotContain: ['error', 'RequestId', 'herramienta', 'get_user_events', 'ejecutar'],
    },
  },
  {
    id: 'T02',
    name: 'Invitados - usa datos del contexto',
    message: '¿Cuántos invitados tengo?',
    expect: {
      hasContent: true,
      minLength: 20,
      shouldContain: ['25', 'invitado'],
      shouldNotContain: ['ejecutar', 'get_user_events', 'get_event_guests', 'herramienta'],
    },
  },
  {
    id: 'T03',
    name: 'Presupuesto - usa datos del contexto',
    message: '¿Cuánto llevo pagado del presupuesto?',
    expect: {
      hasContent: true,
      minLength: 20,
      shouldContainAny: [['5,000', '5.000', '5000'], ['15,000', '15.000', '15000']],
      shouldNotContain: ['ejecutar', 'herramienta', 'no tengo acceso'],
    },
  },
  {
    id: 'T04',
    name: 'Navegación - link a invitados',
    message: 'Quiero ver mis invitados',
    expect: {
      hasContent: true,
      minLength: 10,
      shouldContain: ['/invitados'],
      shouldNotContain: ['error'],
    },
  },
  {
    id: 'T05',
    name: 'Navegación - link a presupuesto',
    message: 'Llévame al presupuesto',
    expect: {
      hasContent: true,
      minLength: 10,
      shouldContain: ['/presupuesto'],
      shouldNotContain: ['error'],
    },
  },
  {
    id: 'T06',
    name: 'Nombre del evento',
    message: '¿Cómo se llama mi evento?',
    expect: {
      hasContent: true,
      minLength: 10,
      shouldContain: ['Paco', 'Pico'],
      shouldNotContain: ['no tengo', 'ejecutar'],
    },
  },
  {
    id: 'T07',
    name: 'Mesas',
    message: '¿Cuántas mesas tengo?',
    expect: {
      hasContent: true,
      minLength: 10,
      shouldContain: ['5', 'mesa'],
      shouldNotContain: ['ejecutar', 'herramienta'],
    },
  },
  {
    id: 'T08',
    name: 'Sin contexto - metadata vacía',
    message: '¿Cuántos invitados tengo?',
    metadata: { userId: 'guest_test', development: 'bodasdehoy' },
    expect: {
      hasContent: true,
      minLength: 10,
      shouldContain: [],
      shouldNotContain: ['error', 'RequestId'],
    },
  },
  {
    id: 'T09',
    name: 'Streaming funciona',
    message: 'Dime 3 consejos para organizar una boda',
    stream: true,
    expect: {
      hasContent: true,
      minLength: 50,
      minChunks: 5,
      shouldContain: [],
      shouldNotContain: ['error', 'RequestId'],
    },
  },
  {
    id: 'T10',
    name: 'No hallucina funciones',
    message: 'Dame un resumen completo de mi evento',
    expect: {
      hasContent: true,
      minLength: 30,
      shouldContain: ['Paco', 'Pico'],
      shouldNotContain: ['get_user_events', 'get_event_guests', 'ejecutar', 'herramienta', 'función'],
    },
  },
  {
    id: 'T11',
    name: 'Agregar invitados via function calling',
    message: 'Agrega a Jose Garcia y Jose Morales como invitados a mi evento',
    expect: {
      hasContent: true,
      minLength: 20,
      shouldContainAny: [['Jose Garcia', 'Jose García', 'jose garcia'], ['Jose Morales', 'jose morales']],
      shouldNotContain: ['error', 'herramienta', 'ejecutar', 'función'],
    },
  },
];

// ── Helpers ──

async function sendRequest(message, metadata, stream = false) {
  const payload = {
    messages: [{ role: 'user', content: message }],
    stream,
    metadata: metadata || REAL_METADATA,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch(`${BASE}/api/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Development': (metadata || REAL_METADATA).development || 'bodasdehoy',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const headers = {
      status: res.status,
      requestId: res.headers.get('x-request-id'),
      contentType: res.headers.get('content-type'),
    };

    if (stream && res.body) {
      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let chunks = 0;
      let provider = null;
      let model = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              chunks++;
            }
          } catch {}
        }
      }

      return { headers, content: fullContent, chunks, provider, model, error: null };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.error || data.message || '';
    return {
      headers,
      content,
      provider: data.provider || null,
      model: data.model || null,
      error: data.error || null,
      chunks: 0,
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      headers: { status: 0 },
      content: '',
      provider: null,
      model: null,
      error: err.message,
      chunks: 0,
    };
  }
}

function evaluate(test, result) {
  const issues = [];
  const ex = test.expect;

  if (result.error && !result.content) {
    issues.push(`ERROR: ${result.error}`);
    return { pass: false, issues };
  }

  if (ex.hasContent && (!result.content || result.content.length === 0)) {
    issues.push('Sin contenido en respuesta');
  }

  if (ex.minLength && result.content.length < ex.minLength) {
    issues.push(`Contenido muy corto: ${result.content.length} < ${ex.minLength}`);
  }

  if (ex.minChunks && result.chunks < ex.minChunks) {
    issues.push(`Pocos chunks: ${result.chunks} < ${ex.minChunks}`);
  }

  const contentLower = result.content.toLowerCase();

  for (const term of ex.shouldContain || []) {
    if (!contentLower.includes(term.toLowerCase())) {
      issues.push(`Falta: "${term}"`);
    }
  }

  for (const group of ex.shouldContainAny || []) {
    const found = group.some(t => contentLower.includes(t.toLowerCase()));
    if (!found) {
      issues.push(`Falta alguno de: ${group.join(' | ')}`);
    }
  }

  for (const term of ex.shouldNotContain || []) {
    if (contentLower.includes(term.toLowerCase())) {
      issues.push(`No debería contener: "${term}"`);
    }
  }

  return { pass: issues.length === 0, issues };
}

// ── Main ──

async function main() {
  console.log('='.repeat(70));
  console.log('BATERÍA DE TESTS - COPILOT API (datos reales)');
  console.log(`Servidor: ${BASE}`);
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  // Verificar que el servidor está corriendo
  try {
    const health = await fetch(`${BASE}/api/copilot/chat`, { method: 'OPTIONS' }).catch(() => null);
    if (!health) {
      console.error('\n❌ El servidor no responde en', BASE);
      console.error('   Ejecuta primero: cd apps/web && npx next dev -p 3000');
      process.exit(1);
    }
  } catch {}

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`[${test.id}] ${test.name}`);
    console.log(`   Pregunta: "${test.message}"`);

    const result = await sendRequest(
      test.message,
      test.metadata || REAL_METADATA,
      test.stream || false
    );

    console.log(`   Status: ${result.headers.status}`);
    console.log(`   Provider: ${result.provider || '?'} | Model: ${result.model || '?'}`);
    console.log(`   Contenido (${result.content.length} chars): ${result.content.substring(0, 200)}`);
    if (test.stream) console.log(`   Chunks: ${result.chunks}`);

    const evaluation = evaluate(test, result);
    results.push({ ...test, result, evaluation });

    if (evaluation.pass) {
      console.log(`   ✅ PASS`);
      passed++;
    } else {
      console.log(`   ❌ FAIL:`);
      for (const issue of evaluation.issues) {
        console.log(`      - ${issue}`);
      }
      failed++;
    }
  }

  // ── Resumen ──
  console.log(`\n${'='.repeat(70)}`);
  console.log('RESUMEN');
  console.log('='.repeat(70));
  console.log(`Total: ${TESTS.length} | ✅ Pasaron: ${passed} | ❌ Fallaron: ${failed}`);
  console.log('');

  // Tabla de resultados
  console.log('ID   | Estado | Provider        | Modelo                    | Test');
  console.log('─'.repeat(80));
  for (const r of results) {
    const status = r.evaluation.pass ? '✅' : '❌';
    const provider = (r.result.provider || '?').padEnd(15);
    const model = (r.result.model || '?').padEnd(25);
    console.log(`${r.id}  | ${status}     | ${provider} | ${model} | ${r.name}`);
  }

  // Detalle de fallos
  const failures = results.filter(r => !r.evaluation.pass);
  if (failures.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('DETALLE DE FALLOS:');
    for (const f of failures) {
      console.log(`\n  [${f.id}] ${f.name}`);
      console.log(`  Pregunta: "${f.message}"`);
      console.log(`  Respuesta: "${f.result.content.substring(0, 300)}"`);
      for (const issue of f.evaluation.issues) {
        console.log(`    → ${issue}`);
      }
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
