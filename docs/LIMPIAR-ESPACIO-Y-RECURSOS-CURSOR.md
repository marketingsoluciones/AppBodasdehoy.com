# Liberar espacio y recursos (Cursor y proyecto)

Cursor y el monorepo pueden consumir mucho disco y RAM. Aquí tienes pasos seguros para aligerar.

---

## Liberar memoria y recursos ahora (pasos concretos)

1. **En Cursor:** cierra pestañas y archivos que no uses → libera RAM.
2. **Proyecto (disco):** en Terminal: `./scripts/cleanup.sh` → borra .next, logs, .cache (cientos de MB–GB).
3. **Store pnpm:** en Terminal: `pnpm store prune` → libera disco del caché global.
4. **Caché de Cursor:** cierra Cursor por completo (Cmd+Q), en Terminal: `./scripts/limpiar-cursor-cache.sh`, vuelve a abrir Cursor → libera ~400 MB+ y deja Cursor más ligero.
5. **Opcional:** cerrar Chrome, Slack u otras apps que no uses → más RAM libre.

---

## Ganar velocidad en este equipo (checklist rápido)

| Acción | Impacto | Cuándo |
|--------|---------|--------|
| **1. Cerrar Cursor y ejecutar** `./scripts/limpiar-cursor-cache.sh` | Libera ~400 MB+ y caché antigua | Cuando Cursor vaya lento |
| **2. Añadir exclusiones en `.cursorignore`** (ver abajo) | Menos RAM, índice más rápido | Una vez por proyecto |
| **3. `files.watcherExclude`** | Menos CPU y disco | ✅ Ya en `.vscode/settings.json` |
| **4. Desactivar extensiones que no uses** | Menos RAM y arranque más rápido | Revisar cada cierto tiempo |
| **5. Cerrar pestañas/archivos que no uses** | Menos memoria por pestaña | Diario |
| **6. `pnpm store prune`** (opcional) | Limpia store global de pnpm | Si falta disco |
| **7. Proyecto: `./scripts/cleanup.sh`** | Limpiar .next, logs, .cache del repo | Cuando quieras liberar en el proyecto |
| **8. Todo en uno** `./scripts/optimizar-velocidad.sh` | Limpieza proyecto + sugerencias Cursor | Cuando quieras un “reseteo” de velocidad |

**Config ya en el repo (optimización fuerte):** `.vscode/settings.json` incluye:
- **Watcher:** `files.watcherExclude` → no vigila node_modules, .next, dist (menos CPU).
- **Explorer:** `files.exclude` → node_modules, .next, dist no se muestran en el árbol; menos RAM y menos trabajo del TS server. Si necesitas ver una carpeta, en Configuración pon `"**/node_modules": false` (o la ruta concreta).
- **Búsqueda:** `search.exclude`, `search.useIgnoreFiles`, `search.followSymlinks`: false, `search.maxResults`: 8000 → búsquedas más rápidas y con tope de resultados.
- **Git:** `git.autorefresh`: false → menos CPU.
- **TypeScript:** `typescript.tsserver.maxTsServerMemory`: 2048 → el servidor TS no pasa de 2 GB de RAM.
- **Editor:** `editor.minimap.enabled`: false → menos GPU/CPU; `explorer.autoReveal`: false → menos acceso al disco al cambiar de archivo.
- **Extensiones:** `extensions.autoUpdate`: false → menos trabajo en segundo plano.

**.cursorignore** (en la raíz del proyecto): añade estas líneas para que Cursor no indexe carpetas pesadas y gane velocidad:

```
node_modules/
**/node_modules/
.next/
**/.next/
dist/
**/dist/
.pnpm-store/
.git/
.vercel/
coverage/
.turbo/
```

---

## Más velocidad todavía

- **Búsquedas más rápidas:** Ya está en `.vscode/settings.json`: `search.exclude` (node_modules, .next, dist, .git) y `search.useIgnoreFiles`. Las búsquedas en archivos (Ctrl/Cmd+Shift+F) no recorren esas carpetas.
- **Menos CPU por Git:** `git.autorefresh: false` evita que Git actualice el estado continuamente; el estado se actualiza al abrir el proyecto o guardar. Si necesitas ver el estado al instante, en la paleta de comandos ejecuta "Git: Refresh".
- **Script todo-en-uno:** Ejecuta `./scripts/optimizar-velocidad.sh` para limpiar el proyecto (builds, logs, cachés) y ver pasos opcionales (Cursor, pnpm store). No cierra Cursor por ti; si quieres limpiar también la caché de Cursor, ciérralo y ejecuta después `./scripts/limpiar-cursor-cache.sh`.
- **Extensiones:** Cuantas menos extensiones tengas activas, menos memoria y menos arranque. Revisa con `./scripts/analizar-tamano-extensiones.sh` y desactiva las que no uses.
- **Reindexar tras cambiar .cursorignore:** Si añades cosas a `.cursorignore`, en Cursor: Paleta de comandos (Cmd+Shift+P) → "Reindex Codebase" para que el índice se recalcule sin esas carpetas.

---

## Si sigue consumiendo demasiados recursos

1. **Ver qué gasta:** en Terminal ejecuta `./scripts/ver-uso-recursos.sh` (lista procesos que más RAM/CPU usan relacionados con Node, Cursor, Chrome).
2. **Quitar `files.exclude`** si no quieres ocultar carpetas: en `.vscode/settings.json` borra el bloque `"files.exclude"` o pon `false` en las que necesites ver en el explorador (ej. `"**/node_modules": false` para ver node_modules).
3. **Bajar más la RAM del TS:** en `settings.json` pon `"typescript.tsserver.maxTsServerMemory": 1536` (o 1024 si el proyecto es pequeño).
4. **Desactivar extensiones pesadas:** Cursor → Extensiones → desactivar las que no uses; `./scripts/analizar-tamano-extensiones.sh` para ver tamaños.
5. **Abrir solo una carpeta:** en vez de abrir el monorepo entero, abre solo `apps/copilot` o `apps/web` como workspace → menos archivos indexados.

---

## Ya hecho en este proyecto

- **Builds `.next` eliminados** (~2,6 GB): se han borrado `apps/web/.next` y `apps/copilot/.next`. Se regeneran al ejecutar `pnpm run build:web` o `pnpm run build:copilot` (o al hacer `dev`).

---

## 1. Limpiar caché y logs de Cursor (recomendado)

**Cierra Cursor por completo** antes de borrar.

**Opción rápida:** desde la raíz del proyecto:

```bash
./scripts/limpiar-cursor-cache.sh
```

O manualmente en macOS, desde Terminal:

```bash
# Caché de Cursor (~137 MB)
rm -rf ~/Library/Application\ Support/Cursor/Cache/*

# Caché de código (~variable)
rm -rf ~/Library/Application\ Support/Cursor/Code\ Cache/*

# Logs (~290 MB)
rm -rf ~/Library/Application\ Support/Cursor/logs/*

# Caché GPU (poco peso)
rm -rf ~/Library/Application\ Support/Cursor/GPUCache/*
```

O todo de una vez:

```bash
rm -rf ~/Library/Application\ Support/Cursor/Cache/* \
       ~/Library/Application\ Support/Cursor/Code\ Cache/* \
       ~/Library/Application\ Support/Cursor/logs/* \
       ~/Library/Application\ Support/Cursor/GPUCache/*
```

**Nota:** En tu equipo, `CachedData` y `CachedExtensionVSIXs` son enlaces a otro disco; no los borres desde aquí.

---

## 2. Reducir uso de memoria de Cursor

- **Desactiva extensiones** que no uses (Extensiones → desinstalar o deshabilitar).
- **Cierra pestañas** y editores que no necesites.
- **Archivo → Preferencias → Configuración** y revisa:
  - `files.watcherExclude`: excluir `node_modules` y `.next` si no están ya.
  - Limitar índices grandes si tienes opciones de “files” o “search”.

En `settings.json` puedes añadir o revisar:

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true
  }
}
```

---

## 3. Limpieza adicional en el proyecto (opcional)

Solo si quieres liberar más y estás dispuesto a volver a instalar dependencias:

```bash
# Desde la raíz del monorepo
pnpm run clean
```

Eso borra `node_modules`, `.next` y `dist` en todas las apps. Luego:

```bash
pnpm install
```

**Espacio aproximado que libera:** ~16 GB (pero tendrás que hacer `pnpm install` y volver a construir).

Para solo borrar builds otra vez en el futuro:

```bash
pnpm run clean:next
```

---

## 4. Resumen de tamaños (referencia)

| Ubicación | Tamaño aprox. |
|-----------|----------------|
| `apps/copilot/node_modules` | ~8,7 GB |
| `node_modules` (raíz) | ~5,3 GB |
| `~/Library/Application Support/Cursor` | ~3,3 GB |
| `~/.cursor` | ~894 MB |
| Builds `.next` (ya eliminados) | ~2,6 GB |

Si Cursor sigue dando errores después de limpiar, conviene reiniciar el Mac o al menos cerrar Cursor por completo y volver a abrirlo.
