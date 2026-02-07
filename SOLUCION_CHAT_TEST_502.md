# ✅ Solución Aplicada: Error 502 en chat-test.bodasdehoy.com

**Fecha**: 2026-02-07
**Estado**: Solución temporal aplicada ✅

---

## 🎯 Problema Identificado

**chat-test.bodasdehoy.com** devolvía error 502 Bad Gateway porque:
- El servidor de origen NO tiene el servicio corriendo en el puerto 3210
- app-test.bodasdehoy.com funciona ✅ (puerto 3000)
- chat-test.bodasdehoy.com falla ❌ (puerto 3210 no responde)

```
Browser → Cloudflare ✅ → Servidor Origen (puerto 3210) ❌ → 502
```

---

## ✅ Solución Temporal Aplicada

### 1. Cambio en apps/web/.env.production

**Antes:**
```env
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

**Ahora:**
```env
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

**Efecto:** app-test ahora usa el chat de producción (que funciona) en lugar de chat-test (que da 502).

### 2. Archivo de Configuración para chat-test

Creado: [apps/copilot/.env.test](apps/copilot/.env.test)

Este archivo contiene la configuración correcta para cuando se levante chat-test:
- `APP_URL=https://chat-test.bodasdehoy.com`
- Misma configuración de base de datos, S3, Firebase que producción
- Listo para usarse cuando se despliegue chat-test

---

## 🚀 Solución Permanente (Pendiente)

Para que chat-test funcione correctamente, es necesario **levantar el servicio en el servidor**:

### En el Servidor donde está app-test

```bash
# 1. Conectar al servidor (necesitas acceso SSH)
ssh usuario@servidor-test

# 2. Ir al directorio del proyecto
cd /ruta/al/proyecto

# 3. Verificar estado de PM2
pm2 list

# 4. Iniciar ambos servicios según ecosystem.config.js
pm2 start ecosystem.config.js

# 5. Verificar que ambos estén corriendo
pm2 list
# Debe mostrar:
# - app-test (puerto 3000) ✅
# - chat-test (puerto 3210) ✅

# 6. Guardar configuración PM2 para arranque automático
pm2 save
pm2 startup
```

### Verificación del Proxy (nginx u otro)

El servidor debe tener configurado un proxy inverso:

```nginx
# nginx ejemplo
server {
    server_name app-test.bodasdehoy.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}

server {
    server_name chat-test.bodasdehoy.com;
    location / {
        proxy_pass http://localhost:3210;
    }
}
```

---

## 📋 Checklist para Activar chat-test

- [ ] Acceso SSH al servidor de test
- [ ] Build del proyecto copilot (`pnpm build:copilot`)
- [ ] Copiar `.env.test` a `.env.production.local` en el servidor
- [ ] Levantar servicio con PM2: `pm2 start ecosystem.config.js`
- [ ] Verificar proxy nginx/caddy para puerto 3210
- [ ] Verificar firewall permite puerto 3210
- [ ] Probar: `curl https://chat-test.bodasdehoy.com`
- [ ] Revertir cambio en apps/web/.env.production (volver a usar chat-test)

---

## 🔍 Estado Actual

### URLs Funcionando
- ✅ **app-test.bodasdehoy.com** (puerto 3000)
- ✅ **chat.bodasdehoy.com** (producción)

### URLs con 502
- ❌ **chat-test.bodasdehoy.com** (puerto 3210 no responde)

### Configuración Actual
- app-test usa chat de producción (temporal)
- Archivo .env.test creado para cuando se levante chat-test
- Build de copilot completado exitosamente

---

## 📊 DNS y IPs

Ambos dominios apuntan a las mismas IPs de Cloudflare:
```
app-test.bodasdehoy.com  → 172.67.137.140, 104.21.62.168
chat-test.bodasdehoy.com → 172.67.137.140, 104.21.62.168
```

El DNS está correcto. El problema es en el origen (servidor no responde en puerto 3210).

---

## 🎯 Próximos Pasos

1. **Obtener acceso SSH** al servidor donde está app-test
2. **Levantar chat-test** con PM2 en puerto 3210
3. **Verificar proxy** nginx/caddy
4. **Probar** que chat-test responde
5. **Revertir** configuración de app-test para usar chat-test

---

## 📝 Archivos Modificados

- ✅ [apps/web/.env.production](apps/web/.env.production) - Cambio temporal a chat producción
- ✅ [apps/copilot/.env.test](apps/copilot/.env.test) - Configuración para chat-test (nuevo)

---

**Estado Final**: app-test funciona usando chat de producción. Para activar chat-test se necesita acceso al servidor.
