# 📊 Análisis de Espacio y Optimización del Proyecto

## 📈 Resumen del Uso de Espacio Actual

| Directorio/Archivo | Tamaño | Porcentaje | Acción Recomendada |
|-------------------|--------|------------|-------------------|
| **Total del Proyecto** | **15GB** | 100% | - |
| `apps/copilot/node_modules` | 10GB | 66.7% | ⚠️ Limpiar y optimizar |
| `.next` (build) | 1.1GB | 7.3% | ✅ Puede limpiarse |
| `.vercel/output` | ~500MB+ | ~3.3% | ✅ Limpiar (generado automáticamente) |
| `.git` | 106MB | 0.7% | ✅ Normal |
| `.screenshots` | 16MB | 0.1% | ⚠️ Revisar si es necesario |

---

## 🔍 Análisis: ¿Por qué tantas "extensiones"/dependencias?

### 1. **Dependencias del Proyecto (No extensiones de Cursor)**

Tu proyecto tiene **más de 200 dependencias** principales en `package.json`, lo que es normal para proyectos modernos de Next.js con:
- ✅ **Frameworks y librerías**: Next.js, React, TypeScript
- ✅ **UI y componentes**: Ant Design, LobeHub UI, Framer Motion
- ✅ **IA y ML**: OpenAI SDK, Anthropic SDK, LangChain, HuggingFace
- ✅ **Bases de datos**: Drizzle ORM, PostgreSQL, PGLite
- ✅ **Autenticación**: NextAuth, Clerk
- ✅ **Herramientas de desarrollo**: ESLint, Prettier, Vitest, Playwright

**Esto NO son extensiones de Cursor**, son dependencias necesarias para tu aplicación.

### 2. **Extensiones de Cursor/VS Code**

Si te refieres a extensiones instaladas en Cursor:
- Las extensiones se guardan en `~/.cursor/extensions` (fuera del proyecto)
- Cada extensión puede ocupar desde KB hasta MB
- Es normal tener 20-50 extensiones instaladas

**⚠️ IMPORTANTE**: No puedo ver directamente tus extensiones instaladas, pero he creado scripts para que las puedas revisar tú mismo:

---

## 🧹 Recomendaciones para Liberar Espacio

### ✅ **Limpieza Inmediata (Espacio Recuperable: ~1.5GB+)**

#### 1. Limpiar archivos de build y caché
```bash
# Limpiar directorio .next
rm -rf apps/copilot/.next

# Limpiar builds de Vercel
rm -rf apps/copilot/.vercel/output

# Limpiar cachés
rm -rf .cache
rm -rf apps/copilot/.cache
find . -name "*.tsbuildinfo" -delete
```

#### 2. Limpiar archivos temporales
```bash
# Eliminar logs
find . -name "*.log" -delete

# Eliminar archivos de screenshot si no son necesarios
rm -rf .screenshots
```

### 🔄 **Optimización de Node Modules (Espacio Recuperable: 2-3GB)**

#### Opción 1: Limpieza completa y reinstalación
```bash
# Usando el script del proyecto
npm run clean:node_modules

# Reinstalar solo las dependencias necesarias
pnpm install
```

#### Opción 2: Usar PNPM con store global
PNPM ya usa un store global por defecto, pero puedes verificar:
```bash
# Ver configuración del store
pnpm store path

# Limpiar store (CUIDADO: afecta todos los proyectos)
pnpm store prune
```

#### Opción 3: Eliminar dependencias no utilizadas
```bash
# Instalar herramienta para detectar dependencias no usadas
pnpm add -D depcheck

# Ejecutar análisis
npx depcheck
```

### 📦 **Optimización de Git**

#### Limpiar archivos grandes del historial (si aplica)
```bash
# Ver archivos grandes en el historial
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {print substr($0,6)}' | sort --numeric-sort --key=2 | \
  tail -20 | cut -c 1-12,41- | $(command -v gnumfmt || echo numfmt) --field=2 --to=iec-i --suffix=B --padding=7 --round=nearest
```

---

## 🎯 Optimización de Cursor/VS Code

### 1. **Revisar Extensiones Instaladas**

#### Ver extensiones instaladas:
```bash
# Listar todas las extensiones de Cursor
code --list-extensions --show-versions
```

#### Extensiones que suelen ocupar mucho espacio:
- **Language servers** (TypeScript, Python, etc.): 50-200MB cada uno
- **Extensiones de AI**: 100-300MB
- **Extensiones de tema con assets**: 10-50MB

#### Recomendaciones:
- ⚠️ Desinstala extensiones que no uses
- ✅ Mantén solo las extensiones esenciales para tu stack
- ✅ Usa extensiones ligeras cuando sea posible

### 2. **Configurar Workspace Settings**

Crear `.vscode/settings.json` para optimizar el rendimiento:

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/.vercel/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/.vercel": true,
    "**/dist": true,
    "**/build": true
  },
  "files.exclude": {
    "**/.next": false,
    "**/node_modules": false
  }
}
```

### 3. **Deshabilitar Indexación de Archivos Grandes**

Si Cursor indexa demasiados archivos:
- Excluir `node_modules` del indexado (ya está por defecto)
- Excluir archivos de build como `.next`, `.vercel`

---

## 🔍 Scripts para Analizar Extensiones de Cursor

### Ver extensiones instaladas
```bash
./scripts/analizar-extensiones-cursor.sh
```
Este script muestra:
- Lista de todas las extensiones instaladas con versiones
- Total de extensiones
- Tamaño del directorio de extensiones

### Analizar tamaño de extensiones
```bash
./scripts/analizar-tamano-extensiones.sh
```
Este script muestra:
- Tamaño total de todas las extensiones
- Top 10 extensiones más grandes
- Extensiones que ocupan más de 50MB

---

## 🚀 Script de Limpieza Automática

Script para limpieza periódica (ya creado):

```bash
# Ejecutar el script de limpieza (ya creado en scripts/cleanup.sh)
./scripts/cleanup.sh
```

El script limpia:
- Directorios `.next` (builds)
- Directorios `.vercel/output` (builds de Vercel)
- Archivos `.log` (logs)
- Archivos `.tsbuildinfo` (caché de TypeScript)
- Directorios `.cache`
- Directorios `.screenshots`

---

## 📋 Checklist de Optimización

### Espacio del Proyecto
- [ ] Limpiar `.next` y `.vercel/output` (~1.5GB)
- [ ] Eliminar logs y archivos temporales (~50MB)
- [ ] Revisar y eliminar `.screenshots` si no es necesario (16MB)
- [ ] Optimizar `node_modules` con `pnpm store prune` (si es seguro)
- [ ] Verificar archivos grandes en Git

### Configuración de Cursor
- [ ] **Revisar extensiones instaladas** (ejecutar script: `./scripts/analizar-extensiones-cursor.sh`)
- [ ] **Ver tamaño de extensiones** (ejecutar script: `./scripts/analizar-tamano-extensiones.sh`)
- [ ] Desinstalar extensiones no utilizadas
- [ ] Crear `.vscode/settings.json` con exclusiones ✅ (Ya creado)
- [ ] Configurar files.watcherExclude ✅ (Ya configurado)

### Mantenimiento Continuo
- [ ] Ejecutar script de limpieza semanalmente
- [ ] Revisar dependencias no utilizadas con `depcheck`
- [ ] Actualizar dependencias regularmente

---

## 📊 Espacio Esperado Después de Optimización

| Estado | Espacio | Ahorro |
|--------|---------|--------|
| **Actual** | 15GB | - |
| **Después de limpieza** | ~13GB | ~2GB |
| **Después de optimización completa** | ~12GB | ~3GB |

**Nota**: Los `node_modules` seguirán ocupando ~10GB porque son dependencias necesarias del proyecto.

---

## ⚠️ Importante

- **NO elimines** `node_modules` permanentemente - son necesarios para el proyecto
- **SÍ puedes limpiar** `.next` - se regenera con `npm run build` o `npm run dev`
- **SÍ puedes limpiar** `.vercel/output` - se regenera automáticamente en deploy
- **Revisa** antes de eliminar cualquier archivo si no estás seguro

---

## 🎓 Conclusión

El proyecto ocupa **15GB** principalmente por:
1. **10GB de `node_modules`**: Normal para proyectos Next.js modernos con IA
2. **1.1GB de builds (`.next`)**: Puede limpiarse regularmente
3. **~500MB de builds de Vercel**: Puede limpiarse

**Las "extensiones" que mencionas probablemente son:**
- ✅ Dependencias del proyecto (necesarias)
- ⚠️ Builds y cachés (se pueden limpiar)
- ⚠️ Extensiones de Cursor instaladas (revisar si hay muchas no usadas)

**Espacio recuperable inmediato: ~1.5-2GB**
**Espacio recuperable con optimización: ~2-3GB**
