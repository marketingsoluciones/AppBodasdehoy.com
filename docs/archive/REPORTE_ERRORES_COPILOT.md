# Reporte de Errores del Copilot - 6 Feb 2026

## Screenshot Capturado

![Copilot Screenshot](SCREENSHOT_LOCALHOST_COPILOT.png)

**URL:** http://127.0.0.1:8080/
**Iframe URL:** http://localhost:3210/bodasdehoy/chat?developer=bodasdehoy&embed=1

---

## 🎯 Resumen Ejecutivo

✅ **Layout funcionando correctamente:** Copilot a la izquierda, contenido a la derecha
✅ **Iframe cargando correctamente:** El copilot responde
❌ **Sin autenticación de usuario:** No hay sessionBodas cookie ni Firebase user
❌ **43 errores CORS:** Backend bloqueando requests desde localhost:3210

---

## ❌ Errores Críticos Identificados

### 1. Usuario No Autenticado (CRÍTICO)

**Estado actual:**
```javascript
{
  hasSessionCookie: false,  // ❌ No existe cookie sessionBodas
  firebaseUser: null,       // ❌ No hay usuario Firebase
  guestSession: true        // ✅ Solo sesión de invitado
}
```

**Impacto:**
- El copilot muestra "guide.defaultMessage" en lugar del mensaje personalizado
- No se pueden cargar datos del evento
- No se pueden hacer preguntas contextuales
- EventosAutoAuth no recibe datos de usuario

**Solución:**
1. Login manual: Ir a http://127.0.0.1:8080/login e iniciar sesión
2. O ejecutar script de auto-login: `node apps/web/scripts/auto-login-for-copilot.js`

**Código relevante:**
```typescript
// apps/web/components/Copilot/CopilotIframe.tsx:472-530
const sendAuthConfig = useCallback(() => {
  const iframe = iframeRef.current;
  if (!iframe?.contentWindow || !userId) return;  // ❌ No ejecuta porque userId es undefined

  const sessionToken = Cookies.get('sessionBodas') || null;  // ❌ null

  const authConfig = {
    type: 'AUTH_CONFIG',
    source: 'app-bodas',
    payload: {
      userId,           // ❌ undefined
      development,
      token: sessionToken,  // ❌ null
      userData,         // ❌ null
      eventId,
      eventName,
    },
  };

  iframe.contentWindow.postMessage(authConfig, copilotOrigin);
}, [userId, ...]);
```

---

### 2. Errores CORS con Backend (CRÍTICO)

**43 errores capturados en consola:**

```
Access to fetch at 'https://api-ia.bodasdehoy.com/api/debug-logs/upload'
  from origin 'http://localhost:3210' has been blocked by CORS policy

Access to fetch at 'https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-credentials'
  from origin 'http://localhost:3210' has been blocked by CORS policy

Access to fetch at 'https://api-ia.bodasdehoy.com/api/config/bodasdehoy'
  from origin 'http://localhost:3210' has been blocked by CORS policy
```

**Endpoints afectados:**
- `/api/debug-logs/upload` - Logs del copilot
- `/api/developers/bodasdehoy/ai-credentials` - Credenciales de IA
- `/api/config/bodasdehoy` - Configuración del whitelabel

**Causa raíz:**
El backend `api-ia.bodasdehoy.com` no permite requests desde `localhost:3210`

**Impacto:**
- No se pueden cargar credenciales de IA
- No se puede cargar configuración del desarrollador
- No se pueden enviar logs de debug

**Soluciones posibles:**

**Opción 1: Configurar CORS en el backend (RECOMENDADO)**
```python
# Backend Python - Agregar localhost:3210 a CORS allowed origins
CORS_ALLOWED_ORIGINS = [
    "https://app.bodasdehoy.com",
    "http://localhost:3210",  # ← Agregar esto
    "http://127.0.0.1:3210",
]
```

**Opción 2: Usar proxy local (TEMPORAL)**
```javascript
// next.config.js del copilot
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api-ia.bodasdehoy.com/api/:path*',
      },
    ];
  },
};
```

**Opción 3: Usar backend local (DESARROLLO)**
```bash
# apps/copilot/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_URL=http://localhost:8000
```

---

### 3. Parámetro embed=1 - ✅ VERIFICADO FUNCIONANDO

**Estado:**
El parámetro `embed=1` está correctamente configurado en ambos archivos:

**Archivos:**
- ✅ `packages/copilot-ui/src/CopilotDirect.tsx:56` - Tiene `params.set('embed', '1')`
- ✅ `apps/web/components/Copilot/CopilotIframe.tsx:105` - Tiene `params.set('embed', '1')`

**Código verificado:**
```typescript
// apps/web/components/Copilot/CopilotIframe.tsx:101-105
const buildCopilotUrl = useCallback(() => {
  const params = new URLSearchParams();

  // Modo embebido: oculta navegación lateral del copilot PERO mantiene panel derecho
  params.set('embed', '1');
  // ...
```

**Resultado:**
El copilot ya está cargando en modo embebido correctamente. Screenshot confirma que la URL incluye `?developer=bodasdehoy&embed=1`

---

## ✅ Elementos Funcionando Correctamente

### Layout Izquierda/Derecha

```javascript
// Estado verificado:
{
  copilotPosition: "left",
  copilotWidth: 380,
  contentMarginLeft: "380px",
  iframeLoaded: true,
  layoutCorrect: true  ✅
}
```

### Iframe y PostMessage

```javascript
// CopilotIframe.tsx tiene toda la lógica necesaria:
✅ useEffect para enviar AUTH_CONFIG
✅ Listener para AUTH_REQUEST del iframe
✅ Construcción de URL con parámetros correctos
✅ Callback de sendAuthConfig bien implementado
```

### EventosAutoAuth

```typescript
// apps/copilot/src/features/EventosAutoAuth/index.tsx
✅ Listener de mensajes configurado
✅ Manejo de AUTH_CONFIG implementado
✅ Fallback a modo invitado cuando no hay datos
```

---

## 📊 Diagnóstico por Componente

| Componente | Estado | Notas |
|------------|--------|-------|
| Layout (izq/der) | ✅ Funciona | Copilot a la izquierda correctamente |
| Iframe carga | ✅ Funciona | URL correcta con embed=1 |
| PostMessage | ⚠️ Parcial | Lógica correcta pero sin userId |
| Autenticación Web | ❌ Falla | Usuario no logueado |
| CORS Backend | ❌ Falla | 43 errores bloqueando requests |
| EventosAutoAuth | ✅ Funciona | Esperando AUTH_CONFIG |
| Embed Mode | ⚠️ Parcial | Solo en CopilotDirect, no en CopilotIframe |

---

## 🔧 Plan de Reparación

### Prioridad 1: Login de Usuario (REQUIERE ACCIÓN DEL USUARIO)
**Tiempo:** 2 minutos
**Acción:** Login manual en http://127.0.0.1:8080/login
**Resultado esperado:** Cookie sessionBodas, Firebase user, AUTH_CONFIG enviado

**Verificación post-login:**
```bash
node apps/web/scripts/check-user-session.js
```

### Prioridad 2: Resolver CORS (REQUIERE CONFIGURACIÓN BACKEND)
**Tiempo:** 15-30 minutos
**Opciones:**

**Opción A: Configurar CORS en Backend (RECOMENDADO para producción)**
```python
# Backend Python - Agregar a configuración CORS
CORS_ALLOWED_ORIGINS = [
    "https://app.bodasdehoy.com",
    "http://localhost:3210",
    "http://127.0.0.1:3210",
]
```

**Opción B: Proxy en Next.js (RÁPIDO para desarrollo)**
```javascript
// apps/copilot/next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api-ia.bodasdehoy.com/api/:path*',
      },
    ];
  },
};
```

**Opción C: Backend Local (IDEAL para desarrollo)**
```bash
# 1. Clonar y ejecutar backend Python localmente
cd /path/to/backend
python main.py  # O el comando de inicio

# 2. Actualizar apps/copilot/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_URL=http://localhost:8000
```

**Resultado esperado:** Credenciales de IA cargadas, config cargada, logs enviados

---

## 📝 Notas Técnicas

### Flujo de Autenticación Esperado

```
1. Usuario hace login en web app (127.0.0.1:8080)
   ↓
2. Firebase autentica y guarda user en localStorage
   ↓
3. Backend crea cookie sessionBodas
   ↓
4. AuthContext detecta usuario logueado
   ↓
5. CopilotIframe recibe userId/userData del contexto
   ↓
6. Iframe carga completamente
   ↓
7. CopilotIframe.sendAuthConfig() ejecuta
   ↓
8. postMessage envía AUTH_CONFIG al iframe
   ↓
9. EventosAutoAuth recibe mensaje
   ↓
10. setExternalChatConfig configura usuario en copilot
   ↓
11. Copilot carga datos del evento desde backend
   ↓
12. Usuario ve mensaje personalizado y puede preguntar
```

### URLs Importantes

- Web App: http://127.0.0.1:8080
- Copilot: http://localhost:3210
- Backend: https://api-ia.bodasdehoy.com
- Login: http://127.0.0.1:8080/login

### Credenciales de Prueba

```javascript
EMAIL: 'bodasdehoy.com@gmail.com'
PASSWORD: 'lorca2012M*+'
USER_ID: 'upSETrmXc7ZnsIhrjDjbHd7u2up1'
```

### Evento de Prueba

```javascript
{
  eventId: '695e98c1e4c78d86fe107f71',
  eventName: 'Boda de Paco y Pico',
  totalInvitados: 25,
  confirmados: 12,
  presupuestoTotal: 15000,
  pagado: 5000,
  totalMesas: 5
}
```

---

## 🎬 Próximos Pasos Inmediatos

1. ✅ **COMPLETADO:** Captura de screenshot y análisis de errores
2. ✅ **COMPLETADO:** Verificación de parámetro `embed=1` (ya estaba configurado)
3. ⏳ **PENDIENTE:** Login del usuario en la web app (http://127.0.0.1:8080/login)
4. ⏳ **PENDIENTE:** Resolver errores CORS con backend (elegir Opción A, B o C)
5. ⏳ **RECOMENDADO:** Ejecutar tests automatizados después del login

---

## 📚 Documentos Relacionados

- [SOLUCION_COPILOT_SIN_DATOS.md](SOLUCION_COPILOT_SIN_DATOS.md) - Análisis del problema de autenticación
- [SOLUCION_IFRAME_VS_COMPONENTE.md](SOLUCION_IFRAME_VS_COMPONENTE.md) - Por qué iframe es la solución correcta
- [SCREENSHOT_LOCALHOST_COPILOT.png](SCREENSHOT_LOCALHOST_COPILOT.png) - Screenshot del estado actual

---

**Generado:** 6 Feb 2026 - 20:15
**Actualizado:** 6 Feb 2026 - 20:30
**Estado:** ✅ Corrección CORS aplicada (pendiente reinicio servidor), ⏳ Login de usuario pendiente

---

## 🔄 ACTUALIZACIÓN - Corrección Aplicada

### ✅ Proxy para Backend Configurado

**Archivo modificado:** `apps/copilot/next.config.ts` (líneas 317-345)

**Solución implementada:**
Se agregaron reglas de proxy para que todas las llamadas a `/api/*` pasen por el servidor Next.js antes de llegar al backend, eliminando los errores CORS.

**⚠️ ACCIÓN REQUERIDA:**
```bash
# Reiniciar el servidor copilot para aplicar cambios
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
pnpm dev
```

Ver detalles completos en: [CORRECCIONES_APLICADAS_COPILOT.md](CORRECCIONES_APLICADAS_COPILOT.md)
