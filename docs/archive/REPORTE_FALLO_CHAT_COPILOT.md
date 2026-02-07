# Reporte de Fallo: Chat Copilot - Proveedores de IA no se cargan desde API-IA

**Fecha:** 2026-01-27
**Entorno:** chat-test.bodasdehoy.com
**Severidad:** CRÍTICA - El chat no puede responder mensajes

---

## Resumen del Problema

El frontend de LobeChat (Copilot) muestra el error **"No enabled providers"** cuando intenta responder mensajes, a pesar de que el backend (api-ia.bodasdehoy.com) tiene proveedores de IA correctamente configurados y funcionando.

**Error visible en UI:**
```
A server communication error occurred. Please try again.
> Show Details: "No enabled providers. Please go to settings to enable one."
```

---

## Pruebas Realizadas

### 1. Backend API-IA - FUNCIONA CORRECTAMENTE ✅

**Endpoint de credenciales:**
```bash
curl -s "https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-credentials"
```

**Respuesta:**
```json
{
  "success": true,
  "credentials": {
    "anthropic": {
      "apiKey": "sk-proj-d0Uq...[REDACTED]",
      "enabled": true
    },
    "groq": {
      "apiKey": "gsk_87V0...[REDACTED]",
      "enabled": true
    }
  }
}
```

**Endpoint de proveedores:**
```bash
curl -s "https://api-ia.bodasdehoy.com/api/providers/bodasdehoy"
```

**Respuesta:**
```json
{
  "success": true,
  "providers": [
    {"provider": "groq", "enabled": true, "has_key": true, "model": "llama-3.1-70b-versatile"},
    {"provider": "anthropic", "enabled": true, "has_key": true, "model": "claude-3-5-sonnet-20241022"}
  ],
  "active_count": 2
}
```

### 2. Chat directo con Backend - FUNCIONA ✅

```bash
curl -X POST "https://api-ia.bodasdehoy.com/api/chat/send" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"message":"Hola, que es Bodas de Hoy?","session_id":"test123"}'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "**BodasDeHoy** es una plataforma líder en España para la organización integral de bodas...",
  "ai_provider": "groq",
  "ai_model": "llama-3.3-70b-versatile",
  "tokens_used": 26557
}
```

### 3. Frontend LobeChat - FALLA ❌

El chat en `chat-test.bodasdehoy.com/bodasdehoy/chat` muestra:
- Modelo seleccionado: `gpt-5-mini` (no existe en los proveedores del backend)
- Error: "No enabled providers"
- Los proveedores del backend NO se están cargando en el frontend

---

## Análisis Técnico

### Flujo Esperado (según documentación):
```
1. Usuario abre chat
2. Frontend llama a: /api/developers/{dev}/ai-credentials
3. Frontend recibe credenciales de groq/anthropic
4. Frontend usa esas credenciales para llamar al modelo
```

### Flujo Actual (problema):
```
1. Usuario abre chat
2. Frontend tiene modelo "gpt-5-mini" guardado en la sesión
3. Frontend NO obtiene/usa las credenciales del backend
4. Frontend busca "gpt-5-mini" en proveedores locales → NO EXISTE
5. Error: "No enabled providers"
```

### Archivos Relevantes:

**Servicio de credenciales:** `apps/copilot/src/services/api2/aiCredentials.ts`
```typescript
// Este servicio EXISTE pero parece no estar siendo llamado
export async function fetchAICredentials(developerId: string): Promise<AICredentialsMap | null> {
  const url = `${BACKEND_URL}/api/developers/${developerId}/ai-credentials`;
  // ...
}
```

**Configuración por defecto:** `apps/copilot/src/const/settings.ts`
```typescript
export const DEFAULT_AGENT_CONFIG: LobeAgentConfig = {
  model: 'auto',      // ✅ Correcto
  provider: 'auto',   // ✅ Correcto
  // ...
};
```

**Problema:** Las sesiones existentes ("Just Chat") tienen modelo `gpt-5-mini` guardado, que NO existe en los proveedores del whitelabel.

---

## Capturas de Pantalla

Las capturas están en `/tmp/`:
- `chat-V7-final.png` - Error visible en UI
- `chat-D6-final.png` - Error con modelo "auto"
- `chat-NEW5-enviado.png` - Estado del chat

---

## Posibles Causas

1. **El frontend NO está llamando al endpoint de credenciales** del backend antes de enviar mensajes

2. **El modelo guardado en la sesión (`gpt-5-mini`) no tiene mapeo** al backend

3. **Falta integración entre el selector de modelo del frontend y los proveedores del whitelabel**

4. **El provider "auto" no está resolviendo correctamente** a los proveedores disponibles en api-ia

---

## Solución Requerida

El frontend de LobeChat debe:

1. **Obtener los proveedores disponibles** desde `api-ia.bodasdehoy.com/api/providers/bodasdehoy` al cargar

2. **Usar esos proveedores** en lugar de buscar configuración local

3. **Cuando el modelo es "auto"**, usar el primer proveedor habilitado del whitelabel (groq o anthropic)

4. **Eliminar o migrar sesiones con modelos inexistentes** como "gpt-5-mini"

---

## Información de Contacto

- **Backend (api-ia):** Funcionando correctamente
- **Frontend (copilot):** Requiere fix en la carga de proveedores
- **Tunnel Cloudflare:** `chat-test.bodasdehoy.com` → `localhost:3210` ✅

---

---

## Pruebas en APP-TEST.BODASDEHOY.COM

### 4. Copilot integrado en App-Test - FALLA ❌

El Copilot embebido en `app-test.bodasdehoy.com` también presenta el error.

**Estado:**
- El botón "Copilot" abre correctamente el panel lateral
- El iframe carga: `chat-test.bodasdehoy.com/bodasdehoy/chat?embed=1&embedded=1&minimal=1`
- **Error visible**: "⚠️ Backend IA: Error de conexión. | Reintentar"

**Captura de pantalla:** `evidencia_fallo_chat/app-test-copilot-error.png`

El chat muestra:
- Mensaje de bienvenida: "Hoy! I am your personal intelligent assistant Bodas de Hoy. How can I assist you today?"
- Input de texto visible en la parte inferior
- **Error de conexión con Backend IA persistente**

---

## Conclusión

El problema afecta tanto a:
1. **chat-test.bodasdehoy.com** (acceso directo)
2. **app-test.bodasdehoy.com** (Copilot embebido)

**El backend api-ia funciona correctamente** - las pruebas directas con curl demuestran que los proveedores groq y anthropic responden correctamente.

**El problema está en la conexión entre el frontend LobeChat y el backend** - los proveedores de IA no se están cargando/usando correctamente desde el whitelabel.

---

## Pruebas V7 - Usuario Autenticado (2026-01-28)

### 5. Prueba con Usuario Autenticado ✅ → Error Backend IA ❌

Se logró autenticar correctamente usando el bypass de desarrollo:

**Método de autenticación:**
```javascript
// En sessionStorage
sessionStorage.setItem('dev_bypass', 'true');
// Luego recargar la página
```

**Resultado:**
- ✅ Usuario autenticado como "UD" (Usuario Dev) - avatar visible en header
- ✅ Copilot se abre correctamente
- ✅ El mensaje se puede escribir y enviar
- ❌ **Error persistente: "Backend IA: Error de conexión"**

**Capturas:**
- `evidencia_fallo_chat/app-V7-01-after-bypass.png` - Dashboard autenticado
- `evidencia_fallo_chat/app-V7-02-copilot-abierto.png` - Copilot abierto con error
- `evidencia_fallo_chat/app-V7-04-mensaje-enviado.png` - Error visible

**Context Details del Chat:**
```
Role Settings: 0
Plugin Settings: 12,268
History Summary: 0
Chat Messages: 16
Total Used: 12,284
Remaining: 387,716
Total Available: 400,000
```

### Conclusión Actualizada

El problema **NO es de autenticación**. Incluso con usuario correctamente autenticado:
1. El chat carga correctamente
2. Se puede escribir y enviar mensajes
3. **PERO el frontend NO puede conectarse al Backend IA**

El error "Backend IA: Error de conexión" indica que hay un problema de:
- Configuración de CORS entre el iframe y api-ia.bodasdehoy.com
- O el endpoint del backend no está accesible desde el contexto del iframe
- O hay un problema con las credenciales/headers que envía el frontend

**Script de prueba funcional:** `apps/web/scripts/app-test-bypass-v7.js`

---

**Adjuntos:**
- Capturas de pantalla del error en `evidencia_fallo_chat/`
- Logs de las pruebas automatizadas (`/tmp/chat-*.log`, `/tmp/app-*.log`, `/tmp/app-test-v7.log`)
- Scripts de prueba en `apps/web/scripts/`
