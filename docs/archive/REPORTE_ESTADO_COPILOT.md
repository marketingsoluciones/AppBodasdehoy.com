# 📊 Reporte de Estado - Copilot Web App

**Generado**: 6/2/2026, 18:22:28

---

## 🖥️ Estado de Servidores

✅ **Web App**: 200 (211ms)
❌ **Copilot Local**: TIMEOUT 
❌ **Copilot Test**: TIMEOUT 

---

## 🎨 Layout Actual

**Configuración**: NO SIDEBAR

### Sidebar (Copilot)
❌ No encontrado

### Contenido Principal

- **Left**: 380px
- **Width**: 1212px
- **Margin Left**: 0px
- **Margin Right**: 0px


### Navbar

- **Height**: 20px
- **Width**: 382.078125px


---

## 📋 Logs de Consola (Últimos 20)

```
[log] [App] ✅ http://127.0.0.1:8080/api/proxy-bodas/graphql - Status: 500
[startGroup] 🔍 Verificación de URLs y Dominios
[log] ✅ http://127.0.0.1:8080 - 200 (undefinedms)
[log] ✅ http://127.0.0.1:8080/api/proxy-bodas/graphql - 500 (undefinedms)
[log] 
📋 Información del Dominio:
[log]   Hostname: 127.0.0.1
[log]   Origin: http://127.0.0.1:8080
[log]   Domain: 0.1
[log]   Subdomain: 127.0
[log]   Is Localhost: true
[log]   Is Test Domain: false
[endGroup] console.groupEnd
[log] [CopilotDirect] Using URL: http://localhost:3210/bodasdehoy/chat?developer=bodasdehoy
[log] [CopilotDirect] Using URL: http://localhost:3210/bodasdehoy/chat?developer=bodasdehoy
[error] Failed to load resource: the server responded with a status of 524 ()
[log] [CopilotPrewarmer] ✅ Pre-calentado: https://chat-test.bodasdehoy.com/bodasdehoy/chat
[error] WebSocket connection to 'ws://127.0.0.1:8080/_next/webpack-hmr' failed: 
[log] [CopilotPrewarmer] ⚠️ No se pudo pre-calentar: https://chat-test.bodasdehoy.com/bodasdehoy
[log] [CopilotPrewarmer] 🚀 Pre-calentamiento completado
[log] [HMR] connected
```

---

## ❌ Errores Detectados

- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 524 ()
- [error] WebSocket connection to 'ws://127.0.0.1:8080/_next/webpack-hmr' failed: 

---

## 📈 Histórico de Estado

```
[17:19:58] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:19:58] 🔄 Reporte actualizado
[17:20:08] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:20:08] 🔄 Reporte actualizado
[17:20:18] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:20:18] 🔄 Reporte actualizado
[17:20:28] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:20:28] 🔄 Reporte actualizado
[17:20:38] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:20:38] 🔄 Reporte actualizado
[17:20:48] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:20:48] 🔄 Reporte actualizado
[17:20:58] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:20:58] 🔄 Reporte actualizado
[17:21:08] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:21:08] 🔄 Reporte actualizado
[17:21:09] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:21:09] 🔄 Reporte actualizado
[17:21:18] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:21:18] 🔄 Reporte actualizado
[17:21:28] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:21:28] 🔄 Reporte actualizado
[17:21:38] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:21:38] 🔄 Reporte actualizado
[17:21:48] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:21:48] 🔄 Reporte actualizado
[17:21:58] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:21:58] 🔄 Reporte actualizado
[17:22:18] ✅ Reporte guardado en: /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
[17:22:18] 🔄 Reporte actualizado
```

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real
```bash
tail -f /Users/juancarlosparra/Projects/AppBodasdehoy.com/REPORTE_ESTADO_COPILOT.md
```

### Reiniciar servidor web
```bash
pkill -f "next dev.*8080"
pnpm --filter @bodasdehoy/web dev
```

### Reiniciar copilot
```bash
pkill -f "next dev.*3210"
pnpm --filter @bodasdehoy/copilot dev
```

### Ver estado de procesos
```bash
ps aux | grep -E "(8080|3210)" | grep next
```

---

**Última actualización**: 2026-02-06T17:22:28.072Z
