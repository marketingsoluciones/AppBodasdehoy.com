# ARQUITECTURA DEL PROYECTO

## REGLA FUNDAMENTAL

> **ESTE ES UN REPOSITORIO SOLO FRONTEND**
> - NO usar localhost ni IPs locales
> - Solo trabajar con URLs públicas (dominios)
> - El backend está en OTRA máquina

---

## DOMINIOS QUE GESTIONAMOS (Frontend)

| Subdominio | App | Descripción |
|------------|-----|-------------|
| `app-test.bodasdehoy.com` | apps/web | Organizador (desarrollo) |
| `chat-test.bodasdehoy.com` | apps/copilot | Chat IA (desarrollo) |
| `organizador.bodasdehoy.com` | apps/web | Organizador (producción) |
| `iachat.bodasdehoy.com` | apps/copilot | Chat IA (producción) |

---

## BACKENDS (NO gestionamos - otra máquina)

| Dominio | Función |
|---------|---------|
| `api.bodasdehoy.com` | API REST principal |
| `api-ia.bodasdehoy.com` | Backend IA (Python) |
| `api2.eventosorganizador.com` | GraphQL API |
| `apiapp.bodasdehoy.com` | API secundaria |
| `cms.bodasdehoy.com` | Sistema de contenido |

---

## ARQUITECTURA

```
┌─────────────────────────────────────────────────┐
│     ESTE REPOSITORIO (Frontend Next.js 15)     │
│                                                 │
│  ┌─────────────────┐    ┌──────────────────┐   │
│  │    apps/web     │    │   apps/copilot   │   │
│  │  (Organizador)  │    │    (Chat IA)     │   │
│  │                 │    │                  │   │
│  │ app-test.bodas  │    │ chat-test.bodas  │   │
│  │ organizador.*   │    │ iachat.*         │   │
│  └────────┬────────┘    └────────┬─────────┘   │
│           │                      │             │
└───────────┼──────────────────────┼─────────────┘
            │                      │
       HTTPS/API              HTTPS/API
            │                      │
┌───────────▼──────────────────────▼─────────────┐
│          BACKEND (otra máquina)                │
│                                                │
│  • api.bodasdehoy.com                          │
│  • api-ia.bodasdehoy.com                       │
│  • api2.eventosorganizador.com                 │
│  • Firebase (auth)                             │
│  • Neon DB (PostgreSQL)                        │
│  • Cloudflare R2 (storage)                     │
└────────────────────────────────────────────────┘
```

---

## REGLAS PARA DESARROLLO

### ❌ PROHIBIDO
- Ejecutar `pnpm dev` con localhost
- Usar IPs locales (127.0.0.1, 192.168.x.x)
- Intentar levantar el backend desde este repo
- Modificar configuración de APIs

### ✅ CORRECTO
- Probar siempre contra subdominios públicos
- Desplegar cambios a app-test/chat-test para probar
- Usar las APIs existentes sin modificarlas
- Verificar estado de dominios antes de trabajar

---

## VERIFICACIÓN DE ESTADO

```bash
# Frontend (lo que gestionamos)
curl -s -o /dev/null -w "%{http_code}" https://app-test.bodasdehoy.com
curl -s -o /dev/null -w "%{http_code}" https://chat-test.bodasdehoy.com

# Backend (solo verificar, no gestionar)
curl -s -o /dev/null -w "%{http_code}" https://api-ia.bodasdehoy.com/health
curl -s -o /dev/null -w "%{http_code}" https://api.bodasdehoy.com
```

---

## FLUJO DE TRABAJO

1. Hacer cambios en el código
2. Commit y push a la rama
3. Desplegar a app-test o chat-test
4. Verificar en el dominio público
5. Si funciona, crear PR hacia master

---

## VARIABLES DE ENTORNO IMPORTANTES

### apps/web
```env
NEXT_PUBLIC_DIRECTORY=https://app-test.bodasdehoy.com
NEXT_PUBLIC_BASE_URL=https://apiapp.bodasdehoy.com
NEXT_PUBLIC_BASE_API_BODAS=https://api.bodasdehoy.com
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

### apps/copilot
```env
APP_URL=https://chat-test.bodasdehoy.com
BACKEND_URL=https://api-ia.bodasdehoy.com
```
