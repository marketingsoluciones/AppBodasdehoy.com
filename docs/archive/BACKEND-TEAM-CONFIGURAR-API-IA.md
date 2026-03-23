# 🔴 ACCIÓN REQUERIDA: Configurar Credenciales IA en api-ia.bodasdehoy.com

**Fecha**: 2026-02-11
**Prioridad**: 🔴 **CRÍTICA**
**Componente Afectado**: Copilot (Chat IA)
**Responsable**: Backend Team

---

## 📋 Resumen Ejecutivo

El backend de IA (`api-ia.bodasdehoy.com`) está **operativo** pero le falta la configuración de **credenciales de Anthropic** para el developer `bodasdehoy`.

Esto causa que el Copilot funcione con **fallback limitado** (solo chat básico, sin herramientas para agregar invitados, gestionar presupuesto, etc.).

---

## 🎯 Acción Requerida

Configurar en el sistema whitelabel de `api-ia.bodasdehoy.com`:

```json
{
  "development": "bodasdehoy",
  "aiProvider": "anthropic",
  "aiModel": "claude-3-5-sonnet-20241022",
  "aiApiKey": "sk-ant-api03-..."  ← PROPORCIONAR API KEY DE ANTHROPIC
}
```

---

## ❌ Error Actual

Cuando el frontend intenta usar api-ia, recibe este error:

```json
{
  "detail": "API key de anthropic no configurada para este developer"
}
```

**Test que falla**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022"}'
```

**Resultado actual**:
```json
{
  "detail": "API key de anthropic no configurada para este developer"
}
```

**Resultado esperado (después del fix)**:
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "¡Hola! ¿En qué puedo ayudarte hoy?"
    }
  }]
}
```

---

## ✅ Verificación Post-Configuración

Una vez configurada la API key, ejecutar estos tests:

### Test 1: Chat básico funciona
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"Hola, esto es una prueba"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": false
  }' | jq '.'
```

**Resultado esperado**: Respuesta válida de Claude (no error de API key)

---

### Test 2: Streaming funciona
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"Cuenta del 1 al 5"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": true
  }'
```

**Resultado esperado**: Stream SSE con eventos `data: {...}` y `data: [DONE]`

---

### Test 3: Copilot end-to-end

1. Ir a http://localhost:3210 (Copilot)
2. Iniciar sesión con usuario de prueba
3. Enviar mensaje: "Hola, ¿cuántos eventos tengo?"
4. Verificar que Claude responde (no error de backend)

**Resultado esperado**: Respuesta inteligente de Claude con contexto del usuario

---

## 🔄 Alternativas (si no hay API key de Anthropic)

### Opción A: Usar OpenAI en lugar de Anthropic

```json
{
  "development": "bodasdehoy",
  "aiProvider": "openai",
  "aiModel": "gpt-4o",
  "aiApiKey": "sk-..."  ← API KEY DE OPENAI
}
```

### Opción B: Actualizar supportKey para API2

Si la configuración debe venir desde API2 (`getWhiteLabelConfig`), el `supportKey` actual parece inválido:

**supportKey actual** (en código frontend):
```typescript
'bodasdehoy': 'SK-bodasdehoy-a71f5b3c'
```

**Error recibido**:
```json
{
  "errors": [{
    "message": "Usuario no autenticado o supportKey inválido"
  }]
}
```

**Acción**: Generar nuevo `supportKey` válido para `bodasdehoy` en API2.

---

## 📊 Impacto Actual

### ✅ Funciona (con limitaciones)
- ✅ Login de usuarios
- ✅ Carga de eventos
- ✅ Menú de navegación
- ✅ Chat básico del Copilot (fallback a OpenAI)

### ❌ NO Funciona (sin credenciales IA)
- ❌ Copilot: Agregar invitados vía chat
- ❌ Copilot: Consultar presupuesto vía chat
- ❌ Copilot: Gestionar mesas vía chat
- ❌ Copilot: Crear tareas de itinerario
- ❌ Copilot: Generar reportes/exportar
- ❌ Copilot: Generar códigos QR
- ❌ Copilot: 30+ herramientas disponibles

**Estado actual del Copilot**:
```
Usuario: "Agrega estos 5 invitados: Juan, María, Pedro, Ana, Luis"
         ↓
Copilot: "Para agregar invitados, ve a [Ver invitados](/invitados)" ❌
         (Solo puede dar texto, NO puede ejecutar la acción)
```

**Estado esperado** (con credenciales configuradas):
```
Usuario: "Agrega estos 5 invitados: Juan, María, Pedro, Ana, Luis"
         ↓
Copilot: "✅ He agregado los 5 invitados a tu evento" ✅
         (Ejecuta la función y realmente los agrega)
```

---

## 🏗️ Arquitectura Actual

```
Frontend (Next.js)
    ↓
/api/copilot/chat.ts (API route)
    ↓
Paso 1: api-ia.bodasdehoy.com ← ❌ FALLA (sin credenciales)
    ↓
Paso 2: Fallback OpenAI directo ← ✅ FUNCIONA (limitado, sin herramientas)
```

**Después del fix**:
```
Frontend (Next.js)
    ↓
/api/copilot/chat.ts (API route)
    ↓
Paso 1: api-ia.bodasdehoy.com ← ✅ FUNCIONA (con credenciales)
    ↓
Copilot COMPLETO con 30+ herramientas ✨
```

---

## 📄 Documentación de Referencia

- **Diagnóstico completo**: `apps/web/DIAGNOSTICO-API-IA-COPILOT.md`
- **Sistema de fallback**: `apps/web/SISTEMA-FALLBACK-COPILOT.md`
- **Solución eventos**: `apps/web/SOLUCION-EVENTOS-NO-CARGAN.md`
- **Estado actual**: `apps/web/ESTADO-ACTUAL-Y-PRUEBAS.md`

---

## 🔍 Estado de Verificación Actual

**Última verificación**: 2026-02-11 11:56:13 CET

```
Total de tests: 11
✅ Tests pasados: 10
❌ Tests fallidos: 1

Único test fallido:
  ❌ API-IA credenciales de Anthropic no configuradas
```

**Detalles de verificación**:
- ✅ Next.js corriendo en puerto 8080
- ✅ Copilot corriendo en puerto 3210
- ✅ API Eventos (apiapp.bodasdehoy.com) respondiendo
- ✅ Campo `queryenEvento` disponible
- ✅ API Bodas (api.bodasdehoy.com) respondiendo
- ✅ API-IA health check OK
- ✅ API-IA root endpoint OK (versión 2.1.0)
- ❌ **API-IA chat endpoint falla** (sin credenciales)
- ✅ Configuración `.env.local` correcta
- ✅ Fallback de Copilot habilitado

---

## 🚀 Pasos para el Backend Team

### 1. Obtener API Key de Anthropic
   - Si ya existe: Usar la API key existente
   - Si no existe: Crear cuenta en https://console.anthropic.com/
   - Generar API key: Settings → API Keys → Create Key

### 2. Configurar en sistema whitelabel
   - Acceder al panel de configuración de api-ia
   - Agregar configuración para developer `bodasdehoy`
   - Especificar: provider=anthropic, model=claude-3-5-sonnet-20241022, apiKey=sk-ant-...

### 3. Verificar configuración
   - Ejecutar Test 1, 2 y 3 (ver sección arriba)
   - Verificar que NO haya error de "API key no configurada"
   - Verificar que las respuestas vengan de Claude

### 4. Notificar al Frontend Team
   - Confirmar que la configuración está lista
   - Proporcionar modelo y provider configurados
   - Frontend team verificará Copilot end-to-end

---

## 📞 Contacto

**Frontend Team**: @juancarlosparra
**Documentos generados**: Ver carpeta `apps/web/` en el monorepo
**Script de verificación**: `/tmp/verificacion-completa-sistema.sh`

---

## ⏰ Timeline

| Fecha | Evento |
|-------|--------|
| 2026-02-11 | ✅ Problema de eventos resuelto (CORS + configuración) |
| 2026-02-11 | ✅ Diagnóstico completo de API-IA realizado |
| 2026-02-11 | ⏳ **PENDIENTE**: Configurar credenciales en API-IA |

---

**Última actualización**: 2026-02-11 por Claude Code
**Estado**: Esperando configuración de Backend Team
