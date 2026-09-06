# Auditoría i18n — bugs 2.3 (FOUC) y 2.4 (mezcla EN/ES) del informe 2026-06-12

## Conclusión: las traducciones ES están COMPLETAS. El problema es FOUC, no claves faltantes.

El informe reportó "mezcla EN/ES" y "claves crudas" (searchAgentPlaceholder, conversations,
defaultList, etc.). Auditado: **esas claves SÍ están traducidas en es-ES.**

| Clave (informe la vio en inglés) | es-ES real | Veredicto |
|---|---|---|
| searchAgentPlaceholder | "Asistente de búsqueda..." | ✅ traducida |
| conversations | "Conversaciones" | ✅ traducida |
| defaultList | "Lista predeterminada" | ✅ traducida |
| newAgent | "Nuevo asistente" | ✅ traducida |
| "Just Chat" / justChat | no existe en default NI es-ES | ⚠️ no es clave del proyecto (informe la malinterpretó) |

**es-ES tiene 32 archivos (= default), cobertura de namespaces completa.**

## La causa real: FOUC (2.3)

`src/locales/create.ts`: `partialBundledLanguages: true` + solo `['error','common','chat']`
pre-cargados. Los demás namespaces cargan LAZY → durante la hidratación, react-i18next
pinta la CLAVE cruda un instante antes de que llegue la traducción ES → parece "inglés/mezcla".

NO faltan traducciones. Es timing de carga.

## Fix posible del FOUC (riesgo medio — toca i18n global)
Opciones (NO aplicadas, requieren prueba cuidadosa por afectar toda la app):
1. `parseMissingKeyHandler: () => ''` → mostrar vacío en vez de la clave cruda mientras carga.
2. `react: { useSuspense: true }` + Suspense boundary → no renderizar hasta tener traducciones.
3. Pre-cargar más namespaces en `ns: [...]` (inbox/discover) → más bundle inicial, menos FOUC.
4. Skeleton en los componentes clave hasta que i18n esté listo.

**Recomendación:** opción 1 (parseMissingKeyHandler vacío) es la más acotada — evita ver la clave
cruda sin cambiar el comportamiento de carga. Pero hay que verificar que no oculte claves
legítimamente faltantes en dev. Decisión de producto/UX.

## Lo que NO es bug
- Texto "boda/comunión" del hero: es CONTENIDO intencional (mensajes de bienvenida mencionan
  tipos de evento: boda, comunión, XV años...). NO rotación con bug.
- "No hay proveedores habilitados" (2.2): string de @lobehub/ui, requiere investigar la lógica
  de proveedores disponibles (2 fuentes de verdad) — separado del i18n.
