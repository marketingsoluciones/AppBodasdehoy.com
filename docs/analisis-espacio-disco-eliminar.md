# Análisis: qué podemos eliminar para liberar espacio

**Fecha:** 27 feb 2026  
**Disco interno (Data):** ~159 GB usados, ~29 GB libres (85% lleno)

---

## Lista numerada por tamaño (Descargas y otras acciones)

Para decir “borra X, Y, Z”, usa el número. Ordenado de mayor a menor tamaño.

| # | Tamaño | Nombre / acción |
|---|--------|------------------|
| 1 | **9,8 GB** | Chromium `vm_bundles` *(ya borrado)* |
| 2 | **5,3 GB** | `raspios.img` |
| 3 | **1,9 GB** | `2025-12-04-raspios-trixie-arm64-full.img.xz` |
| 4 | **1,8 GB** | `2025-12-04-raspios-trixie-armhf-full.img.xz` |
| 5 | **1,2 GB** | onfc7iisvu bbn  b bb`2025-12-04-raspios-trixie-arm64.img.xz` |
| 6 | **378 MB** | Chromium `Cache` *(ya borrado)* |
| 7 | **221 MB** | `Lunar Client v3.5.16-ow.dmg` |
| 8 | **217 MB** | `Claude (1).dmg` |
| 9 | **214 MB** | `Claude.dmg` |
| 10 | **182 MB** | `WhatsApp-2.25.36.33.dmg` |
| 11 | **170 MB** | `drive-download-20260203T054944Z-3-001.zip` |
| 12 | **170 MB** | carpeta `drive-download-20260203T054944Z-3-001` |
| 13 | **164 MB** | `Pencil-mac-arm64.dmg` |
| 14 | **159 MB** | `balenaEtcher-2.1.4-x64.dmg` |
| 15 | **149 MB** | `balenaEtcher-2.1.4-arm64.dmg` |
| 16 | **144 MB** | `robocorp-setup-utility-mac-1.7.1.dmg` |
| 17 | **140 MB** | `Codex.dmg` |
| 18 | **138 MB** | `Firefox 146.0.1.dmg` |
| 19 | **110 MB** | `Autofirma_1_9_aarch64.pkg` |
| 20 | **109 MB** | `Autofirma_Mac_M1 (1).zip` |
| 21 | **109 MB** | `Autofirma_Mac_M1 (2).zip` |
| 22 | **109 MB** | `Autofirma_Mac_M1 (3).zip` |
| 23 | **105 MB** | `Autofirma_1_9_x64.pkg` |
| 24 | **104 MB** | `Autofirma_Mac_x64.zip` |
| 25 | **~90 MB** | `pcss` (carpeta) |
| 26 | **~90 MB** | `pcss (1)` (carpeta) |
| 27 | **89 MB** | `pcss.zip` |
| 28 | **89 MB** | `pcss (1).zip` |
| 29 | **42 MB** | `imager_2.0.6.dmg` |
| 30 | **6,7 MB** | `mcp-server-v1.5.0.dxt` |
| 31 | **~7 MB** | cachés Chrome (`.com.google.Chrome.*`) |
| 32 | **~1,2 GB** | Vaciar Papelera *(queda 1 elemento de root: Navicat; vaciar desde Finder o con sudo)* |
| 33 | poco | Carpetas vacías "carpeta sin título" en Escritorio |

---

## 1. Descargas (~14 GB) – candidatos a eliminar o mover

### Eliminar sin problema (instaladores ya usados / duplicados)

| Tamaño | Archivo | Motivo |
|--------|---------|--------|
| **5,3 GB** | `raspios.img` | Imagen ya usada para grabar SD/Pi; si ya la tienes en la SSD, se puede borrar. |
| **1,9 GB** | `2025-12-04-raspios-trixie-arm64-full.img.xz` | Misma imagen comprimida; redundante con la anterior. |
| **1,8 GB** | `2025-12-04-raspios-trixie-armhf-full.img.xz` | Variante armhf; borrar si solo usas arm64. |
| **1,2 GB** | `2025-12-04-raspios-trixie-arm64.img.xz` | Otra variante; borrar si ya instalaste. |
| **221 MB** | `Lunar Client v3.5.16-ow.dmg` | Instalador; borrar si ya está instalado. |
| **217 MB** | `Claude (1).dmg` | Instalador duplicado. |
| **214 MB** | `Claude.dmg` | Instalador; borrar si ya instalado. |
| **182 MB** | `WhatsApp-2.25.36.33.dmg` | Instalador. |
| **170 MB** | `drive-download-20260203T054944Z-3-001.zip` + carpeta | Duplicado zip/carpeta; dejar uno. |
| **164 MB** | `Pencil-mac-arm64.dmg` | Instalador. |
| **159 MB** | `balenaEtcher-2.1.4-x64.dmg` | x64; en Mac M1 no hace falta. |
| **149 MB** | `balenaEtcher-2.1.4-arm64.dmg` | Instalador; borrar si ya instalado. |
| **144 MB** | `robocorp-setup-utility-mac-1.7.1.dmg` | Instalador. |
| **140 MB** | `Codex.dmg` | Instalador. |
| **138 MB** | `Firefox 146.0.1.dmg` | Instalador. |
| **~90 MB x4** | `pcss`, `pcss (1)`, `pcss.zip`, `pcss (1).zip` | Duplicados; dejar uno y borrar el resto. |
| **110 MB** | `Autofirma_1_9_aarch64.pkg` | Instalador. |
| **109 MB x3** | `Autofirma_Mac_M1 (1/2/3).zip` | Duplicados; dejar uno. |
| **105 MB** | `Autofirma_1_9_x64.pkg` | x64; en M1 no necesario. |
| **104 MB** | `Autofirma_Mac_x64.zip` | Idem. |
| **42 MB** | `imager_2.0.6.dmg` | Instalador Raspberry Pi Imager. |
| **6,7 MB** | `mcp-server-v1.5.0.dxt` | Archivo descarga. |
| **3,9 MB** | `.com.google.Chrome.WxnHQu` | Caché/descarga Chrome. |
| **3,6 MB** | `.com.google.Chrome.aJBZ1l` | Caché/descarga Chrome. |

**Subtotal eliminable en Descargas (solo instaladores/duplicados/imágenes Pi):** ~**10–12 GB**.

### Revisar antes de borrar (documentos personales)

- `Facturas_Gmail_*`, `Facturas_*`, `DESAUCIO`, contratos, PDFs, capturas, declaraciones, etc.  
  → Mover a Documentos o al disco externo en lugar de borrar, o borrar solo si ya están guardados en otro sitio.

### Cuidado (credenciales / sensibles)

- `client_secret*.json`, `*.pem`, `eventosorganizador-*.json`, `ap-email-ses_credentials.csv`  
  → No borrar sin comprobar que no los usa ninguna app; si ya no los usas, borrar con cuidado.

---

## 2. Papelera (~1,2 GB)

- **Acción:** Vaciar la Papelera (`~/.Trash`).  
- **Liberación:** ~**1,2 GB**.

---

## 3. Cachés (ya se limpiaron parcialmente; quedan ~214 MB)

- Aún se puede borrar más en `~/Library/Caches/*` si quieres (navegadores, etc.).  
- **Estimación adicional:** hasta ~**200 MB**.

---

## 4. Application Support (~19 GB)

### Candidatos a limpiar o revisar

| Tamaño | Carpeta | Acción |
|--------|---------|--------|
| **~9,8 GB** | `Chromium/vm_bundles` | Bundles de VM (Cursor/Claude). Si no usas esas VMs, se puede borrar; Cursor puede volver a descargar. |
| **~378 MB** | `Chromium/Cache` | Caché; se puede borrar. |
| **~919 MB** | `com.apple.wallpaper` | Fondos de escritorio; revisar si quieres conservar alguno. |
| **~235 MB** | `com.wondershare.Installer` | Caché instalador; borrable. |

**Subtotal razonable a liberar (Cache + vm_bundles si no los necesitas):** ~**10–11 GB**.

### No tocar sin revisar

- `Cursor` (5,6 GB): datos del editor.  
- `Code` (251 MB): VS Code.  
- `AddressBook`, `Adobe`, etc.: datos de apps.

---

## 5. Otras carpetas

- **Desktop:** casi vacío; carpetas “sin título” vacías se pueden borrar.  
- **Documents:** ~1,6 MB; nada relevante que eliminar para espacio.  
- **Movies / Music:** poco tamaño.

---

## Resumen de espacio que se puede liberar

| Acción | Espacio aprox. |
|--------|-----------------|
| Eliminar imágenes Raspberry Pi + instaladores/duplicados en Descargas | **10–12 GB** |
| Vaciar Papelera | **1,2 GB** |
| Borrar `Chromium/Cache` + (opcional) `Chromium/vm_bundles` | **0,4–10 GB** |
| Borrar más cachés en `~/Library/Caches` | **~0,2 GB** |
| **Total aproximado** | **~12–24 GB** |

---

## Comandos sugeridos (ejecutar solo lo que quieras)

### 1) Vaciar Papelera
```bash
rm -rf ~/.Trash/*
```

### 2) Eliminar en Descargas (instaladores e imágenes Pi)
Solo si ya no los necesitas:
```bash
cd ~/Downloads
rm -f raspios.img
rm -f 2025-12-04-raspios-trixie-*.img.xz
rm -f "Lunar Client v3.5.16-ow.dmg" "Claude (1).dmg" "Claude.dmg"
rm -f "WhatsApp-2.25.36.33.dmg" "Pencil-mac-arm64.dmg"
rm -f balenaEtcher-2.1.4-x64.dmg balenaEtcher-2.1.4-arm64.dmg
rm -f robocorp-setup-utility-mac-1.7.1.dmg Codex.dmg "Firefox 146.0.1.dmg"
rm -f drive-download-20260203T054944Z-3-001.zip
rm -rf "drive-download-20260203T054944Z-3-001"
# Duplicados Autofirma (dejar uno si lo usas)
rm -f Autofirma_1_9_x64.pkg Autofirma_Mac_x64.zip
rm -f "Autofirma_Mac_M1 (1).zip" "Autofirma_Mac_M1 (2).zip" "Autofirma_Mac_M1 (3).zip"
# Duplicados pcss
rm -rf "pcss (1)" "pcss (1).zip" "pcss.zip"
rm -f imager_2.0.6.dmg
rm -rf .com.google.Chrome.*
```

### 3) Caché de Chromium (seguro)
```bash
rm -rf "$HOME/Library/Application Support/Chromium/Cache"/*
```

### 4) VM bundles de Chromium (solo si no usas esas VMs en Cursor)
```bash
# Libera ~10 GB pero Cursor puede volver a descargar
rm -rf "$HOME/Library/Application Support/Chromium/vm_bundles"/*
```

---

**Recomendación:** empieza por vaciar la Papelera y por eliminar en Descargas las imágenes de Raspberry Pi y los instaladores que ya no necesites. Luego, si quieres más espacio, limpia la caché de Chromium y, si te parece bien, los `vm_bundles`.

---

## Cómo liberar más espacio (actualizado 27 feb 2026)

Después de la primera limpieza quedan estas opciones, **ordenadas por impacto**:

### Opción A – Rápido y seguro (~1,5–2 GB)

| Acción | Libera | Riesgo |
|--------|--------|--------|
| **A1** | Vaciar Papelera (desde Finder o `sudo rm -rf ~/.Trash/*`) | ~1,2 GB | Ninguno |
| **A2** | Borrar en Descargas: Autofirma duplicados (19–24), pcss duplicados (25–28), imager.dmg (29), mcp-server (30), cachés Chrome (31) | ~0,8 GB | Ninguno |

### Opción B – Cachés y datos regenerables (~0,5 GB)

| Acción | Libera | Riesgo |
|--------|--------|--------|
| **B1** | Cursor: borrar `Cache` y `logs` | ~185 MB | Cursor puede ir un poco más lento al reabrir |
| **B2** | Chromium: borrar lo que quede en `Application Support/Chromium` (ahora ~659 MB) | ~0,5 GB | Navegador/Cursor puede redescargar |
| **B3** | `com.wondershare.Installer` (caché instalador) | ~235 MB | Ninguno |
| **B4** | `com.apple.wallpaper` (fondos de escritorio en caché) | ~919 MB | Solo si no te importa que se regeneren |

### Opción C – Más espacio, revisar antes (~5–6 GB)

| Acción | Libera | Riesgo |
|--------|--------|--------|
| **C1** | Cursor `globalStorage` (índices, datos de extensiones/AI) | ~4,9 GB | Puedes perder preferencias de extensiones o índices; Cursor puede reconstruir |
| **C2** | Mover/archivar facturas y documentos de Descargas a disco externo o Documentos | ~0,3 GB | Solo si ya tienes copia o no los necesitas en Descargas |

### Opción D – Proyectos (solo si tienes claro que puedes regenerar)

| Acción | Libera | Riesgo |
|--------|--------|--------|
| **D1** | Borrar `node_modules` en el proyecto (ej. AppBodasdehoy.com) y luego `pnpm install` o `npm install` | ~5,3 GB | Recuperable con `pnpm install` / `npm install` |

### Resumen de espacio adicional posible

| Si haces… | Espacio extra aprox. |
|-----------|----------------------|
| Solo A (Papelera + Descargas restantes) | **~2 GB** |
| A + B (cachés, Chromium, wallpaper, etc.) | **~3–4 GB** |
| A + B + C1 (Cursor globalStorage) | **~8–9 GB** |
| A + B + C1 + D1 (y reinstalar node_modules cuando lo necesites) | **~14 GB** |

---

## Revisión Cursor y proyectos (27 feb 2026)

### Cursor – qué se puede borrar

| Carpeta / archivo | Tamaño | ¿Borrar? | Notas |
|-------------------|--------|----------|--------|
| `User/globalStorage/state.vscdb.backup` | **2,4 GB** | ✅ Sí | Copia de seguridad; Cursor no la usa en marcha. |
| `User/globalStorage/state.vscdb` | **2,4 GB** | ⚠️ Opcional | Estado global (índices, extensiones). Borrar = Cursor “como recién instalado” en ese estado. |
| `User/globalStorage/ms-edgedevtools.vscode-edge-devtools` | 121 MB | Opcional | Datos de extensión Edge DevTools. |
| `User/globalStorage/highagency.pencildev` | 38 MB | Opcional | Datos de extensión Pencil. |
| `User/globalStorage/visualstudioexptteam.intellicode-api-usage-examples` | 18 MB | Opcional | Ejemplos de uso de IntelliCode. |
| `Cache` | 148 MB | ✅ Sí | Caché; se regenera. |
| `Partitions` | 306 MB | ✅ Sí | Particiones de datos; se regeneran. |
| `logs` | 37 MB | ✅ Sí | Logs; no necesarios. |
| `User/History` | 47 MB | Opcional | Historial local de archivos; perderías “recently opened”. |
| `User/workspaceStorage` | 19 MB | Opcional | Estado por workspace. |

**Borrado seguro (recomendado):** `state.vscdb.backup` + `Cache` + `Partitions` + `logs` → **~2,9 GB**.

### Proyectos (AppBodasdehoy.com) – qué se puede borrar

| Carpeta | Tamaño | ¿Borrar? | Recuperación |
|---------|--------|----------|--------------|
| `node_modules` (raíz) | **5,3 GB** | ⚠️ Solo si aceptas reinstalar | `pnpm install` en la raíz. |
| `apps/copilot/node_modules` | **8,7 GB** | ⚠️ Idem | Con `pnpm install` se regenera (pnpm usa enlace al store; el store está en disco externo). |
| `apps/web/.next` | **2,3 GB** | ✅ Sí | Build de Next; se regenera con `pnpm build` o al arrancar dev. |
| `apps/creador-standalone/.next` | 177 MB | ✅ Sí | Idem. |
| `apps/memories-web/.next` | 21 MB | ✅ Sí | Idem. |
| `apps/copilot/.next` | 788 KB | ✅ Sí | Idem. |
| `.playwright-mcp` | 5 MB | ✅ Sí | Caché Playwright MCP; se regenera. |
| `.test-results` | 0 B | - | Ya vacío. |

**Borrado seguro (sin tocar node_modules):** todos los `.next` + `.playwright-mcp` → **~2,5 GB**.

### Resumen total recuperable (Cursor + proyectos, solo lo seguro)

- Cursor: backup + Cache + Partitions + logs → **~2,9 GB**
- Proyectos: `.next` en apps + `.playwright-mcp` → **~2,5 GB**  
**Total ~5,4 GB** sin tocar `state.vscdb`, `node_modules` ni historial.
