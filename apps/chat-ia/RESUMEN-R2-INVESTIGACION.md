# Resumen: manejo de R2, pendientes y estandarización (investigación)

Documento vivo para alinear **chat-ia (front + proxies Next)** vs **api-ia (Python)** vs **API2 (GraphQL)** y reducir la confusión con **whitelabel / development**.

---

## 1. Lo que tenemos hoy (en este repo — chat-ia)

| Capa | Qué hace |
|------|----------|
| **Subida “evento / Portal / adjuntos”** | \`uploadFileToS3\` → si \`NEXT_PUBLIC_USE_STORAGE_R2=true\` **y** hay \`eventId\` → \`POST /api/storage/upload\` (FormData). |
| **Proxy Next.js** | \`POST/GET /api/storage/upload\`, \`GET/DELETE /api/storage/files/[fileId]\` → reenvían a \`BACKEND_URL\` / \`NEXT_PUBLIC_BACKEND_URL\` (típico **api-ia**): \`/api/storage/events/{eventId}/upload\`, etc. |
| **Listado / URL / borrar** | \`src/services/storage-r2.ts\` → mismas rutas proxy; headers \`X-User-ID\`, \`X-Development\` desde \`dev-user-config\` (\`user_id\` o \`userId\`). |
| **Branding (admin)** | Subida **directa a api-ia**: \`.../api/admin/branding/*\` (no usa \`/api/storage/upload\`). |
| **GraphQL API2** | Query \`getWhiteLabelStorageConfig\` en \`src/libs/graphql/queries.ts\` → **no cableada** al flujo de subida del chat en el front. |

**Conclusión:** el navegador **no** maneja claves R2; quien escribe en R2 (en este diseño) es **api-ia**.

---

## 2. Fuentes de confusión (a normalizar)

1. **“R2 viene del whitelabel”** — el whitelabel define **marca** (\`development\`) y puede haber **config en API2**; la subida del Copilot **no** pasa por GraphQL API2.
2. **Varios caminos** — evento/Portal (\`/api/storage\`), branding (\`/api/admin/branding/upload\`), otros posibles en **API2** (p. ej. CRM / \`uploadCRMEntityFile\`, errores tipo “Storage no configurado para este development”).
3. **\`NEXT_PUBLIC_USE_STORAGE_R2\`** — solo activa el flujo “storage vía api-ia” en el front; **no** elige bucket.
4. Papel de **API2 vs api-ia**: sin un diagrama acordado, se atribuyen fallos al servicio equivocado.

---

## 3. Pendientes / respuestas deseadas — **api-ia**

- [ ] Contrato estable: \`POST /api/storage/events/{eventId}/upload\`, listado de archivos, \`GET/DELETE /api/storage/files/{fileId}\`.
- [ ] Cómo se resuelve **bucket/cuenta R2** según \`X-Development\` (variables, BD, llamada a API2).
- [ ] Catálogo de **errores** (invitado/guest, permisos, cuota, etc.).
- [ ] ¿Branding y storage de evento comparten **misma** política de R2 o no?
- [ ] Base pública de URLs (\`public_urls\`, CDN, etc.).

---

## 4. Pendientes / respuestas deseadas — **API2**

- [ ] ¿\`getWhiteLabelStorageConfig\` es la **fuente de verdad** de credenciales R2 por marca?
- [ ] ¿**api-ia** consume esa query (internalmente) hoy o está duplicado?
- [ ] Estado de uploads **CRM / otros** vs storage “Copilot” (misma palabra “storage”, distinto producto).

---

## 5. Propuesta de **norma** (a votar en la investigación)

| Tema | Norma sugerida |
|------|----------------|
| Tenant | \`X-Development\` = slug whitelabel; lista de valores válidos publicada. |
| Usuario | \`X-User-ID\` en rutas autenticadas; acordar formato (UUID vs id api2). |
| Copilot / eventos | Subida solo **api-ia** \`/api/storage/*\` vía proxy Next, salvo decisión explícita de otro servicio. |
| Credenciales R2 | **Una** fuente de verdad documentada (p. ej. API2 → api-ia, o solo api-ia). |

---

## 6. Pendientes en código **chat-ia** (tras acordar norma)

- Usar en UI/admin o **eliminar** código muerto alrededor de \`GET_WHITELABEL_STORAGE_CONFIG\`.
- Revisar que **todos** los flujos hacia storage envíen la misma pareja de headers.
- Añadir al **README** de chat-ia un cuadro: *ruta → backend → responsable*.

---

## 7. Frase guía para la reunión

**chat-ia delega la escritura en R2 en api-ia**; **API2 puede guardar config por marca** pero **no** debe asumirse que toda subida pasa por GraphQL. La estandarización necesita **un diagrama**, **una fuente de verdad para R2** y **nombres explícitos** por tipo de subida (evento/Copilot, branding, CRM).

---

*Documento preparado para investigación / estándares R2.*
