**Asunto:** Queries faltantes en API - api.bodasdehoy.com

---

Hola,

Durante las pruebas de integración del frontend de AppBodasDeHoy, detectamos que las siguientes queries/mutations no existen en el backend de `api.bodasdehoy.com`:

### 1. `queryenEvento`
- **Función:** Obtener los eventos del usuario
- **Error:** `Cannot query field "queryenEvento" on type "Query"`

### 2. `getPsTemplate`
- **Función:** Obtener plantillas de presupuesto
- **Error:** `Cannot query field "getPsTemplate" on type "Query"`

### 3. `updateActivity`
- **Función:** Registrar actividad del usuario
- **Error:** `Unknown type "inputActivity"` y `Cannot query field "updateActivity" on type "Mutation"`

---

**Prueba de verificación:**

```bash
curl -s -X POST "https://api.bodasdehoy.com/graphql" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"query":"query{queryenEvento(variable:\"test\",valor:\"test\",development:\"bodasdehoy\"){_id}}"}'
```

---

**Impacto:** Sin estas queries, la aplicación no puede cargar los eventos ni las plantillas de presupuesto.

Por favor confirmar si estas queries deben agregarse al backend o si existe otra API donde deberían estar disponibles.

Saludos
