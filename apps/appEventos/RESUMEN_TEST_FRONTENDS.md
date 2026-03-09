# 📊 Resumen de Tests de Frontends

## 🔍 Estado Actual de los Dominios de Desarrollo

### ❌ Dominios No Resueltos

**chat-test.bodasdehoy.com:**
- ❌ Error DNS: `Could not resolve host: chat-test.bodasdehoy.com`
- ❌ En navegador: Error 502 Bad Gateway (Cloudflare responde pero no puede conectar con origen)
- **Causa**: El dominio no está configurado en DNS o el servidor de origen no está corriendo

**app-test.bodasdehoy.com:**
- ❌ Error DNS: `Could not resolve host: app-test.bodasdehoy.com`
- ❌ En navegador: Error 502 Bad Gateway
- **Causa**: El dominio no está configurado en DNS o el servidor de origen no está corriendo

## ✅ Configuración del Código

### Variables de Entorno (`.env.local`)

```env
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com ✅
NEXT_PUBLIC_DIRECTORY=https://app-test.bodasdehoy.com ✅
```

### Código Actualizado

✅ **AuthContext.tsx**: Reconoce `app-test.bodasdehoy.com` en debugHosts y isTestEnv
✅ **EventsGroupContext.tsx**: Reconoce `app-test` en isTestEnv
✅ **refresh-session.ts**: Reconoce `app-test` en isDevOrTest
✅ **bypass.ts**: Reconoce `app-test` en isDevOrTest
✅ **urlHelpers.ts**: Ya incluía `app-test` en la lista de subdominios de test

## 🚀 Próximos Pasos para Probar los Frontends

### Opción 1: Configurar DNS en Cloudflare

Para que los dominios funcionen, necesitas:

1. **Ir a Cloudflare Dashboard**
   - https://dash.cloudflare.com
   - Seleccionar dominio: `bodasdehoy.com`

2. **Crear registro DNS para chat-test:**
   ```
   Type: CNAME o A
   Name: chat-test
   Target: [IP del servidor de origen o chat.bodasdehoy.com]
   Proxy: ✅ Proxied (nube naranja)
   ```

3. **Crear registro DNS para app-test:**
   ```
   Type: CNAME o A
   Name: app-test
   Target: [IP del servidor de origen o bodasdehoy.com]
   Proxy: ✅ Proxied (nube naranja)
   ```

4. **Esperar propagación DNS** (5-10 minutos)

### Opción 2: Probar Localmente

Para probar el frontend sin los dominios:

1. **Levantar servidor local:**
   ```bash
   cd apps/web
   npm run dev
   # O con puerto alternativo:
   PORT=3001 npm run dev
   ```

2. **Abrir en navegador:**
   ```
   http://127.0.0.1:8080
   # O
   http://127.0.0.1:3001
   ```

3. **Verificar en consola del navegador (F12):**
   - ✅ ¿Carga la página?
   - ✅ ¿Hay errores?
   - ⚠️ El chat usará `chat-test.bodasdehoy.com` (dará 502 si no está configurado)

### Opción 3: Usar Producción Temporalmente

Si necesitas probar inmediatamente, puedes cambiar temporalmente:

```env
# En .env.local (solo para testing)
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
NEXT_PUBLIC_DIRECTORY=https://bodasdehoy.com
```

## 📋 Checklist de Verificación

- [x] ✅ Código actualizado para reconocer `app-test.bodasdehoy.com`
- [x] ✅ Variables de entorno configuradas correctamente
- [ ] ⚠️ DNS configurado en Cloudflare para `chat-test.bodasdehoy.com`
- [ ] ⚠️ DNS configurado en Cloudflare para `app-test.bodasdehoy.com`
- [ ] ⚠️ Servidor de origen corriendo y accesible
- [ ] ⚠️ Cloudflare proxy configurado correctamente

## 🔧 Comandos Útiles para Verificar

```bash
# Verificar DNS (desde otra red o servicio online)
nslookup chat-test.bodasdehoy.com
nslookup app-test.bodasdehoy.com

# Verificar desde navegador
# https://www.whatsmydns.net/#A/chat-test.bodasdehoy.com
# https://www.whatsmydns.net/#A/app-test.bodasdehoy.com

# Verificar respuesta HTTP
curl -I https://chat-test.bodasdehoy.com
curl -I https://app-test.bodasdehoy.com
```

## 📝 Notas

- El código está **correctamente configurado** para usar los dominios de desarrollo
- El problema actual es de **infraestructura (DNS/servidor)**, no del código
- Una vez configurados los DNS, los frontends deberían funcionar correctamente
- El código ya maneja correctamente los entornos de test (`chat-test` y `app-test`)
