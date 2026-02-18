#!/usr/bin/env node
/**
 * Ejecuta 20 preguntas fijas contra POST /webapi/chat/auto (api-ia)
 * y genera: resultado por pregunta + resumen coherente vs incoherente + JSON.
 *
 * Uso: node scripts/run-20-preguntas-api-ia.mjs [--json] [--output resultado.json]
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.DEVELOPMENT || 'bodasdehoy';
const FIREBASE_JWT = process.env.FIREBASE_JWT || '';

// 20 preguntas fijas (mock + test-preguntas + variadas)
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

function extraerRespuesta(data) {
  if (!data || typeof data !== 'object') return '';
  const text = data.response ?? data.message ?? data.content ?? '';
  if (typeof text === 'string') return text;
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
  return String(text);
}

/**
 * Coherente = HTTP 200 y respuesta que no es mensaje de error del backend.
 * Incoherente = 503 (o otro error) o texto de error / vacío.
 */
function clasificar(resultado) {
  if (resultado.httpStatus !== 200) return 'incoherente';
  const txt = (resultado.responseText || '').trim();
  if (!txt) return 'incoherente';
  const errores = [
    'error de autenticación',
    'api key',
    'no es válida',
    'no configurada',
    'servicio no disponible',
    'no está disponible',
    'requestid',
    'trace_id',
    'ia_backend',
  ];
  const lower = txt.toLowerCase();
  if (errores.some((e) => lower.includes(e))) return 'incoherente';
  return 'coherente';
}

async function main() {
  const outputJson = process.argv.includes('--json');
  const outIdx = process.argv.indexOf('--output');
  const outputFile = outIdx >= 0 ? process.argv[outIdx + 1] : null;

  console.log(`\n🧪 Ejecutando 20 preguntas contra ${BACKEND_URL}/webapi/chat/auto\n`);

  const resultados = [];
  let coherentes = 0;
  let incoherentes = 0;

  for (let i = 0; i < PREGUNTAS_20.length; i++) {
    const pregunta = PREGUNTAS_20[i];
    const preguntaCorta = pregunta.length > 50 ? pregunta.substring(0, 50) + '…' : pregunta;

    const resultado = {
      index: i + 1,
      question: pregunta,
      httpStatus: null,
      responseText: null,
      error: null,
      coherente: null,
      elapsedMs: null,
    };

    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const headers = {
        'Content-Type': 'application/json',
        'X-Development': DEVELOPMENT,
      };
      if (FIREBASE_JWT) headers['Authorization'] = `Bearer ${FIREBASE_JWT}`;

      const response = await fetch(`${BACKEND_URL}/webapi/chat/auto`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: pregunta }],
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      resultado.elapsedMs = Date.now() - start;
      resultado.httpStatus = response.status;

      const data = await response.json().catch(() => ({}));
      resultado.responseText = extraerRespuesta(data);
      if (data?.error) resultado.error = data.error;
      if (data?.message && !resultado.responseText) resultado.responseText = data.message;

      resultado.coherente = clasificar(resultado) === 'coherente';
      if (resultado.coherente) coherentes++;
      else incoherentes++;

      const icon = resultado.coherente ? '✅' : '❌';
      console.log(`[${i + 1}/20] ${icon} HTTP ${resultado.httpStatus} (${resultado.elapsedMs}ms) ${preguntaCorta}`);
      if (!resultado.coherente && resultado.responseText) {
        const prev = (resultado.responseText || '').substring(0, 80);
        console.log(`    → ${prev}${prev.length >= 80 ? '…' : ''}`);
      }
    } catch (err) {
      resultado.error = err.message || String(err);
      resultado.coherente = false;
      incoherentes++;
      console.log(`[${i + 1}/20] ❌ Error: ${resultado.error} | ${preguntaCorta}`);
    }

    resultados.push(resultado);
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`📊 Resumen: coherentes ${coherentes} / 20 — incoherentes ${incoherentes} / 20`);
  console.log('─'.repeat(60));

  const salida = {
    fecha: new Date().toISOString(),
    backendUrl: BACKEND_URL,
    development: DEVELOPMENT,
    total: 20,
    coherentes,
    incoherentes,
    resultados,
  };

  if (outputJson || outputFile) {
    const fs = await import('fs/promises');
    const path = outputFile || `resultados-20-preguntas-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(path, JSON.stringify(salida, null, 2), 'utf-8');
    console.log(`\n📁 JSON guardado: ${path}`);
  }

  return salida;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
