#!/bin/bash

# Script para ayudar a obtener credenciales de Firebase Admin

echo ""
echo "======================================================================="
echo "  🔑 Obtener Credenciales de Firebase Admin"
echo "======================================================================="
echo ""
echo "Para usar el sistema de tests autónomos, necesitas credenciales de"
echo "Firebase Admin SDK (Service Account)."
echo ""
echo "📋 PASOS:"
echo ""
echo "1. Abre Firebase Console:"
echo "   https://console.firebase.google.com/project/bodasdehoy-1063/settings/serviceaccounts/adminsdk"
echo ""
echo "2. En la pestaña 'Service Accounts':"
echo "   - Click en 'Generate new private key'"
echo "   - Confirma que quieres generar la key"
echo "   - Se descarga un archivo JSON"
echo ""
echo "3. Copia el contenido del archivo JSON descargado"
echo ""
echo "4. Ejecuta este comando para configurar automáticamente:"
echo ""
echo "   node scripts/configurar-env-firebase-admin.js"
echo ""
echo "======================================================================="
echo ""
echo "¿Ya tienes el archivo JSON descargado? (s/n)"
read -r response

if [[ "$response" =~ ^[Ss]$ ]]; then
    echo ""
    echo "✅ Perfecto! Ahora ejecuta:"
    echo ""
    echo "   node scripts/configurar-env-firebase-admin.js"
    echo ""
else
    echo ""
    echo "📋 Primero descarga el archivo JSON siguiendo los pasos de arriba."
    echo ""
    echo "Cuando lo tengas, ejecuta:"
    echo "   node scripts/configurar-env-firebase-admin.js"
    echo ""
fi
