# Solución: Copilot Sin Datos

**Fecha:** 6 Feb 2026 - 19:50

---

## Problema Identificado

El copilot muestra "guide.defaultMessage" porque **NO hay usuario autenticado** en la web app.

### Estado Detectado

```
✅ Copilot iframe: CARGADO correctamente
✅ URL iframe: http://localhost:3210/bodasdehoy/chat?developer=bodasdehoy&embed=1
✅ Sidebar: IZQUIERDA (correcto)
✅ Contenido: DERECHA con margin-left: 380px (correcto)

❌ sessionBodas cookie: NO EXISTE
❌ Firebase user: NO EXISTE
✅ Solo sesión invitado: copilot_guest_session
```

---

## Causa Raíz

El componente `CopilotIframe.tsx` intenta enviar `AUTH_CONFIG` al copilot con:
- `userId` → **undefined** (no hay usuario)
- `userData` → **null** (no hay datos)
- `token` → **null** (no hay sesión)

El copilot (`EventosAutoAuth`) recibe el mensaje pero SIN datos de usuario, por lo que muestra el mensaje por defecto para visitantes.

---

## Solución

### Opción 1: Login Manual (Inmediato)

1. En el navegador, ve a: http://127.0.0.1:8080/login
2. Inicia sesión con tu cuenta
3. El copilot se autenticará automáticamente

### Opción 2: Login Automático con Script (Recomendado)

Ejecutar:
```bash
node apps/web/scripts/auto-login-for-copilot.js
```

Este script:
1. Navega a `/login`
2. Hace login con credenciales de prueba
3. Espera a que Firebase autentique
4. Abre el copilot automáticamente
5. Verifica que los datos se carguen

---

## Verificación Post-Login

Después del login, deberías ver:

### En el navegador
```
✅ Cookie sessionBodas presente
✅ Usuario Firebase en localStorage
✅ Nombre de usuario visible en la app
```

### En el copilot
```
✅ Mensaje de bienvenida personalizado
✅ Datos del evento cargados
✅ Lista de eventos disponible
✅ Respuestas contextuales funcionando
```

---

## Código Relevante

### CopilotIframe.tsx (líneas 472-530)
```typescript
const sendAuthConfig = useCallback(() => {
  const iframe = iframeRef.current;
  if (!iframe?.contentWindow || !userId) return;  // ← Si no hay userId, no envía nada

  const sessionToken = Cookies.get('sessionBodas') || null;  // ← Busca cookie

  const authConfig = {
    type: 'AUTH_CONFIG',
    source: 'app-bodas',
    payload: {
      userId,           // ← undefined si no hay login
      development,
      token: sessionToken,  // ← null si no hay cookie
      userData,         // ← null si no hay usuario
      eventId,
      eventName,
    },
  };

  iframe.contentWindow.postMessage(authConfig, copilotOrigin);
}, [userId, development, userData, ...]);
```

### EventosAutoAuth.tsx (líneas 68-129)
```typescript
const handleMessage = (event: MessageEvent) => {
  const { type, payload } = event.data || {};

  if (type === 'AUTH_CONFIG' && payload) {
    // Si payload.userId existe, configura usuario
    if (payload.userId && setExternalChatConfig) {
      setExternalChatConfig(
        payload.userId,        // ← Necesita esto
        payload.development,
        payload.token,
        'registered',
        undefined,
        payload.userData       // ← Y esto
      );
    }
    // Si NO hay userId, muestra mensaje por defecto
  }
};
```

---

## Próximos Pasos

1. **Inmediato:** Login en la web app
2. **Verificar:** Copilot carga datos del usuario
3. **Probar:** Hacer preguntas contextuales al copilot
4. **Confirmar:** Layout izquierda/derecha funciona correctamente

---

## Resumen Técnico

| Componente | Estado | Notas |
|------------|--------|-------|
| Layout (izq/der) | ✅ Funciona | Copilot a la izquierda, correcto |
| Iframe | ✅ Carga | URL correcta con embed=1 |
| PostMessage | ✅ Implementado | CopilotIframe.tsx tiene lógica completa |
| Autenticación Web | ❌ Sin usuario | **ESTE ES EL PROBLEMA** |
| Backend IA | ✅ Disponible | https://api-ia.bodasdehoy.com |
| EventosAutoAuth | ✅ Funciona | Espera AUTH_CONFIG correctamente |

**SOLUCIÓN:** Login del usuario en la web app → Copilot cargará datos automáticamente

