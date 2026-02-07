# ✅ Solución Completa: Copilot y chat-test

**Fecha**: 2026-02-07

---

## 🎯 Diagnóstico del Problema

### Problema 1: Editor Limitado
El Copilot está usando **iframe** con parámetro `embed=1` que oculta funcionalidades.

**Ubicación**: [apps/web/components/ChatSidebar/ChatSidebar.tsx](apps/web/components/ChatSidebar/ChatSidebar.tsx:16)

### Problema 2: chat-test.bodasdehoy.com → 502
El servidor NO tiene el servicio corriendo en puerto 3210.

---

## 📂 Mapa del Repositorio

### Componentes del Copilot

#### apps/web/components/Copilot/
```
CopilotIframe.tsx          ← 🔴 ACTUAL (iframe, limitado)
CopilotChatNative.tsx      ← ⭐ RECOMENDADO (nativo, completo)
CopilotHeader.tsx
CopilotPrewarmer.tsx
CopilotSplitLayout.tsx
```

#### apps/web/components/ChatSidebar/
```
ChatSidebar.tsx            ← 📍 Donde se usa el Copilot
ChatSidebarDirect.tsx
```

#### apps/copilot/
```
src/app/[variants]/(main)/chat/    ← 💬 UI del chat completo
.env                                ← Config desarrollo
.env.test                           ← Config chat-test (nuevo)
.env.production.local               ← Config producción
start.sh                            ← Script inicio (puerto 3210)
```

### Archivos de Configuración

#### ecosystem.config.js
```js
apps: [
  { name: 'app-test',  script: './apps/web/start.sh' },     // Puerto 3000 ✅
  { name: 'chat-test', script: './apps/copilot/start.sh' }, // Puerto 3210 ❌
]
```

#### apps/web/.env.production
```env
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com  # Temporal
```

---

## 🔧 Soluciones

### ⭐ Solución A: Componente Nativo (RECOMENDADO)

**Ventajas**:
- ✅ Editor completo sin limitaciones
- ✅ No depende de chat-test
- ✅ Mejor rendimiento
- ✅ Implementación inmediata

**Pasos**:

1. **Modificar ChatSidebar.tsx**:

```tsx
// Línea 16 - Cambiar import
- import CopilotIframe from '../Copilot/CopilotIframe';
+ import CopilotChatNative from '../Copilot/CopilotChatNative';

// Alrededor de línea 200+ - Cambiar componente
- <CopilotIframe
-   userId={userId}
-   development={development}
-   eventId={eventId}
-   className="..."
-   userData={user}
-   event={event}
-   eventsList={eventsGroup}
- />
+ <CopilotChatNative
+   userId={userId}
+   development={development}
+   eventId={eventId}
+   eventName={event?.nombre}
+   pageContext={{
+     pageName,
+     eventId,
+     eventName: event?.nombre,
+     screenData,
+   }}
+   onNavigate={(url) => router.push(url)}
+   onExpand={() => window.open(chatUrl, '_blank')}
+   className="flex-1 h-full"
+ />
```

2. **Rebuild**:
```bash
cd apps/web
pnpm build
```

3. **Deploy** (o probar en local con `pnpm dev`)

---

### 🔄 Solución B: Levantar chat-test (Servidor)

**Para usar iframe completo de LobeChat**:

#### Requisito: Acceso SSH al servidor

1. **Conectar al servidor**:
```bash
ssh usuario@servidor-test
```

2. **Ir al proyecto**:
```bash
cd /ruta/al/proyecto
```

3. **Verificar builds**:
```bash
# Verificar que existan
ls -la apps/web/.next
ls -la apps/copilot/.next

# Si no existen, construir
pnpm build:web
pnpm build:copilot
```

4. **Configurar .env de copilot**:
```bash
# Copiar .env.test a .env.production.local
cp apps/copilot/.env.test apps/copilot/.env.production.local
```

5. **Iniciar servicios con PM2**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

6. **Verificar**:
```bash
pm2 list
# Debe mostrar:
# ┌─────┬──────────┬─────────┬────────┐
# │ id  │ name     │ status  │ port   │
# ├─────┼──────────┼─────────┼────────┤
# │ 0   │ app-test │ online  │ 3000   │
# │ 1   │ chat-test│ online  │ 3210   │
# └─────┴──────────┴─────────┴────────┘

# Verificar puertos
lsof -i :3000
lsof -i :3210
```

7. **Configurar Proxy (nginx/caddy)**:

**nginx ejemplo**:
```nginx
# /etc/nginx/sites-available/app-test
server {
    server_name app-test.bodasdehoy.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name chat-test.bodasdehoy.com;
    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Recargar nginx
sudo nginx -t
sudo systemctl reload nginx
```

8. **Verificar URLs**:
```bash
curl -I https://app-test.bodasdehoy.com    # Debe dar 200
curl -I https://chat-test.bodasdehoy.com   # Debe dar 200 (no 502)
```

9. **Revertir configuración temporal**:

En `apps/web/.env.production`:
```env
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

---

### 🔀 Solución C: Quitar embed=1 (Parcial)

Si quieres mantener iframe pero con más funcionalidades:

**Archivo**: apps/web/components/Copilot/CopilotIframe.tsx

```tsx
// Línea 105 - Comentar
// params.set('embed', '1');
```

**Limitación**: Seguirá dependiendo de que chat-test funcione.

---

## 🚀 Script de Ayuda

Creado: [scripts/reiniciar-servicios-test.sh](scripts/reiniciar-servicios-test.sh)

```bash
# En el servidor
./scripts/reiniciar-servicios-test.sh
```

Este script:
- ✅ Verifica builds
- ✅ Inicia PM2
- ✅ Verifica puertos
- ✅ Prueba URLs
- ✅ Muestra logs

---

## 📊 Comparación de Soluciones

| Aspecto | Componente Nativo | Levantar chat-test | Quitar embed=1 |
|---------|------------------|-------------------|----------------|
| Complejidad | ⭐ Baja | 🔧 Media | ⭐ Baja |
| Editor completo | ✅ Sí | ✅ Sí | ⚠️ Parcial |
| Requiere servidor | ❌ No | ✅ Sí | ✅ Sí |
| Tiempo | 🚀 Inmediato | ⏱️ 30-60 min | 🚀 Inmediato |
| Recomendado | ⭐⭐⭐ | ⭐⭐ | ⭐ |

---

## ✅ Recomendación Final

**Implementar Solución A (Componente Nativo)** porque:
1. ✅ Funciona inmediatamente
2. ✅ No requiere acceso a servidor
3. ✅ Editor 100% funcional
4. ✅ Mejor rendimiento
5. ✅ Más fácil de mantener

**Si también necesitas chat-test** (para otras funcionalidades):
1. Implementar Solución A primero (desbloqueo inmediato)
2. Luego implementar Solución B (cuando tengas acceso al servidor)

---

## 📝 Archivos Modificados

### Ya Modificados
- ✅ [apps/web/.env.production](apps/web/.env.production) - Chat temporal a producción
- ✅ [apps/copilot/.env.test](apps/copilot/.env.test) - Config para chat-test
- ✅ [scripts/reiniciar-servicios-test.sh](scripts/reiniciar-servicios-test.sh) - Script de ayuda

### Por Modificar (Solución A)
- 📝 [apps/web/components/ChatSidebar/ChatSidebar.tsx](apps/web/components/ChatSidebar/ChatSidebar.tsx) - Cambiar a CopilotChatNative

---

## 🔍 Verificación

### Local
```bash
pnpm dev:web
# Abrir http://localhost:8080
# Verificar que el copilot cargue completo
```

### Producción
```bash
# Después de deploy
# Abrir https://app-test.bodasdehoy.com
# Verificar copilot tiene todas las funcionalidades
```

---

**Estado**: Listo para implementar Solución A.
