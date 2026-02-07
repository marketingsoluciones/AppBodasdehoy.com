# Monorepo Bodas de Hoy

Aplicación organizador de eventos y chat IA para Bodas de Hoy.

## 🏗️ Estructura del Monorepo

```
├── apps/
│   ├── web/                    # Organizador de eventos (Next.js 15)
│   │   ├── components/         # Componentes React
│   │   ├── pages/              # Rutas de Next.js
│   │   ├── services/           # Servicios API
│   │   └── context/            # Contextos React
│   │
│   └── copilot/                # Chat IA - LobeChat (Next.js 15)
│       ├── src/                # Código fuente
│       └── .env*               # Configuración
│
├── packages/                   # Paquetes compartidos
│   └── copilot-ui/            # Componentes UI del copilot
│
├── docs/                      # Documentación
│   └── archive/               # Docs históricas (archivadas)
│
├── scripts/                   # Scripts útiles
├── ecosystem.config.js        # PM2 config (app-test + chat-test)
└── package.json              # Configuración del monorepo
```

## 🚀 Quick Start

### Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Levantar app web (puerto 8080)
pnpm dev:web

# Levantar copilot (puerto 3210)
pnpm dev:copilot

# Levantar ambos en paralelo
pnpm dev:local
```

### Build para Producción

```bash
# Build web
pnpm build:web

# Build copilot
pnpm build:copilot

# Build ambos
pnpm build
```

## 🌐 Dominios

| Entorno | App Web | Chat IA |
|---------|---------|---------|
| **Desarrollo Local** | http://localhost:8080 | http://localhost:3210 |
| **Test** | https://app-test.bodasdehoy.com | https://chat-test.bodasdehoy.com |
| **Producción** | https://organizador.bodasdehoy.com | https://iachat.bodasdehoy.com |

## 📦 Apps Principales

### apps/web - Organizador de Eventos

Aplicación organizador para gestión de eventos (bodas, bautizos, etc.).

**Tecnologías**:
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

**Features**:
- Gestión de invitados
- Presupuesto
- Mesas
- Itinerario
- Copilot IA integrado

### apps/copilot - Chat IA

Chat inteligente basado en LobeChat para asistencia en eventos.

**Tecnologías**:
- Next.js 15
- LobeChat
- PostgreSQL (Neon)
- Cloudflare R2 (storage)

**Features**:
- Chat conversacional
- Contexto de eventos
- MCP Tools
- Historial de conversaciones

## 🔧 Configuración

### Variables de Entorno

#### apps/web/.env.production
```env
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
NEXT_PUBLIC_EVENTSAPP=https://organizador.bodasdehoy.com
NEXT_PUBLIC_BASE_URL=https://apiapp.bodasdehoy.com
```

#### apps/copilot/.env
```env
APP_URL=https://iachat.bodasdehoy.com
DATABASE_URL=postgresql://...
S3_ENDPOINT=https://...
```

## 📚 Documentación

- [ARQUITECTURA.md](ARQUITECTURA.md) - Arquitectura del proyecto
- [QUICK_START.md](QUICK_START.md) - Guía rápida de inicio
- [DIAGNOSTICO_COPILOT_COMPLETO_2026.md](DIAGNOSTICO_COPILOT_COMPLETO_2026.md) - Diagnóstico del Copilot
- [SOLUCION_COMPLETA_COPILOT.md](SOLUCION_COMPLETA_COPILOT.md) - Soluciones implementadas
- [docs/](docs/) - Documentación adicional

## 🛠️ Scripts Útiles

```bash
# Desarrollo
pnpm dev:web              # Solo web
pnpm dev:copilot          # Solo copilot
pnpm dev:local            # Ambos apps

# Build
pnpm build:web            # Build web
pnpm build:copilot        # Build copilot

# Tests
pnpm test:web             # Tests de web
```

## 🚀 Deployment

### Con PM2 (Servidor)

```bash
# Iniciar servicios
pm2 start ecosystem.config.js

# Ver estado
pm2 list

# Ver logs
pm2 logs app-test
pm2 logs chat-test

# Reiniciar
./scripts/reiniciar-servicios-test.sh
```

## 📝 Notas Importantes

### Componente Nativo vs Iframe

El Copilot ahora usa **CopilotChatNative** (componente nativo) en lugar de iframe:

**Archivo**: `apps/web/components/ChatSidebar/ChatSidebar.tsx`
```tsx
import CopilotChatNative from '../Copilot/CopilotChatNative';
```

**Ventajas**:
- ✅ Editor completo
- ✅ Mejor rendimiento
- ✅ No depende de chat-test
- ✅ Más fácil de mantener

### chat-test.bodasdehoy.com

Para levantar chat-test en el servidor:

```bash
# 1. Verificar builds
ls -la apps/copilot/.next

# 2. Iniciar con PM2
pm2 start ecosystem.config.js

# 3. Verificar
curl -I https://chat-test.bodasdehoy.com
```

## 🤝 Contributing

1. Crear rama desde `master`
2. Hacer cambios
3. Commit y push
4. Crear PR

## 📄 License

Propietario - Bodas de Hoy

---

**Última actualización**: 2026-02-07
