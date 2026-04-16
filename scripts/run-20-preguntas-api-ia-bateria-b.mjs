#!/usr/bin/env node
/**
 * Batería B: 20 preguntas distintas a la batería A.
 * Uso: node scripts/run-20-preguntas-api-ia-bateria-b.mjs [--json] [--output resultado-b.json]
 */
const BACKEND_URL = process.env.BACKEND_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.DEVELOPMENT || 'bodasdehoy';
const FIREBASE_JWT = process.env.FIREBASE_JWT || '';

const PREGUNTAS_20 = [
  'Buenas tardes',
  '¿Cuál es el menú de mi banquete?',
  'Añade una tarea: contratar fotógrafo',
  '¿Qué proveedores tengo contratados?',
  'Dame el detalle del presupuesto por categoría',
  '¿Cuántos invitados han confirmado asistencia?',
  'Cambia la fecha del evento al 15 de junio',
  '¿Dónde es la ceremonia?',
  'Lista los invitados que faltan por confirmar',
  'Sugiere flores de temporada para el centro de mesa',
  '¿Cuál es mi lista de regalos?',
  'Envíame un recordatorio para la prueba de vestido',
  '¿Quién es el invitado número 25?',
  'Compara precios de salones en la zona',
  'Resumen de pagos pendientes',
  '¿A qué hora empieza el cóctel?',
  'Crea una mesa llamada Familia García',
  '¿Qué música suena en el primer baile?',
  'Ayúdame a redactar las invitaciones',
  '¿Cuánto me queda por pagar al catering?',
];

function extraerRespuesta(data) {
  if (!data || typeof data !== 'object') return '';
  const text = data.response ?? data.message ?? data.content ?? '';
  if (typeof text === 'string') return text;
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
  return String(text);
}

function clasificar(resultado) {
  if (resultado.httpStatus !== 200) return 'incoherente';
  const txt = (resultado.responseText || '').trim();
  if (!txt) return 'incoherente';
  const errores = ['error de autenticación', 'api key', 'no es válida', 'no configurada', 'servicio no disponible', 'no está disponible', 'requestid', 'trace_id', 'ia_backend'];
  if (errores.some((e) => txt.toLowerCase().includes(e))) return 'incoherente';
  return 'coherente';
}

async function main() {
  const outputJson = process.argv.includes('--json');
  const outIdx = process.argv.indexOf('--output');
  const outputFile = outIdx >= 0 ? process.argv[outIdx + 1] : null;
  console.log('\n🧪 Batería B: 20 preguntas contra ' + BACKEND_URL + '/webapi/chat/auto\n');
  const resultados = [];
  let coherentes = 0, incoherentes = 0;
  for (let i = 0; i < PREGUNTAS_20.length; i++) {
    const pregunta = PREGUNTAS_20[i];
    const preguntaCorta = pregunta.length > 50 ? pregunta.substring(0, 50) + '…' : pregunta;
    const resultado = { index: i + 1, question: pregunta, httpStatus: null, responseText: null, error: null, coherente: null, elapsedMs: null };
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const headers = { 'Content-Type': 'application/json', 'X-Development': DEVELOPMENT };
      if (FIREBASE_JWT) headers['Authorization'] = 'Bearer ' + FIREBASE_JWT;
      const response = await fetch(BACKEND_URL + '/webapi/chat/auto', {
        method: 'POST', headers,
        body: JSON.stringify({ messages: [{ role: 'user', content: pregunta }], stream: false }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      resultado.elapsedMs = Date.now() - start;
      resultado.httpStatus = response.status;
      const data = await response.json().catch(() => ({}));
      resultado.responseText = extraerRespuesta(data);
      if (data && data.error) resultado.error = data.error;
      if (data && data.message && !resultado.responseText) resultado.responseText = data.message;
      resultado.coherente = clasificar(resultado) === 'coherente';
      if (resultado.coherente) coherentes++; else incoherentes++;
      console.log('[' + (i + 1) + '/20] ' + (resultado.coherente ? '✅' : '❌') + ' HTTP ' + resultado.httpStatus + ' (' + resultado.elapsedMs + 'ms) ' + preguntaCorta);
    } catch (err) {
      resultado.error = err.message || String(err);
      resultado.coherente = false;
      incoherentes++;
      console.log('[' + (i + 1) + '/20] ❌ Error: ' + resultado.error + ' | ' + preguntaCorta);
    }
    resultados.push(resultado);
  }
  console.log('\n' + '─'.repeat(60));
  console.log('📊 Resumen Batería B: coherentes ' + coherentes + ' / 20 — incoherentes ' + incoherentes + ' / 20');
  console.log('─'.repeat(60));
  const salida = { bateria: 'B', fecha: new Date().toISOString(), backendUrl: BACKEND_URL, development: DEVELOPMENT, total: 20, coherentes, incoherentes, resultados };
  if (outputJson || outputFile) {
    const fs = await import('fs/promises');
    const path = outputFile || 'resultados-20-preguntas-bateria-b-' + new Date().toISOString().split('T')[0] + '.json';
    await fs.writeFile(path, JSON.stringify(salida, null, 2), 'utf-8');
    console.log('\n📁 JSON guardado: ' + path);
  }
  return salida;
}
main().catch((e) => { console.error(e); process.exit(1); });
