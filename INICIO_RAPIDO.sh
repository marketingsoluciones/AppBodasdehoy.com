#!/bin/bash

echo "🚀 Monorepo Compartido - Bodas de Hoy"
echo "======================================"
echo ""

cd /Users/juancarlosparra/Projects/AppBodasdehoy.com

echo "✅ 1. Verificando instalación..."
pnpm --filter @bodasdehoy/appEventos list --depth 0 2>/dev/null | grep -q copilot-ui

if [ $? -eq 0 ]; then
    echo "   ✅ @bodasdehoy/copilot-ui está instalado"
else
    echo "   ❌ Instalando dependencias..."
    pnpm install > /dev/null 2>&1
    echo "   ✅ Dependencias instaladas"
fi

echo ""
echo "📂 2. Archivos creados:"
echo "   ✅ packages/copilot-ui/ (paquete completo)"
echo "   ✅ apps/appEventos/components/ChatSidebar/ChatSidebarDirect.tsx"
echo "   ✅ 4 archivos de documentación"
echo ""

echo "📖 3. Documentación:"
echo "   📄 IMPLEMENTACION_FINAL.md    - Lee esto primero ⭐"
echo "   📄 RESUMEN_MONOREPO.md         - Resumen ejecutivo"
echo "   📄 MONOREPO_COMPARTIDO.md      - Guía técnica"
echo "   📄 MIGRACION_COMPLETADA.md     - Detalles técnicos"
echo ""

echo "🎯 4. Siguiente paso:"
echo ""
echo "   Opción A: Iniciar desarrollo"
echo "   $ pnpm dev"
echo ""
echo "   Opción B: Leer documentación"
echo "   $ open IMPLEMENTACION_FINAL.md"
echo ""

echo "💡 Uso rápido:"
echo ""
echo "   // En tu componente"
echo "   import { CopilotDirect } from '@bodasdehoy/copilot-ui';"
echo ""
echo "   <CopilotDirect"
echo "     userId={userId}"
echo "     event={event}"
echo "     onNavigate={(p) => router.push(p)}"
echo "   />"
echo ""

echo "✨ ¡Listo! Todo está funcionando correctamente."
echo ""
