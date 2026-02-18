#!/usr/bin/env bash
# Verificación rápida: subdominios y puertos del repo (app-test = web, chat-test = Copilot)
# Uso: ./scripts/verificar-subdominios.sh

set -e
echo "=== Verificación subdominios (repositorio) ==="
echo ""

# 1. /etc/hosts (solo informativo en macOS/Linux)
echo "1. /etc/hosts (local):"
if grep -q "app-test.bodasdehoy.com" /etc/hosts 2>/dev/null; then
  echo "   ✅ app-test.bodasdehoy.com está en /etc/hosts"
else
  echo "   ⚠️  app-test.bodasdehoy.com NO está en /etc/hosts"
  echo "      Añade: echo '127.0.0.1 app-test.bodasdehoy.com' | sudo tee -a /etc/hosts"
fi
if grep -q "chat-test.bodasdehoy.com" /etc/hosts 2>/dev/null; then
  echo "   ✅ chat-test.bodasdehoy.com está en /etc/hosts"
else
  echo "   ⚠️  chat-test.bodasdehoy.com NO está en /etc/hosts"
  echo "      Añade: echo '127.0.0.1 chat-test.bodasdehoy.com' | sudo tee -a /etc/hosts"
fi
echo ""

# 2. Puertos locales (web 8080, copilot 3210)
echo "2. Procesos en puertos (esta máquina):"
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:8080 2>/dev/null | grep -q "200\|301\|302\|304"; then
  echo "   ✅ Puerto 8080 (web dev) responde"
else
  echo "   ❌ Puerto 8080 no responde → levanta: cd apps/web && npm run dev:local"
fi
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:3210 2>/dev/null | grep -q "200\|301\|302\|304"; then
  echo "   ✅ Puerto 3210 (Copilot) responde"
else
  echo "   ❌ Puerto 3210 no responde → levanta: cd apps/copilot && pnpm dev"
fi
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:3000 2>/dev/null | grep -q "200\|301\|302\|304"; then
  echo "   ✅ Puerto 3000 (web prod) responde"
else
  echo "   ⚪ Puerto 3000 no responde (solo si usas start.sh/PM2)"
fi
echo ""

# 3. URLs con nombre de host (si /etc/hosts está)
echo "3. URLs por subdominio (requiere /etc/hosts y procesos arriba):"
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://app-test.bodasdehoy.com:8080 2>/dev/null | grep -q "200\|301\|302\|304"; then
  echo "   ✅ http://app-test.bodasdehoy.com:8080"
else
  echo "   ❌ http://app-test.bodasdehoy.com:8080 (revisa /etc/hosts y que web esté en 8080)"
fi
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://chat-test.bodasdehoy.com:3210 2>/dev/null | grep -q "200\|301\|302\|304"; then
  echo "   ✅ http://chat-test.bodasdehoy.com:3210"
else
  echo "   ❌ http://chat-test.bodasdehoy.com:3210 (revisa /etc/hosts y que Copilot esté en 3210)"
fi
echo ""
echo "=== Siguiente: abrir app-test:8080, hacer login, abrir Copilot y lanzar preguntas ==="
