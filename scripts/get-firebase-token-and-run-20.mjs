#!/usr/bin/env node
/**
 * Obtiene un idToken de Firebase (email/password) y ejecuta las 20 preguntas
 * con ese usuario (Authorization: Bearer <idToken>).
 *
 * Uso (las credenciales NUNCA se guardan en el repo; solo por env):
 *   TEST_USER_EMAIL=bodasdehoy.com@gmail.com TEST_USER_PASSWORD='tu_clave' node scripts/get-firebase-token-and-run-20.mjs
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... node scripts/get-firebase-token-and-run-20.mjs --json --output docs/resultados-20-preguntas-api-ia.json
 *
 * Requiere: TEST_USER_EMAIL y TEST_USER_PASSWORD en el entorno.
 * Firebase: proyecto bodasdehoy (apiKey en apps/web/firebase.js).
 */

import { spawn } from 'child_process';

const FIREBASE_API_KEY = 'AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM'; // bodasdehoy web key (pública en el cliente)
const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

async function getFirebaseToken(email, password) {
  const res = await fetch(SIGN_IN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Firebase auth ${res.status}`);
  }
  const data = await res.json();
  return data.idToken;
}

async function main() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.error('Uso: TEST_USER_EMAIL=... TEST_USER_PASSWORD=... node scripts/get-firebase-token-and-run-20.mjs [--json] [--output file.json]');
    console.error('Las credenciales solo se leen del entorno; no las guardes en el repo.');
    process.exit(1);
  }

  console.log('Obteniendo token de Firebase para', email, '...');
  let token;
  try {
    token = await getFirebaseToken(email, password);
    console.log('Token obtenido. Ejecutando 20 preguntas con Authorization: Bearer <token> ...\n');
  } catch (e) {
    console.error('Error al obtener token:', e.message);
    process.exit(1);
  }

  const args = process.argv.slice(2);

  const child = spawn(
    process.execPath,
    ['scripts/run-20-preguntas-api-ia.mjs', ...args],
    {
      cwd: process.cwd(),
      env: { ...process.env, FIREBASE_JWT: token },
      stdio: 'inherit',
    }
  );
  child.on('close', (code) => process.exit(code ?? 0));
}

main();
