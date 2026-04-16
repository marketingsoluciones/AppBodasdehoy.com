# Uso de la segunda unidad de disco (HD MAC BASE)

Para liberar espacio en el disco principal, parte de los datos del proyecto se pueden guardar en la segunda unidad **HD MAC BASE** (`/Volumes/HD MAC BASE`).

**Resumen:** Store pnpm, node_modules raíz y apps/copilot/node_modules están en la segunda unidad (enlaces en el proyecto). Builds (.next), .vercel, .screenshots, .backups y .temp se eliminaron. Con esto se liberaron ~30 GB en el disco principal. Para seguir con el proyecto no hace falta nada más; `pnpm install` y `pnpm dev` siguen funcionando.

---

## Ya movido a HD MAC BASE

| Qué | Dónde está ahora | En el proyecto |
|-----|------------------|----------------|
| **Store de pnpm** (~3,5 GB) | `/Volumes/HD MAC BASE/AppBodasdehoy-data/.pnpm-store` | Enlace `./.pnpm-store` → esa ruta |
| **node_modules raíz** (~5–17 GB) | `/Volumes/HD MAC BASE/AppBodasdehoy-data/node_modules` | Enlace `./node_modules` → esa ruta |
| **apps/copilot/node_modules** (~8 GB) | `/Volumes/HD MAC BASE/AppBodasdehoy-data/copilot-node_modules` | Enlace `apps/copilot/node_modules` → esa ruta |

Además se eliminaron (regenerables): `.next` (builds Next.js), `.vercel` (cache), `.screenshots`, `.backups`, `.temp`.

`pnpm install` y `pnpm dev` siguen funcionando; las dependencias se resuelven por los enlaces.

---

## Cómo mover más cosas a la segunda unidad

### node_modules (~5 GB)

Si quieres que `node_modules` también esté en la segunda unidad:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com

# 1. Mover node_modules a la segunda unidad
mv node_modules "/Volumes/HD MAC BASE/AppBodasdehoy-data/"

# 2. Crear enlace en el proyecto
ln -s "/Volumes/HD MAC BASE/AppBodasdehoy-data/node_modules" node_modules

# 3. Comprobar (pnpm install debe seguir funcionando)
pnpm install
```

Los `node_modules` de `apps/web` y `apps/copilot` suelen ser enlaces de pnpm al `node_modules` raíz; no hace falta moverlos por separado.

### Builds (.next) en la segunda unidad

Los builds de Next.js (`.next`) se regeneran con `pnpm dev` / `pnpm build`. Si quieres que se generen en la segunda unidad para no llenar el disco principal, se puede configurar en `next.config.js` (por ejemplo `distDir`), pero es más complejo; lo más simple es borrarlos cuando sobren (ya se eliminaron antes para liberar ~2,8 GB).

---

## Espacio en la segunda unidad

- **HD MAC BASE:** 465 GB totales, ~97 GB libres.
- **AppBodasdehoy-data** usa ahí: el store de pnpm (~3,5 GB) y, si lo mueves, `node_modules` (~5 GB).

**Más espacio (opcional, cuando quieras):**
- `pnpm store prune` – limpia paquetes no usados del store (puede liberar GB). Si falla por permisos, ejecutarlo en una terminal fuera del sandbox: `cd /ruta/al/repo && pnpm store prune`.
- En macOS: Ajustes → General → Almacenamiento; vaciar Papelera; revisar “Recomendaciones”.
- Los `.tsbuildinfo` y logs grandes están dentro de `node_modules` (dependencias); no conviene borrarlos a mano.

Si en algún momento deshaces los enlaces y quieres volver a tener todo en el disco principal: borra el enlace, mueve de nuevo la carpeta desde `/Volumes/HD MAC BASE/AppBodasdehoy-data/` al proyecto y, en el caso de `node_modules`, ejecuta `pnpm install` por si acaso.
