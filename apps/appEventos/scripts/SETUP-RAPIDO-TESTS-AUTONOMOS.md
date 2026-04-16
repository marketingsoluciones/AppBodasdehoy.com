# ⚡ Setup Rápido - Tests Autónomos (5 minutos)

## 🎯 Objetivo

Configurar tests **100% automatizados** del Copilot **SIN cookies manuales**.

---

## 📋 Pasos

### 1. Obtener Credenciales de Firebase Admin (3 minutos)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona proyecto: **bodasdehoy-1063**
3. Click en ⚙️ (Settings) → **Project settings**
4. Pestaña **Service Accounts**
5. Click botón **Generate new private key**
6. Se descarga un archivo JSON

### 2. Configurar Variables de Entorno (2 minutos)

Edita `.env.local` en la raíz del proyecto:

```bash
# Abrir/crear .env.local
code /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/.env.local
```

Agrega estas líneas (usando valores del JSON descargado):

```bash
# Firebase Admin SDK - Para tests automatizados
FIREBASE_ADMIN_PROJECT_ID=bodasdehoy-1063
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bodasdehoy-1063.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANTE:**
- La private key debe estar entre comillas dobles
- Mantener los `\n` literales (no reemplazar por saltos de línea reales)

### 3. Verificar Setup (30 segundos)

```bash
# Iniciar servidor dev
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web
npm run dev

# En otra terminal, probar endpoint
curl -X POST http://localhost:3000/api/testing/generate-auth-token \
  -H "Content-Type: application/json" \
  -d '{"userId": "upSETrmXc7ZnsIhrjDjbHd7u2up1"}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "customToken": "eyJhbGci...",
  "user": {
    "uid": "upSETrmXc7ZnsIhrjDjbHd7u2up1",
    "email": "bodasdehoy.com@gmail.com"
  }
}
```

### 4. Ejecutar Test Autónomo (0 minutos de setup)

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node test-copilot-autonomo.js
```

**Proceso automático (sin intervención):**
1. ✅ Genera token de autenticación
2. ✅ Abre Firefox
3. ✅ Autentica automáticamente
4. ✅ Abre Copilot
5. ✅ Ejecuta 3 preguntas
6. ✅ Captura screenshots

**Duración total:** ~5 minutos (totalmente automático)

---

## ✅ Resultado

Ahora puedes ejecutar tests **infinitas veces** sin:
- ❌ Copiar cookies manualmente
- ❌ Preocuparte por expiración (5 min)
- ❌ Abrir DevTools
- ❌ Pegar JSON en archivos

Solo ejecutas:
```bash
node test-copilot-autonomo.js
```

Y el test se ejecuta **completamente solo**.

---

## 🔍 Troubleshooting

### Error: "Firebase Admin credentials not configured"

**Problema:** Variables de entorno no están configuradas

**Solución:**
```bash
# Verificar que las variables existen
cat .env.local | grep FIREBASE_ADMIN

# Si no aparecen, repetir Paso 2
```

### Error: "ECONNREFUSED localhost:3000"

**Problema:** Servidor dev no está corriendo

**Solución:**
```bash
# Iniciar servidor en otra terminal
npm run dev
```

### Endpoint retorna 403

**Problema:** Estás en producción

**Solución:** El endpoint solo funciona en desarrollo. Asegúrate de que `NODE_ENV !== 'production'`

---

## 📚 Documentación Completa

Ver: [`SISTEMA-TESTS-AUTONOMOS.md`](./SISTEMA-TESTS-AUTONOMOS.md)

---

**Total de tiempo:** ⏱️ 5 minutos setup (una sola vez) → ∞ tests automáticos
