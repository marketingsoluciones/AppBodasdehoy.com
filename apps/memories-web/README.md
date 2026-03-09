# Memories Standalone

Web independiente solo de **Memories** (álbumes por evento). Usa el paquete `@bodasdehoy/memories`.

## Uso

- **Desarrollo:** `pnpm dev` (puerto 3080).
- **Producción:** `pnpm build && pnpm start`.

## Configuración

- `NEXT_PUBLIC_MEMORIES_API_URL`: URL base de la API de Memories (por defecto `https://api-ia.bodasdehoy.com`).
- `NEXT_PUBLIC_DEVELOPMENT`: development/whitelabel (por defecto `bodasdehoy`).

## Autenticación

En esta app mínima no hay login integrado. Opciones:

1. **Desarrollo:** Pasar `?userId=tu@email.com` en la URL o usar el formulario en la página.
2. **Producción:** Definir cómo se obtiene el usuario (sesión Firebase, JWT, cookie, etc.) y pasar `userId` al montar `<MemoriesProvider userId={...}>`. Documentar en el proyecto que integre esta app cómo se resuelve el usuario autenticado.

## Deploy

Despliega en Vercel (o similar) con las env anteriores. Dominio ejemplo: `memories.bodasdehoy.com`.
