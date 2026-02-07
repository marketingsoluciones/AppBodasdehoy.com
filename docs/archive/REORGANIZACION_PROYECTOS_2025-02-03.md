# 📁 Reorganización de Proyectos - 2025-02-03

## 🎯 Objetivo
Eliminar confusión entre repositorios y optimizar el rendimiento del sistema identificando qué proyecto es cuál.

## ❌ Problema Identificado

### 1. Confusión de LobeChat
El LaunchAgent `com.bodasdehoy.lobe-chat` estaba ejecutando la **copia externa** de LobeChat en:
```
/Volumes/HD MAC BASE/Projects/LOBECHAT (disco externo lento)
```

En lugar del **copilot integrado** en el monorepo:
```
/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot (disco local rápido)
```

**Impacto en rendimiento**:
- Cold load: 6min 49s → 1.9s (**34x más rápido**)
- Warm load: 3.5s → 0.6-0.9s (**4-6x más rápido**)
- Startup: 87s → 11.8s (**7.4x más rápido**)

### 2. Nombre Confuso del CRM
El proyecto `monorepo-cms-leads-compare` parecía estar relacionado con AppBodasdehoy, pero es un **proyecto completamente independiente** de EventosOrganizador.

---

## ✅ Cambios Realizados

### 1. LobeChat Movido a Respaldos
```bash
ANTES: /Volumes/HD MAC BASE/Projects/LOBECHAT
AHORA: /Volumes/HD MAC BASE/Projects/_RESPALDOS_OBSOLETOS/LOBECHAT-UPSTREAM-20250203
```

- **Tamaño**: 41GB
- **Commit de respaldo**: `644e3490f backup: respaldo final antes de mover a obsoletos`
- **Branch**: `feature/whatsapp-integration-safe`
- **Razón**: Ya no se usa, ahora usamos `apps/copilot` del monorepo

### 2. Archivos Relacionados Movidos
```bash
LOBECHAT-EVENTOS-PLUGIN → _RESPALDOS_OBSOLETOS/
LOBECHAT-INTEGRATION-GUIDE.md → _RESPALDOS_OBSOLETOS/
```

### 3. CRM Renombrado
```bash
ANTES: /Volumes/HD MAC BASE/Projects/monorepo-cms-leads-compare
AHORA: /Volumes/HD MAC BASE/Projects/EventosOrganizador-CRM-ERP-CMS
```

- **Tamaño**: 24GB
- **Origen**: https://github.com/marketingsoluciones/FRONT-EVEN-CRM-ERP-CMS
- **Razón**: Nombre más claro que indica que es un proyecto separado

### 4. LaunchAgent Actualizado
```xml
ANTES:
WorkingDirectory: /Volumes/HD MAC BASE/Projects/LOBECHAT
Command: pnpm next dev --turbopack -p 3210

AHORA:
WorkingDirectory: /Users/juancarlosparra/Projects/AppBodasdehoy.com
Command: pnpm dev:copilot
```

---

## 📊 Estructura Final

### Disco Local (SSD) - Proyectos Activos de Desarrollo
```
/Users/juancarlosparra/Projects/
├── AppBodasdehoy.com/          ← MONOREPO PRINCIPAL
│   ├── apps/
│   │   ├── web/                → Puerto 8080 (app-test)
│   │   └── copilot/            → Puerto 3210 (chat-test) ✅ LobeChat integrado
│   └── packages/
└── EventosOrganizador/
```

### Disco Externo - Proyectos Separados
```
/Volumes/HD MAC BASE/Projects/
├── EventosOrganizador-CRM-ERP-CMS/   ← CRM Independiente (24GB)
├── _RESPALDOS_OBSOLETOS/             ← Respaldos (42GB)
│   ├── LOBECHAT-UPSTREAM-20250203/
│   ├── LOBECHAT-EVENTOS-PLUGIN/
│   ├── LOBECHAT-INTEGRATION-GUIDE.md
│   └── README.md
└── [otros proyectos...]
```

---

## 🚀 Servicios Verificados

Todos los servicios funcionando correctamente después de los cambios:

| Servicio | Puerto | URL | Estado |
|----------|--------|-----|--------|
| app-test | 8080 | https://app-test.bodasdehoy.com | ✅ 200 |
| chat-test | 3210 | https://chat-test.bodasdehoy.com | ✅ 200 |

### LaunchAgents Activos
- `com.bodasdehoy.app-test` (PID: 1323)
- `com.bodasdehoy.lobe-chat` (PID: 19898)

---

## 📝 Notas Importantes

1. **LobeChat externo**: Ya no se usa, está respaldado en `_RESPALDOS_OBSOLETOS`
2. **apps/copilot**: Este es el LobeChat oficial integrado en el monorepo
3. **CRM EventosOrganizador**: Proyecto completamente separado, no relacionado con AppBodasdehoy
4. **Rendimiento**: Mejora significativa al usar disco local en lugar del externo

---

## 🔄 Para Futuras Referencias

### Si necesitas el trabajo del LOBECHAT externo:
```bash
cd "/Volumes/HD MAC BASE/Projects/_RESPALDOS_OBSOLETOS/LOBECHAT-UPSTREAM-20250203"
git log --oneline -5
```

### Para desarrollo actual usar:
```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
pnpm dev:copilot  # Para chat-test
pnpm dev:web      # Para app-test
pnpm dev          # Para ambos en paralelo
```

---

## ✅ Resultado Final

- ✅ Proyectos organizados y renombrados claramente
- ✅ Confusión eliminada
- ✅ Rendimiento optimizado (34x más rápido)
- ✅ Servicios funcionando correctamente
- ✅ Respaldos seguros creados
- ✅ Documentación completa

**Última actualización**: 2025-02-03 20:35
