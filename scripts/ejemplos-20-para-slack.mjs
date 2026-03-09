#!/usr/bin/env node
/** Ejecuta las 20 preguntas en paralelo, captura trace_id y error_code, y escribe mensaje para Slack. */
const BASE = 'https://api-ia.bodasdehoy.com';
const PREGUNTAS = [
  'Hola', '¿Cuántos invitados tengo?', '¿Cuánto llevo pagado del presupuesto?', 'Quiero ver mis invitados', 'Llévame al presupuesto',
  '¿Cómo se llama mi evento?', '¿Cuántas mesas tengo?', 'Dime 3 consejos para organizar una boda', 'Dame un resumen completo de mi evento', 'Agrega a Jose Garcia y Jose Morales como invitados a mi evento',
  '¿Cuántos días faltan para mi boda?', '¿Cuál es la boda de Raul?', 'Muéstrame la lista de todas las bodas', '¿Qué tareas tengo pendientes para mi boda?', 'Dame ideas para el menú del banquete',
  '¿Cuánto llevo gastado en el presupuesto?', '¿Qué eventos tengo para el próximo año?', '¿Quién es mi proveedor de flores?', 'Resume los invitados confirmados', '¿En qué fecha es la boda de María?',
];

async function fetchOne(i, question) {
  const res = await fetch(`${BASE}/webapi/chat/auto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Development': 'bodasdehoy' },
    body: JSON.stringify({ messages: [{ role: 'user', content: question }], stream: false }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    index: i + 1,
    question,
    status: res.status,
    error_code: data.error_code || (data.error && data.error.includes('autenticación') ? 'AUTH_ERROR' : 'EMPTY_RESPONSE'),
    trace_id: data.trace_id || '-',
    error: (data.error || '').slice(0, 80),
  };
}

async function main() {
  const results = await Promise.all(PREGUNTAS.map((q, i) => fetchOne(i, q)));
  const lines = ['*Todos los ejemplos (20) – request + response + trace_id para api-ia*', ''];
  for (const r of results) {
    const tipo = r.error_code === 'AUTH_ERROR' ? 'AUTH_ERROR' : 'EMPTY_RESPONSE';
    lines.push(`*${r.index}.* Request: POST ${BASE}/webapi/chat/auto | Headers: Content-Type application/json, X-Development bodasdehoy | Body: {"messages":[{"role":"user","content":"${r.question.replace(/"/g, '\\"')}"}],"stream":false}`);
    lines.push(`Response: HTTP ${r.status} | error_code: ${r.error_code} | trace_id: ${r.trace_id} | tipo: ${tipo}`);
    lines.push('');
  }
  const msg = lines.join('\n');
  const { writeFileSync } = await import('fs');
  writeFileSync('scripts/slack-todos-ejemplos-20.txt', msg, 'utf8');
  console.log('Escrito scripts/slack-todos-ejemplos-20.txt');
}

main().catch((e) => { console.error(e); process.exit(1); });
