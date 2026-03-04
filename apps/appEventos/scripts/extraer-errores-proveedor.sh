#!/bin/bash

# Extraer los errores más relevantes del log de evidencia para el proveedor

echo "======================================================================="
echo "ERRORES CRÍTICOS PARA EL PROVEEDOR DEL BACKEND"
echo "======================================================================="
echo ""

echo "📁 Fuente: /tmp/evidencia-proveedor.log"
echo ""

echo "======================================================================="
echo "1. ERRORES 404 - Endpoint no encontrado"
echo "======================================================================="
grep "404.*api.*identify-user" /tmp/evidencia-proveedor.log | head -10
echo ""

echo "======================================================================="
echo "2. ERRORES 500 - Error interno del servidor"
echo "======================================================================="
grep "500.*debug-logs" /tmp/evidencia-proveedor.log | head -10
echo ""

echo "======================================================================="
echo "3. ERRORES DE CONSOLA DEL NAVEGADOR"
echo "======================================================================="
grep "❌ PAGE ERROR" /tmp/evidencia-proveedor.log | head -20
echo ""

echo "======================================================================="
echo "4. REQUESTS FALLIDOS"
echo "======================================================================="
grep "⚠️ REQUEST FAILED" /tmp/evidencia-proveedor.log | head -20
echo ""

echo "======================================================================="
echo "5. CONTENIDO DEL CHAT (SIN RESPUESTA)"
echo "======================================================================="
sed -n '/CONTENIDO DEL CHAT:/,/-------------------/p' /tmp/evidencia-proveedor.log | tail -20
echo ""

echo "======================================================================="
echo "6. REQUESTS AL BACKEND IA"
echo "======================================================================="
grep -E "(REQUEST|RESPONSE).*api-ia\.bodasdehoy\.com" /tmp/evidencia-proveedor.log | head -30
echo ""

echo "======================================================================="
echo "RESUMEN:"
echo "======================================================================="
echo "❌ El Copilot NO responde a las preguntas"
echo "❌ Error 404: /api/auth/identify-user (no encuentra endpoint)"
echo "❌ Error 500: /api/debug-logs/upload (error interno)"
echo "✅ Autenticación Firebase: OK"
echo "✅ Socket.IO: OK"
echo "✅ Frontend: OK"
echo ""
echo "🔴 BLOQUEADOR: Backend NO procesa las preguntas del usuario"
echo ""
echo "📋 Evidencia completa:"
echo "   - Log: /tmp/evidencia-proveedor.log (429 KB)"
echo "   - Screenshots: /tmp/proveedor-*.png"
echo "   - Documentación: scripts/EVIDENCIA-PARA-PROVEEDOR-BACKEND.md"
echo ""
echo "======================================================================="
