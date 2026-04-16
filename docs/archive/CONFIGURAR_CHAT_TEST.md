# 🔧 Configurar chat-test.bodasdehoy.com

**Fecha**: 2026-01-25  
**Problema**: `chat-test.bodasdehoy.com` da 502 porque no tiene servidor corriendo

---

## 🎯 Situación Actual

### `chat.bodasdehoy.com` (Producción) ✅
- ✅ Servidor corriendo
- ✅ Cloudflare puede conectar
- ✅ Funciona correctamente

### `chat-test.bodasdehoy.com` (Test) ❌
- ❌ Servidor NO corriendo
- ❌ Cloudflare no puede conectar
- ❌ Error 502 Bad Gateway

---

## 🔧 Soluciones para chat-test

### Solución 1: Hacer que chat-test Use el Mismo Servidor que chat (Más Fácil)

**Ventaja**: No necesitas levantar otro servidor

**Pasos**:

1. **Ir a Cloudflare Dashboard**:
   - https://dash.cloudflare.com
   - Dominio: `bodasdehoy.com`
   - DNS → Records

2. **Crear/Editar registro `chat-test`**:
   ```
   Type: CNAME
   Name: chat-test
   Target: chat.bodasdehoy.com
   Proxy: ✅ Proxied (nube naranja)
   TTL: Auto
   ```

3. **Esperar propagación DNS** (5 minutos)

4. **Verificar**:
   ```bash
   curl -I https://chat-test.bodasdehoy.com
   ```

**Resultado**: `chat-test` usará el mismo servidor que `chat` (producción)

---

### Solución 2: Levantar Servidor Dedicado para chat-test

**Si quieres un servidor separado para test**:

#### Opción A: Servidor Remoto

```bash
# 1. Conectar al servidor de test
ssh usuario@servidor-test

# 2. Verificar si hay proceso corriendo
ps aux | grep next
pm2 list

# 3. Si no está corriendo, levantarlo
cd /ruta/a/apps/copilot
npm run dev
# O con PM2:
pm2 start npm --name "chat-test" -- run dev

# 4. Verificar que escucha
lsof -i :3210  # O el puerto configurado
```

#### Opción B: Servidor Local (Desarrollo)

```bash
# 1. Levantar servidor local
cd apps/copilot
npm run dev  # Escucha en http://localhost:3210

# 2. Configurar para usar local
# Crear/editar apps/web/.env.local
NEXT_PUBLIC_CHAT=http://localhost:3210
```

---

### Solución 3: Configurar DNS para Apuntar a IP Específica

**Si tienes un servidor de test con IP específica**:

1. **Obtener IP del servidor de test**

2. **Ir a Cloudflare Dashboard**:
   - DNS → Records
   - Crear/Editar registro `chat-test`:
     ```
     Type: A
     Name: chat-test
     Target: IP_DEL_SERVIDOR_TEST
     Proxy: ✅ Proxied
     ```

3. **Asegurar que el servidor esté corriendo**:
   ```bash
   # En el servidor de test
   cd apps/copilot
   npm run dev
   ```

---

## 📋 Configuración Actual en Código

### Variable de Entorno

**Archivo**: `apps/web/.env.production`
```env
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

**Fallback en código**: `apps/web/components/Copilot/CopilotIframe.tsx`
```typescript
const fallback = 'https://chat-test.bodasdehoy.com';
```

---

## 🔍 Verificación Post-Configuración

### 1. Verificar DNS

```bash
# Verificar resolución DNS
dig chat-test.bodasdehoy.com +short
# Debería mostrar IP o CNAME

# Verificar desde navegador
# Abrir: https://chat-test.bodasdehoy.com
```

### 2. Verificar Servidor

```bash
# Si es servidor remoto, verificar que esté corriendo
ssh usuario@servidor-test
ps aux | grep next

# Verificar puerto
lsof -i :3210
```

### 3. Verificar HTTP

```bash
# Verificar respuesta HTTP
curl -I https://chat-test.bodasdehoy.com

# Debería dar 200 OK (no 502)
```

---

## 🎯 Recomendación

**Para desarrollo/testing rápido**: Usar **Solución 1** (CNAME a chat producción)

**Ventajas**:
- ✅ No requiere levantar otro servidor
- ✅ Funciona inmediatamente
- ✅ Mismo código que producción

**Desventajas**:
- ⚠️ Usa servidor de producción (no ideal para tests destructivos)

**Para entorno de test dedicado**: Usar **Solución 2** (Servidor separado)

**Ventajas**:
- ✅ Entorno aislado
- ✅ No afecta producción
- ✅ Puedes hacer tests sin miedo

**Desventajas**:
- ⚠️ Requiere mantener servidor corriendo
- ⚠️ Más recursos necesarios

---

## ✅ Checklist

- [ ] Decidir estrategia (CNAME a producción o servidor dedicado)
- [ ] Configurar DNS en Cloudflare
- [ ] Si servidor dedicado: Levantar servidor
- [ ] Verificar que DNS resuelve correctamente
- [ ] Verificar que servidor responde
- [ ] Probar acceso desde navegador
- [ ] Verificar que no da 502

---

**Estado**: ⚠️ `chat-test` necesita configuración - servidor o DNS
