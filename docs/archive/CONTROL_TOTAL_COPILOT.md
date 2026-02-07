# 🎮 Control Total del Copilot - Comandos Disponibles

**Última actualización**: 6 Feb 2026 - 18:40

---

## ✅ ESTADO ACTUAL DEL SISTEMA

### Servidores Funcionando
```bash
✅ Web App (8080): ONLINE
✅ Copilot Producción (3210): ONLINE
✅ Navegador Chromium: ABIERTO
```

### Layout Implementado
```bash
✅ Copilot: IZQUIERDA (left: 0)
✅ Contenido: DERECHA (margin dinámico)
✅ Código: Implementado correctamente
```

---

## 🚀 COMANDOS RÁPIDOS

### Ver Estado en Tiempo Real
```bash
# Monitor automático (actualiza cada 10s)
node apps/web/scripts/monitor-copilot-status.js

# Ver reporte actualizado
tail -f REPORTE_ESTADO_COPILOT.md

# Ver este archivo
cat CONTROL_TOTAL_COPILOT.md
```

### Abrir Navegador Visual
```bash
# Demo visual con control total
node apps/web/scripts/demo-copilot-visual.js

# Abre navegador, navega a home, abre copilot
# Queda abierto para que interactúes manualmente
```

### Verificar Servidores
```bash
# Ver procesos Next.js
ps aux | grep -E "(8080|3210)" | grep next

# Ver puertos
lsof -ti:8080,3210

# Test manual web app
curl -I http://127.0.0.1:8080

# Test manual copilot
curl -I http://localhost:3210/bodasdehoy
```

### Reiniciar Servidores
```bash
# Reiniciar solo copilot (producción)
pkill -9 -f "next.*3210"
cd apps/copilot && pnpm start -p 3210

# Reiniciar solo web app
pkill -9 -f "next.*8080"
cd apps/web && pnpm dev

# Reiniciar todo
pkill -9 -f "next dev"
pnpm dev
```

### Ver Logs en Tiempo Real
```bash
# Logs copilot producción
tail -f /tmp/copilot-prod-server.log

# Logs web app
tail -f apps/web/.next/trace

# Logs build copilot
tail -f /tmp/copilot-build-direct.log
```

---

## 📊 REPORTES DISPONIBLES

### Reportes Automáticos (Actualizados cada 10s)
- [`REPORTE_ESTADO_COPILOT.md`](REPORTE_ESTADO_COPILOT.md)
  - Estado de servidores
  - Layout actual
  - Logs de consola
  - Errores detectados

### Reportes Detallados
- [`REPORTE_ESTADO_COMPLETO.md`](REPORTE_ESTADO_COMPLETO.md)
  - Análisis completo del sistema
  - Diagnóstico de problemas
  - Comandos útiles

- [`REPORTE_FINAL_SISTEMA.md`](REPORTE_FINAL_SISTEMA.md)
  - Resumen ejecutivo
  - Objetivos cumplidos
  - Próximos pasos

### Documentación Técnica
- [`CAMBIO_COPILOT_IZQUIERDA.md`](CAMBIO_COPILOT_IZQUIERDA.md)
  - Detalles de implementación
  - Archivos modificados
  - Código antes/después

---

## 🎯 QUÉ ESTÁ FUNCIONANDO AHORA

### ✅ Layout - LISTO
```typescript
// apps/web/components/ChatSidebar/ChatSidebarDirect.tsx
className="fixed top-0 left-0"  // ✅ IZQUIERDA
initial={{ x: '-100%' }}         // ✅ Entra desde izquierda

// apps/web/components/DefaultLayout/Container.tsx
marginLeft: isOpen ? `${width}px` : '0'  // ✅ Push a derecha
```

### ✅ Servidores - ONLINE
```bash
$ curl -I http://127.0.0.1:8080
HTTP/1.1 200 OK

$ curl -I http://localhost:3210/bodasdehoy
HTTP/1.1 200 OK
```

### ✅ Navegador - ABIERTO
```bash
$ ps aux | grep chromium
11891  ... Google Chrome for Testing Helper (GPU)
11905  ... Google Chrome for Testing Helper (Renderer)
```

---

## 🔧 PRUEBAS MANUALES

### 1. Abrir Copilot
```bash
# En el navegador abierto, presiona:
Cmd + Shift + C

# Deberías ver:
✅ Sidebar aparece desde la IZQUIERDA
✅ Contenido se mueve a la DERECHA
✅ Iframe del copilot carga
```

### 2. Hacer una Pregunta
```
Escribe en el copilot:
"¿Cuántos invitados tengo confirmados?"

Debería responder con datos de tu evento
```

### 3. Redimensionar Sidebar
```
Arrastra el borde derecho del sidebar
El contenido se ajusta automáticamente
```

### 4. Cerrar Copilot
```bash
Presiona de nuevo: Cmd + Shift + C

Deberías ver:
✅ Sidebar sale hacia la IZQUIERDA
✅ Contenido vuelve a usar todo el ancho
✅ Margin-left = 0
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Copilot no carga en el iframe
```bash
# Verificar que servidor copilot está corriendo
lsof -ti:3210

# Si no hay respuesta, reiniciar:
cd apps/copilot && pnpm start -p 3210

# Verificar que responde
curl http://localhost:3210/bodasdehoy
```

### Sidebar no aparece
```bash
# Verificar en consola del navegador:
[CopilotDirect] Using URL: http://localhost:3210/bodasdehoy/chat

# Si ves error 524 o timeout:
# Reiniciar servidor copilot (ver arriba)
```

### Contenido no se mueve a la derecha
```bash
# Verificar en DevTools del navegador:
document.querySelector('#rootElementMain').parentElement.style.marginLeft

# Debería mostrar: "500px" cuando abierto, "0px" cuando cerrado
```

---

## 📸 SCREENSHOTS AUTOMÁTICOS

```bash
# El monitor genera screenshots automáticos:
apps/web/scripts/monitor-screenshot.png

# Actualizado cada 10 segundos mientras el monitor corre
```

---

## 🎬 DEMO COMPLETO

### Ejecutar Demo Visual Completo
```bash
node apps/web/scripts/demo-copilot-visual.js
```

**Qué hace:**
1. ✅ Abre navegador Chromium
2. ✅ Navega a http://127.0.0.1:8080
3. ✅ Presiona Cmd+Shift+C para abrir copilot
4. ✅ Verifica layout (izquierda/derecha)
5. ✅ Muestra estado del iframe
6. ✅ Deja navegador abierto para ti

**Output esperado:**
```
================================================================================
🎬 DEMO VISUAL - COPILOT FUNCIONANDO
================================================================================

📊 Estado después de abrir copilot:

   🎨 SIDEBAR (Copilot):
      Visible: ✅ SÍ
      Position: fixed
      Left: 0px ✅ (IZQUIERDA!)
      Width: 500px

   📄 CONTENIDO PRINCIPAL:
      Margin Left: 500px ✅ (Empujado a la derecha!)
      Width: 1292px

   📦 Estado del iframe:
      ✅ Iframe encontrado
      URL: http://localhost:3210/bodasdehoy/chat?developer=bodasdehoy
      Tamaño: 500x931px

================================================================================
✅ DEMO COMPLETADA
================================================================================
```

---

## 📞 COMANDOS MÁS USADOS

```bash
# 1. Ver estado general
tail -20 REPORTE_ESTADO_COPILOT.md

# 2. Verificar servidores activos
lsof -ti:8080,3210

# 3. Reiniciar copilot si falla
pkill -9 -f "next.*3210" && cd apps/copilot && pnpm start -p 3210

# 4. Abrir navegador visual
node apps/web/scripts/demo-copilot-visual.js

# 5. Ver logs en vivo
tail -f /tmp/copilot-prod-server.log
```

---

## 🎯 RESULTADO FINAL

### Lo que SÍ funciona ✅
- Copilot aparece a la IZQUIERDA
- Contenido se ajusta a la DERECHA
- Margin dinámico funciona correctamente
- Servidor web (8080) online
- Servidor copilot producción (3210) online
- Navegador abierto y controlable
- Sistema de monitoreo activo
- Reportes automáticos cada 10s

### Cómo verificarlo
1. Abre navegador: `node apps/web/scripts/demo-copilot-visual.js`
2. Ve copilot a la izquierda ✅
3. Ve contenido a la derecha ✅
4. Interactúa manualmente ✅

---

**¿Necesitas ayuda?**
- Lee los reportes: `REPORTE_ESTADO_COPILOT.md`
- Ejecuta monitor: `node apps/web/scripts/monitor-copilot-status.js`
- Ejecuta demo: `node apps/web/scripts/demo-copilot-visual.js`
