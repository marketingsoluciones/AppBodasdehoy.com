# Qué base de datos usa chat-ia (y por qué suena a “Postgres”)

## No hace falta tener Postgres instalado

En el proyecto **no es obligatorio** tener un servidor Postgres instalado en tu máquina. La confusión viene de que el código usa **SQL y esquema compatibles con Postgres**, pero el motor concreto puede ser otro.

## Qué se usa en cada entorno

El paquete `@lobechat/database` y la app chat-ia usan **siempre** un motor que entiende **SQL de Postgres**:

| Entorno | Motor | Qué es |
|--------|--------|--------|
| **Web en modo servidor** (`NEXT_PUBLIC_SERVICE_MODE=server`) | **Neon** o **node-postgres** | Neon = Postgres serverless (hosted). node-postgres = conexión a una URL de Postgres (puede ser Neon, Supabase, etc.). |
| **Electron / desktop** | **PGLite** | Postgres embebido (archivo local), no necesitas instalar Postgres. |
| **Web sin modo servidor** | *(sin BD servidor)* | `getDBInstance()` devuelve un mock; la persistencia va por otro camino (ej. cliente). |

Es decir:

- Si usas **Neon** o cualquier hosting que te da una `DATABASE_URL`: ese servicio es Postgres (o compatible).
- Si usas **PGLite** (desktop): es un Postgres embebido, no un “Postgres instalado” en el sistema.
- Por eso cuando en documentación o errores se habla de “Postgres” se refiere a **“el motor que ejecuta este SQL”** (Neon, PGLite, node-postgres), no a “tener que instalar Postgres en tu PC”.

## Esquema y errores (ej. `insert into "topics"`)

- Los esquemas están en `packages/database/src/schemas/` con **Drizzle** y tipos **pg** (Postgres).
- Cualquier error tipo `Failed query: insert into "topics" ...` viene de **ese** motor (Neon, PGLite o node-postgres), que usa el mismo SQL.
- Las correcciones que hacemos (valores `null` vs `''`, índices únicos, etc.) aplican a **cualquiera** de esos motores, porque todos siguen el mismo esquema y SQL.

## Resumen

- **No usamos Postgres** en el sentido de “servidor Postgres instalado por nosotros”.
- **Sí usamos** un motor compatible con SQL de Postgres: **Neon**, **PGLite** o **node-postgres**, según el entorno.
- Por eso en análisis de errores a veces se dice “Postgres”: es por el tipo de SQL y restricciones, no porque tengáis que instalar o administrar Postgres.
