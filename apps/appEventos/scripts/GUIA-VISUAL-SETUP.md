# 🎯 Guía Visual - Setup Tests Autónomos

## ✅ Se Abrió Firebase Console Automáticamente

Deberías ver la página de **Service Accounts** en tu navegador.

---

## 📋 Paso a Paso (2 minutos)

### 1️⃣ En Firebase Console (página que se abrió):

```
┌─────────────────────────────────────────────────┐
│  Firebase Console                               │
│  Project: bodasdehoy-1063                       │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  Service accounts                    │       │
│  │                                      │       │
│  │  Firebase Admin SDK                  │       │
│  │  ┌────────────────────────────────┐ │       │
│  │  │ [Generate new private key]     │ │  ← CLICK AQUÍ
│  │  └────────────────────────────────┘ │       │
│  └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

**Acción:** Click en **"Generate new private key"**

### 2️⃣ Confirmar descarga:

```
┌───────────────────────────────────────┐
│  Generate new private key?            │
│                                       │
│  This key will allow full access      │
│  to your Firebase project.            │
│                                       │
│  [ Cancel ]  [ Generate key ]         │  ← CLICK
└───────────────────────────────────────┘
```

**Acción:** Click en **"Generate key"**

**Resultado:** Se descarga un archivo JSON (ej: `bodasdehoy-1063-firebase-adminsdk-xxxxx.json`)

### 3️⃣ En tu terminal:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node configurar-env-firebase-admin.js
```

### 4️⃣ El script te preguntará:

```
🔧 Configurar Firebase Admin - Variables de Entorno

Opciones:

1. Pegar el contenido del JSON descargado de Firebase
2. Proporcionar la ruta al archivo JSON descargado  ← RECOMENDADO
3. Configurar manualmente las variables

Selecciona una opción (1-3):
```

**Acción:** Escribe **`2`** y presiona Enter

### 5️⃣ Proporciona la ruta al archivo:

```
📁 Ingresa la ruta completa al archivo JSON:
```

**Acción:** Arrastra el archivo JSON descargado a la terminal (o escribe la ruta):

```
/Users/tu-usuario/Downloads/bodasdehoy-1063-firebase-adminsdk-xxxxx.json
```

### 6️⃣ Confirmación:

```
✅ JSON válido encontrado:
   Project ID: bodasdehoy-1063
   Client Email: firebase-adminsdk-xxxxx@bodasdehoy-1063.iam.gserviceaccount.com

✅ Variables de entorno configuradas exitosamente!
   Archivo: /Users/.../apps/web/.env.local
```

---

## 🧪 Verificar que Funciona

### 1. Inicia el servidor dev:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web
npm run dev
```

**Espera a ver:**
```
✓ Ready in X.Xs
○ Local: http://localhost:3000
```

### 2. En OTRA terminal, prueba el endpoint:

```bash
curl -X POST http://localhost:3000/api/testing/generate-auth-token \
  -H "Content-Type: application/json" \
  -d '{"userId": "upSETrmXc7ZnsIhrjDjbHd7u2up1"}'
```

**Deberías ver:**
```json
{
  "success": true,
  "customToken": "eyJhbGci...",
  "user": {
    "uid": "upSETrmXc7ZnsIhrjDjbHd7u2up1",
    "email": "bodasdehoy.com@gmail.com",
    "displayName": "Bodas de Hoy"
  },
  "expiresIn": 3600
}
```

### 3. Si ves eso, ejecuta el test autónomo:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node test-copilot-autonomo.js
```

**El test se ejecutará COMPLETAMENTE SOLO:**
- ✅ Genera token
- ✅ Abre Firefox
- ✅ Autentica automáticamente
- ✅ Abre Copilot
- ✅ Ejecuta 3 preguntas
- ✅ Captura screenshots

**Duración:** ~5 minutos (sin intervención manual)

---

## ❓ Troubleshooting

### Error: "Firebase Admin credentials not configured"

**Problema:** Las variables no se guardaron correctamente

**Solución:**
```bash
# Verificar que las variables existen
cat /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/.env.local | grep FIREBASE_ADMIN

# Si no aparecen, ejecuta de nuevo:
node scripts/configurar-env-firebase-admin.js
```

### Error: "Not available in production"

**Problema:** El servidor está en modo production

**Solución:**
```bash
# Verificar NODE_ENV
echo $NODE_ENV

# Debe ser vacío o 'development'
# Si es 'production', cámbialo:
unset NODE_ENV
```

### Archivo JSON no encontrado

**Problema:** La ruta al archivo JSON es incorrecta

**Solución:**
- Arrastra el archivo a la terminal en lugar de escribir la ruta
- O usa la opción 1 (pegar contenido) del script

---

## 🎉 ¡Listo!

Una vez configurado, puedes ejecutar tests **infinitas veces** con:

```bash
node test-copilot-autonomo.js
```

**SIN:**
- ❌ Copiar cookies
- ❌ Abrir DevTools
- ❌ Preocuparte por expiración
- ❌ NINGUNA intervención manual

**Tiempo total de setup:** 2 minutos (una sola vez)
**Tiempo de ejecución de cada test:** 0 minutos de setup + 5 minutos automáticos
