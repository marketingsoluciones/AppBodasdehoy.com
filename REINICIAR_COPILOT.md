# 🔄 Cómo Reiniciar el Copilot Correctamente

## ⚠️ Problema Actual

Los servidores están detenidos después de limpiar el conflicto de puertos.

---

## ✅ Solución: Reiniciar Todo Limpiamente

### Paso 1: Abrir Terminal

Abre una terminal en el directorio del proyecto:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
```

### Paso 2: Reiniciar Ambos Servidores

Ejecuta este comando para iniciar apps/web (8080) y apps/copilot (3210):

```bash
pnpm dev
```

Este comando iniciará:
- ✅ `apps/web` en http://localhost:8080
- ✅ `apps/copilot` en http://localhost:3210

### Paso 3: Esperar a que Compile

Verás algo como esto:

```
 ✓ Ready in 5s
  ○ Local:        http://localhost:8080
  ○ Local:        http://localhost:3210
```

### Paso 4: Verificar que Funcionen

Abre ambos en tu navegador:

```bash
# Opción A: Manualmente
# Abre: http://localhost:8080
# Abre: http://localhost:3210

# Opción B: Desde terminal
open http://localhost:8080
open http://localhost:3210
```

---

## 🎯 URLs Finales

### Para Chat Básico (sin editor avanzado):
```
http://localhost:8080
```
→ Click en botón "Copilot" del header

### Para Editor Completo (CON todos los íconos): ⭐
```
http://localhost:3210
```
→ Este es el que tiene el toolbar completo

---

## 🔍 Verificar que Todo Funciona

### Checklist:

1. [ ] Servidor `apps/web` corriendo en puerto 8080
2. [ ] Servidor `apps/copilot` corriendo en puerto 3210
3. [ ] http://localhost:8080 carga correctamente
4. [ ] http://localhost:3210 carga correctamente
5. [ ] http://localhost:3210 muestra el editor con íconos

---

## 🐛 Si Algo Falla

### Problema: "Address already in use"

**Solución**:
```bash
# Matar procesos en ambos puertos
lsof -ti:8080,3210 | xargs kill -9

# Reintentar
pnpm dev
```

### Problema: "Module not found"

**Solución**:
```bash
# Reinstalar dependencias
pnpm install

# Reintentar
pnpm dev
```

### Problema: Puerto 3210 tarda mucho

**Causa**: Todavía hay conflicto de puertos

**Solución**:
```bash
# Verificar qué está usando el puerto
lsof -i:3210

# Matar todos los procesos
lsof -ti:3210 | xargs kill -9

# Limpiar cache de Next.js
rm -rf apps/copilot/.next
rm -rf apps/web/.next

# Reiniciar
pnpm dev
```

---

## 📊 Diferencias Entre las Versiones

### Puerto 8080 (apps/web)
- Chat básico
- Sin toolbar de formato
- Sin íconos de bold, italic, etc.
- **Rápido** ⚡

### Puerto 3210 (apps/copilot)
- LobeChat completo
- **CON toolbar de formato**
- **CON íconos** (bold, italic, links, code, etc.)
- **CON slash commands** (escribe `/`)
- **CON @ mentions**
- **Todos los plugins** activos

---

## 🎯 Resumen de URLs

| Versión | URL | Tiene Editor Avanzado |
|---------|-----|-----------------------|
| Sidebar Básico | http://localhost:8080 + botón "Copilot" | ❌ NO |
| Split-View | http://localhost:8080/copilot | ❌ NO |
| **LobeChat Completo** | **http://localhost:3210** | ✅ **SÍ** |

---

**Siguiente paso**: Ejecuta `pnpm dev` y abre http://localhost:3210 para ver el editor completo.
