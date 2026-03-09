# 🔗 URLs para Verificación del Sistema

## 📍 URLs del Servicio Principal

### Desarrollo Local
- **Frontend Web**: `http://127.0.0.1:8080` o `http://localhost:8080`
- **API de Verificación**: `http://127.0.0.1:8080/api/verify-urls`
- **Health Check**: `http://127.0.0.1:8080/`
- **Login**: `http://127.0.0.1:8080/login`

### Producción/Test
- **Chat Test**: `https://chat-test.bodasdehoy.com`
- **Chat Producción**: `https://chat.bodasdehoy.com`
- **Web Principal**: `https://bodasdehoy.com`
- **Organizador**: `https://organizador.bodasdehoy.com`

---

## 🔌 URLs de Backend y APIs

### APIs Principales
- **API Base (GraphQL)**: `https://apiapp.bodasdehoy.com`
- **API Bodas**: `https://api.bodasdehoy.com`
- **API GraphQL Proxy**: `http://127.0.0.1:8080/api/graphql/*` → `https://apiapp.bodasdehoy.com/*`

### WebSocket
- **Socket API**: `ws://45.55.44.46:80/subscriptions`
- **Socket API (Bodas)**: Configurado desde `NEXT_PUBLIC_BASE_API_BODAS`

---

## 🎨 URLs de Servicios

### CMS y Administración
- **CMS**: `https://cms.bodasdehoy.com`
- **CMS Test**: `https://test.cms.bodasdehoy.com` (si existe)
- **Custom Web**: `https://web.bodasdehoy.com/`

### Copilot/Chat
- **Copilot Chat (Producción)**: `https://chat.bodasdehoy.com`
- **Copilot Chat (Test)**: `https://chat-test.bodasdehoy.com`
- **Copilot Chat (Local)**: `http://localhost:3210` (si está corriendo)
- **Copilot Proxy**: `http://127.0.0.1:8080/copilot-chat/*` → `https://chat.bodasdehoy.com/*`

---

## 🧪 Endpoints de Verificación y Testing

### Verificación de URLs
- **Verificar todas las URLs**: `GET http://127.0.0.1:8080/api/verify-urls`
  ```bash
  curl http://127.0.0.1:8080/api/verify-urls
  ```

### APIs de Desarrollo
- **Refresh Session (Dev)**: `POST http://127.0.0.1:8080/api/dev/refresh-session`
- **Bypass (Dev)**: `POST http://127.0.0.1:8080/api/dev/bypass`
- **Login Rápido**: `http://127.0.0.1:8080/login-rapido`

### Proxy
- **Proxy API**: `http://127.0.0.1:8080/api/proxy/*` → `https://apiapp.bodasdehoy.com/*`

---

## 📄 Páginas Principales de la Aplicación

### Autenticación
- **Login**: `/login`
- **Registro**: `/login?q=register`
- **Reset Password**: `/login?q=resetPassword`

### Funcionalidades Principales
- **Home/Dashboard**: `/`
- **Eventos**: `/eventos`
- **Invitaciones**: `/invitaciones`
- **Invitados**: `/invitados`
- **Mesas**: `/mesas`
- **Itinerario**: `/itinerario`
- **Presupuesto**: `/presupuesto`
- **Facturación**: `/facturacion`
- **Lista de Regalos**: `/lista-regalos`
- **Resumen Evento**: `/resumen-evento`
- **Configuración**: `/configuracion`
- **Perfil**: `/perfil`

### Páginas Públicas
- **Info App**: `/info-app`
- **Confirmar Asistencia**: `/confirmar-asistencia`
- **Tarjeta Pública**: `/public-card/[...slug]`
- **Itinerario Público**: `/public-itinerary/[...slug]`

### Relaciones Públicas
- **RRPP Principal**: `/RelacionesPublicas`
- **Ventas Entradas**: `/RelacionesPublicas/VentasEntradas`
- **Entradas Gratis**: `/RelacionesPublicas/EntradasGratis`
- **Registro Usuario**: `/RelacionesPublicas/RegistroEntradasUser`
- **Recuperar Compra**: `/RelacionesPublicas/RecuperarCompra`
- **Recibo Entradas**: `/RelacionesPublicas/ReciboEntradas`

---

## 🔍 URLs para Verificar Conectividad

### Backend APIs (Verificar que respondan)
```bash
# API Principal
curl -I https://apiapp.bodasdehoy.com

# API Bodas
curl -I https://api.bodasdehoy.com

# CMS
curl -I https://cms.bodasdehoy.com

# Chat Producción
curl -I https://chat.bodasdehoy.com

# Chat Test
curl -I https://chat-test.bodasdehoy.com
```

### Verificación desde el Navegador
1. Abre la consola del navegador (F12)
2. Ve a `http://127.0.0.1:8080` (o el puerto configurado)
3. En la consola verás automáticamente:
   - Información del dominio
   - Estado de las URLs críticas
   - Resultados de verificación

### Verificación Manual en Consola
```javascript
// En la consola del navegador
import { verifyDomain, checkUrl, verifyAllUrls } from './utils/verifyUrls';

// Ver información del dominio actual
console.log(verifyDomain());

// Verificar una URL específica
checkUrl('https://apiapp.bodasdehoy.com').then(console.log);

// Verificar todas las URLs
verifyAllUrls().then(console.log);
```

---

## 🚨 URLs Críticas para el 502

Si estás viendo error 502, verifica estas URLs en orden:

1. **Origen del servicio**:
   - `https://chat-test.bodasdehoy.com` (o el dominio que estés usando)

2. **Backend APIs**:
   - `https://apiapp.bodasdehoy.com/graphql`
   - `https://api.bodasdehoy.com`

3. **Cloudflare** (si aplica):
   - Verifica en el dashboard de Cloudflare el estado del origen

4. **Health Check del Servidor**:
   - `http://127.0.0.1:8080/` (si está corriendo localmente)
   - `https://chat-test.bodasdehoy.com/` (en producción)

---

## 📝 Checklist de Verificación

### ✅ Verificar que el Servicio Esté Corriendo
- [ ] Servidor local responde en `http://127.0.0.1:8080`
- [ ] Endpoint `/api/verify-urls` funciona
- [ ] Página principal carga sin errores

### ✅ Verificar Backend APIs
- [ ] `https://apiapp.bodasdehoy.com` responde (200 o 404, no 502)
- [ ] `https://api.bodasdehoy.com` responde
- [ ] GraphQL endpoint funciona

### ✅ Verificar Servicios Externos
- [ ] `https://cms.bodasdehoy.com` accesible
- [ ] `https://chat.bodasdehoy.com` accesible
- [ ] `https://chat-test.bodasdehoy.com` accesible (si es test)

### ✅ Verificar Dominio y Configuración
- [ ] Dominio detectado correctamente
- [ ] Variables de entorno cargadas
- [ ] Cookies configuradas con el dominio correcto

---

## 🛠️ Comandos Útiles

### Verificar desde Terminal
```bash
# Verificar que el servidor está corriendo
curl -I http://127.0.0.1:8080/

# Verificar endpoint de URLs
curl http://127.0.0.1:8080/api/verify-urls | jq

# Verificar backend API
curl -I https://apiapp.bodasdehoy.com

# Verificar con timeout
curl --max-time 5 https://chat-test.bodasdehoy.com
```

### Ver Logs del Servidor
```bash
# Si está corriendo en background, ver logs
tail -f ~/.cursor/projects/.../terminals/*.txt
```

---

## 📌 Notas Importantes

1. **Puerto Configurado**: Actualmente `8080` (puede cambiar según tu configuración)
2. **Host**: `127.0.0.1` (IPv4) para evitar problemas de permisos
3. **Verificación Automática**: Se ejecuta solo en desarrollo
4. **VPN**: Si usas VPN y ves 502, prueba desactivarla

---

## 🔗 URLs de Documentación

- **Análisis 502 + VPN**: `docs/ANALISIS-502-VPN.md`
- **Instrucciones Servicio**: `INSTRUCCIONES_LEVANTAR_SERVICIO.md`
- **Verificación Servicio**: `VERIFICACION_SERVICIO.md`
