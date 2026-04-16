#!/usr/bin/env node
/**
 * Levanta web (8080) y chat (3210) en los puertos que espera el reverse proxy
 * (config/cloudflared-config.yml: app-test → 8080, chat-test → 3210).
 * Uso: node scripts/levantar-para-proxy.mjs
 * O: pnpm dev:proxy
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const web = spawn('pnpm', ['--filter', '@bodasdehoy/appEventos', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});
const chat = spawn('pnpm', ['--filter', '@bodasdehoy/chat-ia', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

function killAll() {
  web.kill('SIGTERM');
  chat.kill('SIGTERM');
}
process.on('SIGINT', killAll);
process.on('SIGTERM', killAll);

web.on('error', (e) => { console.error('web:', e); killAll(); });
chat.on('error', (e) => { console.error('chat:', e); killAll(); });
web.on('exit', (code) => { if (code !== 0 && code !== null) killAll(); });
chat.on('exit', (code) => { if (code !== 0 && code !== null) killAll(); });

console.log('Web (app-test) → http://127.0.0.1:8080');
console.log('Chat (chat-test) → http://127.0.0.1:3210');
console.log('Reverse proxy (túnel) apunta a estos puertos. Ctrl+C para parar.\n');
