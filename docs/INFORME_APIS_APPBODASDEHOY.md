# Problemas de API - AppBodasDeHoy

**Fecha:** 27 de Enero de 2026

---

## Error Crítico: Mutation `auth` en api.bodasdehoy.com

La mutation `auth` que genera la sessionCookie tiene un error interno de Firebase:

```bash
curl -s -X POST "https://api.bodasdehoy.com/graphql" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"query":"mutation{auth(idToken:\"test\"){sessionCookie}}"}'
```

**Error:**
```json
{
  "errors": [{
    "message": "Cannot read properties of undefined (reading 'app')",
    "path": ["auth"],
    "extensions": {
      "exception": {
        "stacktrace": [
          "TypeError: Cannot read properties of undefined (reading 'app')",
          "at firebaseApp (file:///root/api-bodas/db/funciones.js:116:63)",
          "at auth (file:///root/api-bodas/db/schemas/user.js:527:43)"
        ]
      }
    }
  }]
}
```

**Impacto:** Los usuarios no pueden iniciar sesión porque la API no puede generar la cookie de sesión.

**Acción:** Revisar la inicialización de Firebase Admin SDK en `api-bodas/db/funciones.js`.

---

## Problema Anterior (RESUELTO)

Las siguientes queries ahora funcionan en `apiapp.bodasdehoy.com`:

---

## Queries Faltantes

### 1. `queryenEvento`

**Uso:** Obtener eventos del usuario

```bash
curl -s -X POST "https://api.bodasdehoy.com/graphql" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"query":"query($variable:String,$valor:String,$development:String!){queryenEvento(variable:$variable,valor:$valor,development:$development){_id}}","variables":{"variable":"usuario_id","valor":"test","development":"bodasdehoy"}}'
```

**Resultado:**
```json
{"errors":[{"message":"Cannot query field \"queryenEvento\" on type \"Query\".","code":"GRAPHQL_VALIDATION_FAILED"}]}
```

---

### 2. `getPsTemplate`

**Uso:** Obtener plantillas de presupuesto

```bash
curl -s -X POST "https://api.bodasdehoy.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"query($uid:String){getPsTemplate(uid:$uid){_id}}","variables":{"uid":"test"}}'
```

**Resultado:**
```json
{"errors":[{"message":"Cannot query field \"getPsTemplate\" on type \"Query\".","code":"GRAPHQL_VALIDATION_FAILED"}]}
```

---

### 3. `updateActivity`

**Uso:** Registrar actividad del usuario

```bash
curl -s -X POST "https://api.bodasdehoy.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation($args:inputActivity){updateActivity(args:$args)}","variables":{"args":{"activity":"logged"}}}'
```

**Resultado:**
```json
{"errors":[{"message":"Unknown type \"inputActivity\".","code":"GRAPHQL_VALIDATION_FAILED"},{"message":"Cannot query field \"updateActivity\" on type \"Mutation\".","code":"GRAPHQL_VALIDATION_FAILED"}]}
```

---

## Acción Requerida

Agregar estas queries/mutations al backend de `api.bodasdehoy.com`.
