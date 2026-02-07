# 🚀 URLs Rápidas para Verificación

## 📍 Servicio Local (Desarrollo)

```
http://127.0.0.1:8080/
http://127.0.0.1:8080/login
http://127.0.0.1:8080/api/verify-urls
```

## 🔌 Backend APIs (Verificar que Respondan)

```
https://apiapp.bodasdehoy.com
https://api.bodasdehoy.com
https://cms.bodasdehoy.com
https://chat.bodasdehoy.com
https://chat-test.bodasdehoy.com
https://bodasdehoy.com
https://organizador.bodasdehoy.com
https://web.bodasdehoy.com
```

## 🧪 Verificación Rápida desde Terminal

```bash
# Verificar que el servidor local responde
curl -I http://127.0.0.1:8080/

# Verificar todas las URLs configuradas
curl http://127.0.0.1:8080/api/verify-urls

# Verificar backend API principal
curl -I https://apiapp.bodasdehoy.com

# Verificar API Bodas
curl -I https://api.bodasdehoy.com

# Verificar Chat Test (el que da 502)
curl -I https://chat-test.bodasdehoy.com
```

## 📋 Páginas Principales para Probar

```
http://127.0.0.1:8080/                    # Home
http://127.0.0.1:8080/login               # Login
http://127.0.0.1:8080/eventos             # Eventos
http://127.0.0.1:8080/invitaciones        # Invitaciones
http://127.0.0.1:8080/invitados           # Invitados
http://127.0.0.1:8080/mesas                # Mesas
http://127.0.0.1:8080/itinerario          # Itinerario
http://127.0.0.1:8080/presupuesto         # Presupuesto
http://127.0.0.1:8080/facturacion         # Facturación
http://127.0.0.1:8080/configuracion       # Configuración
```

## 🔍 Verificación en el Navegador

1. Abre: `http://127.0.0.1:8080`
2. Presiona F12 (Consola)
3. Verás automáticamente la verificación de URLs y dominio

## ⚠️ Si Ves Error 502

Verifica en este orden:

1. **Origen del servicio**:
   ```
   https://chat-test.bodasdehoy.com
   ```

2. **Backend APIs**:
   ```
   https://apiapp.bodasdehoy.com/graphql
   https://api.bodasdehoy.com
   ```

3. **Cloudflare Dashboard**: 
   - Verifica el estado del origen en Cloudflare

4. **Si usas VPN**: 
   - Prueba desactivarla y recargar
