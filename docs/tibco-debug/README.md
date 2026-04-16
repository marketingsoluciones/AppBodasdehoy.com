# Debug TIBCO – error del frontal + flujo + traza

Rellena estos archivos con un caso concreto de error y usa Cursor para analizarlo.

1. **error.json** – Respuesta de error que recibió el frontal.
2. **flujo.json** – Definición del flujo (flogo.json o fragmento).
3. **traza.md** – Petición (method, URL, headers, body) y traza/logs TIBCO.

Luego en Cursor Chat (Cmd+L / Ctrl+L):

- Añade con @: `@docs/tibco-debug/error.json` `@docs/tibco-debug/flujo.json` `@docs/tibco-debug/traza.md`
- Pregunta: *"Con estos tres archivos, ¿dónde falló el flujo y el error es nuestro o de un backend?"*

Guías:
- [Usar Cursor para detectar el error](../tibco-usar-cursor-para-detectar-error.md)
- [Qué descargar y cómo conectarse a TIBCO](../tibco-archivos-y-conexion-para-resolver-errores.md)
