# 🔧 Workarounds para Problema de Provider Groq

## 🚨 Problema Identificado

**Fecha**: 2026-02-06
**Severidad**: Media
**Estado**: Documentado, con workarounds disponibles

### Descripción

El backend Python (https://api-ia.bodasdehoy.com) está configurado para usar **Groq** como provider por defecto, pero este provider está devolviendo **respuestas vacías**.

**Error típico**:
```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "provider": "groq",
  "model": "auto"
}
```

### Comportamiento Observado

1. **El backend ignora el parámetro `provider`**
   - Al especificar `"provider": "anthropic"` o `"provider": "openai"`
   - El backend sigue usando Groq
   - La respuesta siempre indica `"provider": "groq"`

2. **Auto-routing no funciona correctamente**
   - El modo `"auto"` debería seleccionar el mejor provider
   - Actualmente falla en Groq sin hacer fallback

3. **Afecta todas las peticiones**
   - Tests automáticos fallan
   - Playground necesita pruebas manuales
   - Chat puede no responder

---

## ✅ Soluciones Temporales (Workarounds)

### 1. Usar el Playground para Tests Visuales

**Recomendado para**: Testing y validación de funcionalidad

```bash
# Abrir el script de test manual
./scripts/test-playground-manual.sh
```

**Ventajas**:
- ✅ Interface visual completa
- ✅ Selección de preguntas
- ✅ Streaming en tiempo real visible
- ✅ Análisis automático de resultados
- ✅ No depende del provider problemático para UI

**URL**: http://localhost:3210/bodasdehoy/admin/playground

**Instrucciones**:
1. Abre el Playground en tu navegador
2. Selecciona 2-3 preguntas de la lista
3. En el dropdown de Provider, prueba con diferentes opciones
4. Ejecuta los tests y observa el streaming
5. Si falla, intenta con otro provider manualmente

---

### 2. Contactar al Equipo del Backend Python

**Para**: Solución permanente del problema

**Información para compartir**:
- Endpoint problemático: `POST /webapi/chat/auto`
- Error: `EMPTY_RESPONSE` con provider Groq
- El parámetro `provider` es ignorado
- Auto-routing no hace fallback correctamente

**Posibles causas a investigar**:
- ✓ API key de Groq inválida o expirada
- ✓ Cuota de Groq excedida
- ✓ Configuración de routing incorrecta
- ✓ Problemas de conectividad con Groq API

**Endpoints para revisar en el backend**:
```bash
# Verificar configuración
curl https://api-ia.bodasdehoy.com/api/config

# Verificar providers disponibles
curl https://api-ia.bodasdehoy.com/api/providers

# Logs del backend (si tienes acceso)
# Buscar: "groq", "EMPTY_RESPONSE", "orchestrator"
```

---

### 3. Modificar Configuración Local (Temporal)

**Para**: Testing sin depender del backend Python

**Opción A: Deshabilitar Backend Python**

Edita [apps/web/.env.local](apps/web/.env.local:1):
```bash
# Deshabilitar backend Python temporalmente
USE_PYTHON_BACKEND=false
ENABLE_COPILOT_FALLBACK=true
```

Esto hará que el copilot use el sistema de fallback con API keys locales.

**Opción B: Usar Endpoint Alternativo**

Si hay otro backend disponible:
```bash
PYTHON_BACKEND_URL=https://backend-alternativo.com
```

---

### 4. Tests Alternativos Sin Depender del Chat

**Para**: Validar otras funcionalidades del sistema

```bash
# Test del iframe del chat
open http://localhost:8080/probar-chat-test.html

# Tests de la interfaz (sin IA)
npm run test:ui

# Tests de integración (sin llamadas al backend)
npm run test:integration -- --mock-backend
```

---

## 📊 Estado Actual del Sistema

### ✅ Funcionando Correctamente

- Web App (puerto 8080)
- Copilot (puerto 3210)
- Backend Python Health Check
- Playground UI (carga de preguntas)
- Navegación y rutas
- Autenticación
- Base de datos

### ⚠️ Con Limitaciones

- **Chat con IA**: No responde por problema de Groq
- **Tests automáticos**: Fallan al intentar obtener respuestas
- **Streaming**: La UI funciona pero no recibe contenido

### ❌ No Funcional

- Respuestas automáticas del chat
- Auto-routing de providers
- Tests end-to-end que requieren respuestas de IA

---

## 🔍 Debugging Adicional

### Ver Logs en Tiempo Real

```bash
# Logs del copilot
tail -f /tmp/copilot-restart.log

# Logs del navegador
# 1. Abre DevTools (F12)
# 2. Ve a Console
# 3. Busca mensajes con [Playground] o [Chat]
```

### Probar Manualmente el Backend

```bash
# Test básico
curl -X POST 'https://api-ia.bodasdehoy.com/webapi/chat/auto' \
  -H 'Content-Type: application/json' \
  -H 'X-Development: bodasdehoy' \
  -d '{
    "messages": [{"role": "user", "content": "Hola"}],
    "stream": false,
    "provider": "anthropic"
  }' | jq '.'

# Si falla, prueba con diferentes providers
# "provider": "openai"
# "provider": "groq"
# "provider": "auto"
```

### Verificar API Keys (si tienes acceso al backend)

En el servidor del backend Python, verifica:
```bash
# Variables de entorno
echo $GROQ_API_KEY
echo $ANTHROPIC_API_KEY
echo $OPENAI_API_KEY

# Logs del servicio
journalctl -u backend-python -f | grep -i "groq\|provider\|orchestrator"
```

---

## 📝 Siguientes Pasos

### Prioridad Alta
1. ✅ Documentar el problema (este archivo)
2. ✅ Crear workarounds para continuar con testing
3. 🔄 Contactar equipo del backend Python
4. ⏳ Esperar fix del backend o implementar solución local

### Prioridad Media
5. Implementar fallback automático en el frontend
6. Agregar timeout y retry logic
7. Mostrar mensajes de error más claros al usuario
8. Agregar opción para seleccionar provider manualmente en la UI

### Prioridad Baja
9. Considerar providers alternativos
10. Implementar caché de respuestas para desarrollo
11. Agregar modo "mock" para testing sin backend

---

## 📚 Referencias

- [REPORTE_ESTADO_SISTEMA.md](REPORTE_ESTADO_SISTEMA.md) - Estado completo del sistema
- [ESTADO_PLAYGROUND.md](ESTADO_PLAYGROUND.md) - Documentación del Playground
- [scripts/test-playground-manual.sh](scripts/test-playground-manual.sh) - Script de test manual
- [apps/web/pages/api/copilot/chat.ts](apps/web/pages/api/copilot/chat.ts) - Proxy del copilot

---

## 🆘 Contacto

Si el problema persiste o necesitas ayuda:

1. **Logs**: Guarda los logs completos
2. **Screenshots**: Captura pantallas del error
3. **Request/Response**: Documenta el JSON completo
4. **Trace ID**: Anota el `trace_id` del error

**Ejemplo de reporte**:
```
Trace ID: ccabe39d
Error: EMPTY_RESPONSE
Provider: groq (debería ser anthropic)
Timestamp: 2026-02-06T04:59:41.940666
```

---

**Última actualización**: 2026-02-06 06:15 AM
**Estado**: Workarounds disponibles, esperando fix del backend
