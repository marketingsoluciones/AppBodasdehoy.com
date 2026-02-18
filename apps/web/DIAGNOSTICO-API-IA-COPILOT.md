# Diagnóstico Completo: API-IA Copilot Backend

**Fecha**: 2026-02-11
**Estado**: api-ia.bodasdehoy.com está operativo pero falta configuración de credenciales

---

## 📋 Resumen Ejecutivo

El backend de IA (api-ia.bodasdehoy.com) está funcionando correctamente a nivel de infraestructura, pero tiene **problemas de configuración de credenciales** que impiden su uso desde el Copilot.

### Estado General
- ✅ Servidor saludable y respondiendo
- ✅ Endpoints REST disponibles
- ✅ Documentación OpenAPI funcionando
- ❌ **Credenciales de Anthropic no configuradas para developer "bodasdehoy"**
- ❌ **Configuración whitelabel desde API2 fallando**

---

## 🔍 Tests Realizados y Resultados

### Test 1: Health Check
**Comando**:
```bash
curl -s https://api-ia.bodasdehoy.com/health | jq '.'
```

**Resultado**: ✅ **ÉXITO**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-11T10:31:14.244331"
}
```

**Conclusión**: El servidor está operativo y respondiendo.

---

### Test 2: Root Endpoint (Documentación API)
**Comando**:
```bash
curl -s https://api-ia.bodasdehoy.com/ | jq '.'
```

**Resultado**: ✅ **ÉXITO**
```json
{
  "name": "Bodas de Hoy - API de IA",
  "version": "2.1.0",
  "description": "API para gestión de chats con diferentes proveedores de IA",
  "documentation": "/docs",
  "openapi": "/openapi.json"
}
```

**Conclusión**: API documentada correctamente, versión 2.1.0.

---

### Test 3: Endpoint Chat con Anthropic
**Comando**:
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"hola"}],"model":"claude-3-5-sonnet-20241022","stream":false}'
```

**Resultado**: ❌ **ERROR - Credenciales no configuradas**
```json
{
  "detail": "API key de anthropic no configurada para este developer"
}
```

**Causa Raíz**:
- El sistema de whitelabel no tiene configurada la API key de Anthropic para el developer "bodasdehoy"
- La configuración debería venir desde API2 (`getWhiteLabelConfig`)

---

### Test 4: OpenAPI Documentation
**Comando**:
```bash
curl -s "https://api-ia.bodasdehoy.com/openapi.json" | jq '.info, .servers'
```

**Resultado**: ✅ **ÉXITO**
```json
{
  "title": "Bodas de Hoy - API de IA",
  "version": "2.1.0"
}
```

**Documentación completa disponible en**:
- `/docs` - Swagger UI
- `/openapi.json` - Especificación OpenAPI 3.0

---

### Test 5: Security Schemes
**Comando**:
```bash
curl -s "https://api-ia.bodasdehoy.com/openapi.json" | jq '.components.securitySchemes'
```

**Resultado**: ✅ Esquemas de seguridad definidos
- Bearer Auth para API keys
- Whitelabel system (Development header)

---

### Test 6: Configuración Whitelabel desde API2
**Comando**:
```bash
SUPPORT_KEY="VpKvdEFxVpdNFdErLK9aEGEaLbCqkz5atQGLH5KMJj8ucVp8kQbfwPdwbzJmtLR9"

curl -s -X POST "https://api2.eventosorganizador.com/graphql" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"query { getWhiteLabelConfig(development: \\\"bodasdehoy\\\", supportKey: \\\"$SUPPORT_KEY\\\") { success aiProvider aiModel aiApiKey errors { field message } } }\"}"
```

**Resultado**: ❌ **ERROR - Autenticación fallida**
```json
{
  "errors": [{
    "message": "Usuario no autenticado o supportKey inválido"
  }]
}
```

**Causa Raíz**:
- El `supportKey` utilizado es inválido o expiró
- No hay autenticación de usuario en la petición GraphQL
- El sistema de whitelabel requiere autenticación válida

---

### Test 7: Backend Local Python (Puerto 8030)
**Comando**:
```bash
lsof -i :8030
```

**Resultado**: ❌ **NO ESTÁ CORRIENDO**
```
(sin output - puerto no ocupado)
```

**Causa Raíz**:
- El backend Python local que antes corría en `http://127.0.0.1:8030` ya NO está en uso
- Ahora se usa exclusivamente `api-ia.bodasdehoy.com`

---

## 🔴 Errores Críticos Identificados

### Error 1: "API key de anthropic no configurada para este developer"
**Ubicación**: api-ia.bodasdehoy.com
**Impacto**: 🔴 **CRÍTICO** - Copilot no puede funcionar
**Causa**: Falta configuración de credenciales en sistema whitelabel

**Archivos afectados**:
- [EventosAutoAuth/index.tsx:1032-1067](../copilot/src/features/EventosAutoAuth/index.tsx#L1032-L1067)

**Error mostrado al usuario**:
```
"Error al conectar con el servidor de autenticación"
"Failed to fetch"
```

**Solución requerida**:
1. Configurar API key de Anthropic en sistema whitelabel para developer "bodasdehoy"
2. O proporcionar `supportKey` válido para query `getWhiteLabelConfig`

---

### Error 2: "Usuario no autenticado o supportKey inválido"
**Ubicación**: api2.eventosorganizador.com
**Impacto**: 🔴 **CRÍTICO** - No se puede obtener configuración whitelabel
**Causa**: Support key inválido o falta autenticación

**Archivos afectados**:
- [chat.ts:82-102](pages/api/copilot/chat.ts#L82-L102) - Intenta obtener whitelabel config

**Solución requerida**:
1. Obtener `supportKey` válido actualizado
2. O agregar autenticación de usuario a la query `getWhiteLabelConfig`

---

## 🔧 Arquitectura del Sistema

### Flujo de Autenticación Actual

```
Usuario → Copilot (3210)
           ↓
       EventosAutoAuth
           ↓
       eventos-api.ts
           ↓
       api-ia.bodasdehoy.com/identify-user
           ↓
       Whitelabel System
           ↓
       ❌ "API key de anthropic no configurada"
```

### Configuración Backend en .env.local

**Copilot** ([.env.local](../copilot/.env.local)):
```bash
NEXT_PUBLIC_BACKEND_URL=https://api-ia.bodasdehoy.com
BACKEND_INTERNAL_URL=https://api-ia.bodasdehoy.com
BACKEND_URL=https://api-ia.bodasdehoy.com
PYTHON_BACKEND_URL=https://api-ia.bodasdehoy.com
```

**Web App** ([.env.local](apps/web/.env.local#L14)):
```bash
OPENAI_API_KEY=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
ENABLE_COPILOT_FALLBACK=true
```

⚠️ **NOTA DE SEGURIDAD**: La API key de OpenAI está expuesta en este archivo. Considerar rotarla y usar secrets manager.

---

## 📊 Tabla de APIs y Estados

| API | URL | Propósito | Estado |
|-----|-----|-----------|--------|
| **api-ia** | https://api-ia.bodasdehoy.com | Backend IA para Copilot | ✅ Operativo, ❌ Sin credenciales |
| **API2** | https://api2.eventosorganizador.com | Configuración whitelabel | ❌ Autenticación fallando |
| **API Eventos** | https://apiapp.bodasdehoy.com | Eventos, invitados, presupuestos | ✅ Funcionando |
| **API Bodas** | https://api.bodasdehoy.com | Auth, usuarios, sesiones | ✅ Funcionando |
| **Backend Local (8030)** | http://127.0.0.1:8030 | Ya NO se usa | ❌ No corriendo |

---

## ✅ Soluciones Recomendadas

### Solución 1: Configurar Credenciales en Whitelabel (RECOMENDADA)
**Responsable**: Backend Team / DevOps
**Prioridad**: 🔴 Alta

**Pasos**:
1. Acceder al sistema de whitelabel en API2
2. Configurar credenciales para developer "bodasdehoy":
   ```json
   {
     "development": "bodasdehoy",
     "aiProvider": "anthropic",
     "aiModel": "claude-3-5-sonnet-20241022",
     "aiApiKey": "sk-ant-..."
   }
   ```
3. Verificar que la configuración se aplique correctamente
4. Test con:
   ```bash
   curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
     -H "Content-Type: application/json" \
     -H "X-Development: bodasdehoy" \
     -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022"}'
   ```

---

### Solución 2: Usar Fallback de OpenAI (TEMPORAL)
**Responsable**: Frontend Team
**Prioridad**: 🟡 Media (ya implementado)

**Estado actual**:
- ✅ Ya configurado en `.env.local`
- ✅ Variable `ENABLE_COPILOT_FALLBACK=true`
- ✅ API key de OpenAI presente

**Verificar**:
- Revisar que el código de fallback funcione correctamente cuando api-ia falla
- Ver [chat.ts](pages/api/copilot/chat.ts) para lógica de fallback

---

### Solución 3: Actualizar Support Key
**Responsable**: Backend Team
**Prioridad**: 🟡 Media

**Pasos**:
1. Generar nuevo `supportKey` válido en API2
2. Actualizar en código que llama `getWhiteLabelConfig`
3. Test con:
   ```bash
   curl -X POST "https://api2.eventosorganizador.com/graphql" \
     -H "Content-Type: application/json" \
     -d '{"query":"query { getWhiteLabelConfig(development: \"bodasdehoy\", supportKey: \"NUEVO_KEY\") { success aiProvider aiModel aiApiKey errors { field message } } }"}'
   ```

---

## 🧪 Tests de Verificación Post-Fix

Una vez aplicadas las soluciones, ejecutar estos tests:

### Test 1: Verificar credenciales configuradas
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"Hola, esto es una prueba"}],"model":"claude-3-5-sonnet-20241022","stream":false}' \
  | jq '.'
```

**Resultado esperado**: Respuesta válida de Anthropic (no error de API key)

### Test 2: Verificar whitelabel desde API2
```bash
curl -X POST "https://api2.eventosorganizador.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { getWhiteLabelConfig(development: \"bodasdehoy\", supportKey: \"NUEVO_KEY\") { success aiProvider aiModel aiApiKey } }"}' \
  | jq '.'
```

**Resultado esperado**: `success: true` con credenciales

### Test 3: Probar Copilot end-to-end
1. Ir a `http://localhost:3210` (Copilot)
2. Iniciar sesión con usuario de prueba
3. Enviar mensaje de prueba en el chat
4. Verificar respuesta de IA

**Resultado esperado**: Respuesta generada por Claude sin errores

---

## 📝 Notas Adicionales

### Cambio de Arquitectura
- **Antes**: Backend Python local en puerto 8030
- **Ahora**: api-ia.bodasdehoy.com (FastAPI en producción)
- **Migración**: Completada, pero falta configuración de credenciales

### Headers Importantes
El sistema de whitelabel usa estos headers:
- `X-Development: bodasdehoy` - Identifica el developer/tenant
- `Development: bodasdehoy` - Alternativa (ambos soportados)
- `Authorization: Bearer <token>` - Para autenticación de usuario

### Endpoints Disponibles en api-ia
```
GET  /health                           - Health check
GET  /                                  - Info de la API
POST /webapi/chat/{provider}           - Chat con proveedor IA
POST /webapi/chat/{provider}/stream    - Chat streaming
POST /identify-user                    - Identificar usuario
GET  /docs                             - Swagger UI
GET  /openapi.json                     - Spec OpenAPI
```

---

## 🎯 Próximos Pasos

1. ✅ **Documentación completada** (este archivo)
2. ⏳ **Configurar credenciales Anthropic** en whitelabel (Backend Team)
3. ⏳ **Actualizar supportKey** si es necesario (Backend Team)
4. ⏳ **Ejecutar tests de verificación** post-fix
5. ⏳ **Rotar OpenAI API Key** expuesta en .env.local (DevOps/Security)

---

**Última actualización**: 2026-02-11 por Claude Code
**Scripts de test**: `/tmp/test-api-ia-auth.sh`, `/tmp/test-whitelabel.sh`
