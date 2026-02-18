# Liberar espacio y recursos (Cursor y proyecto)

Cursor y el monorepo pueden consumir mucho disco y RAM. Aquí tienes pasos seguros para aligerar.

## Ya hecho en este proyecto

- **Builds `.next` eliminados** (~2,6 GB): se han borrado `apps/web/.next` y `apps/copilot/.next`. Se regeneran al ejecutar `pnpm run build:web` o `pnpm run build:copilot` (o al hacer `dev`).

---

## 1. Limpiar caché y logs de Cursor (recomendado)

**Cierra Cursor por completo** antes de borrar.

En macOS, desde Terminal:

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
