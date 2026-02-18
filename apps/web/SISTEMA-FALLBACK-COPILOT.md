# Sistema de Fallback del Copilot - Explicación

## ¿Por qué hay un sistema de fallback?

El Copilot tiene un sistema de fallback en cascada para **asegurar que SIEMPRE funcione**, aunque sea de forma limitada, incluso cuando el backend principal (api-ia.bodasdehoy.com) falla.

---

## 🔄 Cómo Funciona (Cascada de Fallbacks)

### Paso 1: Backend Principal - api-ia.bodasdehoy.com ✨ COMPLETO
**Estado**: ❌ **FALLANDO** - Falta API key de Anthropic

**Capacidades**:
- ✅ Chat inteligente con Claude
- ✅ **30+ herramientas**: Agregar invitados, gestionar presupuesto, mesas, itinerarios, etc.
- ✅ Auto-routing entre modelos (OpenRouter)
- ✅ Eventos enriquecidos (tool_result, ui_action, progress)
- ✅ Funcionalidad COMPLETA

**Código**:
```typescript
// Línea 1005-1012 en chat.ts
console.log('[Copilot API] Step 1: Proxying to Python backend...');
let proxySuccess = await proxyToPythonBackend(req, res, provider || DEFAULT_PROVIDER);

if (proxySuccess) {
  console.log('[Copilot API] Python backend proxy successful');
  return; // ✅ Todo bien, termina aquí
}
```

**Por qué falla ahora**:
```json
{
  "detail": "API key de anthropic no configurada para este developer"
}
```

---

### Paso 2: Fallback OpenAI Directo 🔸 LIMITADO
**Estado**: ✅ **FUNCIONA** - Usando API key en `.env.local`

**Capacidades**:
- ✅ Chat básico con GPT-4o-mini
- ❌ **NO tiene herramientas** - No puede agregar invitados, consultar presupuesto, etc.
- ❌ Solo respuestas de texto
- ⚠️ Funcionalidad MUY LIMITADA

**Código**:
```typescript
// Líneas 1022-1039 en chat.ts
if (OPENAI_API_KEY) {
  console.log('[Copilot API] Step 2: Using OpenAI direct fallback (text-only)...');
  await callProviderDirectFallback(
    OPENAI_API_KEY,
    'openai',
    'gpt-4o-mini',
    fullMessages,
    !!stream,
    res,
    requestId
  );
  return; // ✅ Fallback funciona, pero limitado
}
```

**Configuración actual**:
```bash
# En .env.local
OPENAI_API_KEY=sk-proj-d0UqDqL...
ENABLE_COPILOT_FALLBACK=true  # ← Esto ACTIVA el fallback
```

---

### Paso 3: Whitelabel Credentials ⚙️ CONFIGURACIÓN
**Estado**: ❌ **FALLANDO** - supportKey inválido en API2

**Capacidades**:
- Intenta obtener credenciales desde:
  - Opción A: API2 GraphQL (`getWhiteLabelConfig`)
  - Opción B: api-ia endpoint de whitelabel
- Si funciona, vuelve a intentar api-ia con las credenciales

**Código**:
```typescript
// Líneas 1067-1084 en chat.ts
console.log('[Copilot API] Step 3: Getting whitelabel credentials from API2...');
const whitelabelConfig = await getWhitelabelApiKey(development);

if (!whitelabelConfig) {
  return res.status(503).json({
    error: 'NO_API_KEY',
    message: 'El servicio de IA no está disponible'
  });
}
```

**Por qué falla ahora**:
```json
{
  "errors": [{
    "message": "Usuario no autenticado o supportKey inválido"
  }]
}
```

---

### Paso 4: Último Recurso - Proveedor Directo 🔹 MUY LIMITADO
**Estado**: ⏭️ No se alcanza (Paso 2 ya funciona)

**Capacidades**:
- Igual que Paso 2: solo texto, sin herramientas
- Usa credenciales del whitelabel si se obtuvieron en Paso 3

---

## 📊 Comparación de Capacidades

| Capacidad | Paso 1 (api-ia) | Paso 2-4 (Fallback) |
|-----------|-----------------|---------------------|
| **Chat básico** | ✅ Claude/GPT | ✅ GPT-4o-mini |
| **Agregar invitados** | ✅ Con herramientas | ❌ Solo puede decir "ve a /invitados" |
| **Consultar presupuesto** | ✅ Con herramientas | ❌ Solo puede decir "ve a /presupuesto" |
| **Crear tareas** | ✅ Con herramientas | ❌ No puede |
| **Generar reportes** | ✅ Con herramientas | ❌ No puede |
| **Exportar Excel/PDF** | ✅ Con herramientas | ❌ No puede |
| **Generar QR** | ✅ Con herramientas | ❌ No puede |
| **Auto-routing modelos** | ✅ OpenRouter | ❌ Un solo modelo |
| **Eventos enriquecidos** | ✅ SSE con eventos | ❌ Solo texto |

---

## 🚨 Problema Actual

### Estado Real del Copilot AHORA
```
Usuario abre Copilot
    ↓
Intenta Paso 1: api-ia.bodasdehoy.com
    ↓
❌ FALLA: "API key de anthropic no configurada"
    ↓
Cae al Paso 2: OpenAI Directo
    ↓
✅ FUNCIONA pero solo texto básico
    ↓
Usuario puede chatear pero NO puede:
  ❌ Agregar invitados
  ❌ Consultar presupuesto
  ❌ Gestionar mesas
  ❌ Crear tareas
  ❌ Generar reportes
```

---

## ✅ Solución: Configurar Backend Principal

Para tener el Copilot **COMPLETO** con todas las herramientas:

### Opción 1: Configurar Anthropic en api-ia (RECOMENDADA)
```bash
# En el backend de api-ia.bodasdehoy.com
# Configurar en sistema whitelabel para developer "bodasdehoy":
{
  "development": "bodasdehoy",
  "aiProvider": "anthropic",
  "aiModel": "claude-3-5-sonnet-20241022",
  "aiApiKey": "sk-ant-api03-..." # ← La API key de Anthropic
}
```

**Verificar**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022"}'
```

**Resultado esperado**: Respuesta de Claude (no error de API key)

---

### Opción 2: Deshabilitar Fallback (Forzar Error)
Si NO quieres que caiga al fallback limitado:

```bash
# En .env.local
ENABLE_COPILOT_FALLBACK=false  # ← Esto DESACTIVA el fallback
```

**Resultado**:
- Si api-ia falla, el Copilot mostrará error claro
- NO caerá al fallback limitado de OpenAI
- Esto FUERZA a arreglar el backend principal

---

## 🎯 Recomendación

**MANTENER el fallback activado** (`ENABLE_COPILOT_FALLBACK=true`) porque:
1. ✅ El chat funciona aunque sea limitado (mejor que nada)
2. ✅ Experiencia de usuario no se rompe completamente
3. ✅ Da tiempo para arreglar el backend sin apagar el Copilot

**PERO** también:
4. ⚠️ Configurar URGENTE la API key en api-ia.bodasdehoy.com
5. ⚠️ No confiar en el fallback como solución permanente
6. ⚠️ Los usuarios NO tendrán acceso a herramientas mientras tanto

---

## 📝 Logs para Diagnosticar

En la consola del servidor Next.js verás algo así:

```
[Copilot API] Step 1: Proxying to Python backend... {
  requestId: 'req_1234...',
  provider: 'auto'
}
[Copilot API] Backend response status: 400
[Copilot API] Backend error, status: 400 { requestId: 'req_1234...' }
[Copilot API] Step 2: Using OpenAI direct fallback (text-only)...
```

Esto confirma que:
1. ❌ Paso 1 falló (api-ia)
2. ✅ Paso 2 funcionó (OpenAI fallback)

---

## 🔐 Nota de Seguridad

La API key de OpenAI está expuesta en [.env.local:14](apps/web/.env.local#L14):
```bash
OPENAI_API_KEY=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
```

⚠️ **ACCIÓN REQUERIDA**:
1. Rotar esta API key
2. Mover a variables de entorno del servidor o gestor de secretos
3. NO commitear en git (añadir .env.local a .gitignore)

---

**Última actualización**: 2026-02-11 por Claude Code
