#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM',
  authDomain: 'bodasdehoy-1063.firebaseapp.com',
  projectId: 'bodasdehoy-1063',
  databaseURL: 'https://bodasdehoy-1063-default-rtdb.firebaseio.com',
  storageBucket: 'bodasdehoy-1063.appspot.com',
  messagingSenderId: '593952495916',
  appId: '1:593952495916:web:c63cf15fd16a6796f6f489'
};

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node get-token-simple.js <email> <password>');
  process.exit(1);
}

(async () => {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    console.log('🔐 Autenticando con Firebase...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    console.log('\n✅ Token obtenido exitosamente!\n');
    console.log('════════════════════════════════════════════');
    console.log('📋 EJECUTA ESTE COMANDO:');
    console.log('════════════════════════════════════════════\n');
    console.log(`FIREBASE_TOKEN="${token}" node test-memories-api.js`);
    console.log('\n════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
