#!/usr/bin/env node
/**
 * Script para modificar AuthContext.tsx y permitir bypass en localhost
 * 
 * USO: node scripts/fix-authcontext-localhost.js [--restore]
 * 
 * --restore: Restaura el archivo original
 */

const fs = require('fs');
const path = require('path');

const AUTH_CONTEXT_PATH = './apps/appEventos/context/AuthContext.tsx';
const BACKUP_PATH = './apps/appEventos/context/AuthContext.tsx.backup';

// Línea original (línea 296)
const ORIGINAL_LINE = `const isTestEnv = window.location.hostname.includes('chat-test') || window.location.hostname.includes('app-test') || window.location.hostname.includes('test.') || window.location.hostname.includes('app-dev')`;

// Línea modificada para incluir localhost
const MODIFIED_LINE = `const isTestEnv = window.location.hostname.includes('chat-test') || window.location.hostname.includes('app-test') || window.location.hostname.includes('test.') || window.location.hostname.includes('app-dev') || window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')`;

function backupOriginal() {
    if (!fs.existsSync(BACKUP_PATH)) {
        const content = fs.readFileSync(AUTH_CONTEXT_PATH, 'utf8');
        fs.writeFileSync(BACKUP_PATH, content);
        console.log('✅ Backup creado:', BACKUP_PATH);
    }
}

function restoreOriginal() {
    if (fs.existsSync(BACKUP_PATH)) {
        const backupContent = fs.readFileSync(BACKUP_PATH, 'utf8');
        fs.writeFileSync(AUTH_CONTEXT_PATH, backupContent);
        console.log('✅ Archivo restaurado desde backup');
        
        // Opcional: eliminar backup
        fs.unlinkSync(BACKUP_PATH);
        console.log('🗑️  Backup eliminado');
    } else {
        console.log('⚠️  No hay backup para restaurar');
    }
}

function applyFix() {
    try {
        // Crear backup primero
        backupOriginal();
        
        // Leer archivo
        let content = fs.readFileSync(AUTH_CONTEXT_PATH, 'utf8');
        
        // Verificar si ya está modificado
        if (content.includes('window.location.hostname.includes(\'localhost\')')) {
            console.log('⚠️  El archivo ya está modificado para localhost');
            console.log('   Usa --restore para volver al original');
            return;
        }
        
        // Reemplazar línea
        const newContent = content.replace(ORIGINAL_LINE, MODIFIED_LINE);
        
        // Verificar que se hizo el reemplazo
        if (newContent === content) {
            console.error('❌ No se encontró la línea a modificar');
            console.error('   Buscando:', ORIGINAL_LINE.substring(0, 50) + '...');
            return;
        }
        
        // Escribir archivo modificado
        fs.writeFileSync(AUTH_CONTEXT_PATH, newContent);
        
        console.log('✅ AuthContext modificado exitosamente');
        console.log('📝 Cambio aplicado:');
        console.log('   ANTES:', ORIGINAL_LINE);
        console.log('   DESPUÉS:', MODIFIED_LINE);
        console.log('');
        console.log('🚀 Ahora el bypass funcionará en:');
        console.log('   • localhost:3220');
        console.log('   • 127.0.0.1:3220');
        console.log('   • app-test.champagne-events.com.mx (si hay VPN)');
        console.log('');
        console.log('🔧 Para probar:');
        console.log('   1. Reinicia el servidor: pnpm dev');
        console.log('   2. Usa: http://localhost:3220/api/dev/bypass?email=test-owner@champagne-events.com.mx&development=champagne-events&uid=TEST_OWNER_UID_001');
        console.log('   3. Refresca página (F5)');
        
    } catch (error) {
        console.error('❌ Error modificando archivo:', error.message);
    }
}

function showStatus() {
    try {
        const content = fs.readFileSync(AUTH_CONTEXT_PATH, 'utf8');
        const isModified = content.includes('window.location.hostname.includes(\'localhost\')');
        
        console.log('📊 ESTADO ACTUAL:');
        console.log('   Archivo:', AUTH_CONTEXT_PATH);
        console.log('   Modificado para localhost:', isModified ? '✅ SÍ' : '❌ NO');
        
        if (isModified) {
            console.log('');
            console.log('🚀 El bypass funciona en localhost');
            console.log('   Usa: http://localhost:3220/api/dev/bypass?email=test-owner@champagne-events.com.mx&development=champagne-events&uid=TEST_OWNER_UID_001');
        } else {
            console.log('');
            console.log('⚠️  El bypass NO funciona en localhost');
            console.log('   Ejecuta: node scripts/fix-authcontext-localhost.js');
        }
        
        console.log('');
        console.log('📋 Comandos disponibles:');
        console.log('   node scripts/fix-authcontext-localhost.js        # Aplicar fix');
        console.log('   node scripts/fix-authcontext-localhost.js --restore  # Restaurar original');
        console.log('   node scripts/fix-authcontext-localhost.js --status   # Ver estado');
        
    } catch (error) {
        console.error('❌ Error leyendo archivo:', error.message);
    }
}

// Procesar argumentos
const args = process.argv.slice(2);

if (args.includes('--restore')) {
    restoreOriginal();
} else if (args.includes('--status') || args.includes('-s')) {
    showStatus();
} else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Fix AuthContext para bypass en localhost

USO:
  node scripts/fix-authcontext-localhost.js [OPCIÓN]

OPCIONES:
  (sin opción)     Aplicar fix para permitir bypass en localhost
  --restore        Restaurar archivo original desde backup
  --status, -s     Ver estado actual
  --help, -h       Mostrar esta ayuda

DESCRIPCIÓN:
  Este script modifica AuthContext.tsx para que el bypass funcione
  en localhost y 127.0.0.1 (no solo en entornos test).

  Cambia la línea:
    const isTestEnv = window.location.hostname.includes('chat-test') || ...

  Por:
    const isTestEnv = window.location.hostname.includes('chat-test') || ... || window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')

  IMPORTANTE: Esto es para testing local. Después usa --restore.
    `);
} else {
    applyFix();
}