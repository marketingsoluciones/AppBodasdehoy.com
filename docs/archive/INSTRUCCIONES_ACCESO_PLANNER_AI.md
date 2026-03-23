# 🚀 Cómo Acceder a PLANNER AI

**Fecha**: 2026-02-09 23:59
**Status**: ✅ SERVIDOR FUNCIONANDO

---

## 📍 URLs Activas

### PLANNER AI (Standalone):
```
http://localhost:3210
```

### AppBodasdeHoy (con Copilot integrado):
```
http://localhost:8080
```

---

## ⚠️ IMPORTANTE: Primera Carga

### La primera vez que abres PLANNER AI:
- ⏱️ **Tardará ~1 minuto** en cargar
- 🔄 Next.js está compilando todo el código
- ⚡ **Espera pacientemente** - NO recargues la página

### Cargas subsecuentes:
- ⚡ **Serán instantáneas** (~1-2 segundos)
- 💾 El código ya está compilado y en cache

---

## 📝 Pasos para Acceder

### Opción 1: PLANNER AI Standalone (Recomendado para pruebas)

1. **Abre tu navegador** (Chrome, Firefox, Safari, etc.)

2. **Ve a la URL**:
   ```
   http://localhost:3210
   ```

3. **Espera 60 segundos** en la primera carga
   - Verás una pantalla en blanco o de carga
   - NO cierres ni recargues
   - Es normal, Next.js está compilando

4. **La página cargará**:
   - Verás la interfaz completa de PLANNER AI
   - Título: "Bodas de Hoy: Your personal AI productivity tool"
   - Chat completo con todas las funcionalidades

### Opción 2: AppBodasdeHoy con Copilot Integrado

1. **Abre tu navegador**

2. **Ve a la URL**:
   ```
   http://localhost:8080
   ```

3. **Haz login** (si no has iniciado sesión)

4. **Click en el botón "Copilot"** (esquina superior derecha)

5. **Se abre el sidebar** con PLANNER AI en iframe

---

## 🛠️ Estado del Servidor

### Servidor activo con:
- ✅ Puerto: 3210
- ✅ Memoria: 6GB asignados
- ✅ Telemetría: Desactivada (menor consumo)
- ✅ Backend: api-ia.bodasdehoy.com
- ✅ HTTP Status: 200 OK

### Configuración optimizada:
```bash
# En .env.development.local
ENABLE_TELEMETRY=false
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=6144
```

---

## 🎯 Funcionalidades Disponibles

Una vez que cargue, tendrás acceso a:

### 1. Memories (Momentos)
- Crear álbumes colaborativos
- Subir/compartir fotos
- Vincular con eventos
- QR codes y links públicos

### 2. Creador de Web (Artifacts)
- HTML + CSS + JS
- React components
- SVG graphics
- Mermaid diagrams

### 3. Code Interpreter
- Python en el navegador
- Análisis de datos
- Visualizaciones

### 4. DALL-E 3
- Generación de imágenes AI
- Múltiples estilos

### 5. Web Browsing
- Búsqueda en internet
- Extracción de información

### 6. Firebase Auth
- Login con Google
- Login con Facebook

### 7. Knowledge Base
- Subir documentos
- RAG (Retrieval Augmented Generation)

---

## ⏱️ Tiempos de Carga Esperados

| Carga | Tiempo | Razón |
|-------|--------|-------|
| **Primera vez** | ~60 segundos | Compilación inicial de Next.js |
| **Segunda vez** | ~2-5 segundos | Código ya compilado |
| **Tercera y siguientes** | ~1-2 segundos | Cache completo |

---

## 🔧 Si el servidor no responde

### 1. Verificar que está corriendo:
```bash
lsof -ti:3210
```
Si devuelve un número (PID), está corriendo ✅

### 2. Reiniciar el servidor:
```bash
# Desde: /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot
kill $(lsof -ti:3210)
pnpm dev
```

### 3. Ver los logs:
```bash
tail -f /private/tmp/claude/.../b5b7242.output
```

---

## ✅ TODO CONFIGURADO Y FUNCIONANDO

- ✅ Servidor: Corriendo
- ✅ Puerto: 3210 activo
- ✅ Backend: Conectado a api-ia.bodasdehoy.com
- ✅ Funcionalidades: Todas disponibles
- ✅ Optimización: Telemetría desactivada, 6GB RAM

**Solo abre http://localhost:3210 en tu navegador y espera 1 minuto la primera vez.**

Después de eso, funcionará perfectamente rápido. 🚀
