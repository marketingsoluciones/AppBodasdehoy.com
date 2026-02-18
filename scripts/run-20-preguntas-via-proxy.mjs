#!/usr/bin/env node
/**
 * Ejecuta las 20 preguntas a través del proxy del front (simulando usuario).
 * Flujo: script → POST /api/copilot/chat (app web) → proxy → api-ia → proveedor.
 * Así validamos: (1) código del front correcto, (2) peticiones llegan a api-ia,
 * (3) respuestas con lógica, sin errores, que aporten valor al usuario.
 *
 * Uso:
 *   node scripts/run-20-preguntas-via-proxy.mjs
 *   BASE_URL=http://localhost:8080 node scripts/run-20-preguntas-via-proxy.mjs
 *   BASE_URL=https://app-test.bodasdehoy.com node scripts/run-20-preguntas-via-proxy.mjs
 *
 * Requiere: app web (apps/web) en marcha en BASE_URL.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const DEVELOPMENT = process.env.DEVELOPMENT || 'bodasdehoy';

const PREGUNTAS_20 = [
  'Hola',
  '¿Cuántos invitados tengo?',
  '¿Cuánto llevo pagado del presupuesto?',
  'Quiero ver mis invitados',
  'Llévame al presupuesto',
  '¿Cómo se llama mi evento?',
  '¿Cuántas mesas tengo?',
  'Dime 3 consejos para organizar una boda',
  'Dame un resumen completo de mi evento',
  'Agrega a Jose Garcia y Jose Morales como invitados a mi evento',
  '¿Cuántos días faltan para mi boda?',
  '¿Cuál es la boda de Raul?',
  'Muéstrame la lista de todas las bodas',
  '¿Qué tareas tengo pendientes para mi boda?',
  'Dame ideas para el menú del banquete',
  '¿Cuánto llevo gastado en el presupuesto?',
  '¿Qué eventos tengo para el próximo año?',
  '¿Quién es mi proveedor de flores?',
  'Resume los invitados confirmados',
  '¿En qué fecha es la boda de María?',
];

const metadata = {
  development: DEVELOPMENT,
  userId: process.env.TEST_USER_EMAIL || 'test@bodasdehoy.com',
  sessionId: `test-session-${Date.now()}`,
};

function isCoherent(result) {
  if (result.httpStatus !== 200) return false;
  const txt = (result.content || '').trim();
  if (!txt) return false;
  const lower = txt.toLowerCase();
  const errores = ['error de autenticación', 'api key', 'no es válida', 'no configurada', 'servicio no disponible', 'requestid', 'trace_id', 'ia_backend'];
  if (errores.some((e) => lower.includes(e))) return false;
  return true;
}

async function sendQuestion(question, index) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${BASE_URL}/api/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Development': DEVELOPMENT,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: question }],
        stream: false,
        metadata,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));
    const content = data.choices?.[0]?.message?.content ?? data.message ?? data.error ?? '';

    return {
      index: index + 1,
      question,
      httpStatus: res.status,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      coherente: isCoherent({ httpStatus: res.status, content }),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      index: index + 1,
      question,
      httpStatus: 0,
      content: err.message || String(err),
      coherente: false,
    };
  }
}

async function main() {
  console.log('\n🧪 20 preguntas vía proxy (simulando usuario)\n');
  console.log(`   BASE_URL=${BASE_URL}`);
  console.log(`   Flujo: script → ${BASE_URL}/api/copilot/chat → api-ia → proveedor\n`);

  const results = [];
  let coherentes = 0;

  for (let i = 0; i < PREGUNTAS_20.length; i++) {
    const r = await sendQuestion(PREGUNTAS_20[i], i);
    results.push(r);
    if (r.coherente) coherentes++;
    const icon = r.coherente ? '✅' : '❌';
    const prev = (r.content || '').substring(0, 60);
    console.log(`[${r.index}/20] ${icon} HTTP ${r.httpStatus} | ${r.question.substring(0, 45)}${r.question.length > 45 ? '…' : ''}`);
    if (!r.coherente && r.content) console.log(`    → ${prev}${prev.length >= 60 ? '…' : ''}`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`📊 Coherentes (respuesta con lógica, sin error): ${coherentes}/20`);
  console.log(`   Incoherentes: ${20 - coherentes}/20`);
  console.log('─'.repeat(60));

  return { coherentes, total: 20, results };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
