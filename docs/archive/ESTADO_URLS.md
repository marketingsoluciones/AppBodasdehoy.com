# 🌐 Estado de URLs - Verificación 2026-02-06 06:35 AM

## ✅ URLs Funcionando Correctamente

### Servicios Locales

| URL | Estado | Notas |
|-----|---------|-------|
| http://localhost:8080 | ✅ 200 | Web App principal |
| http://localhost:3210 | ✅ 200 | Copilot raíz |
| http://localhost:3210/bodasdehoy/admin/playground | ✅ 200 | **Playground** - Usar para tests |
| http://localhost:8080/probar-chat-test.html | ✅ 200 | Página de test del chat |

### Servicios Remotos

| URL | Estado | Notas |
|-----|---------|-------|
| https://api-ia.bodasdehoy.com/health | ✅ 200 | Backend Python IA |
| https://api-ia.bodasdehoy.com/api/config | ✅ 200 | Configuración |

---

## ❌ URLs Con Problemas

### Servidor chat-test.bodasdehoy.com

| URL | Estado | Error |
|-----|---------|-------|
| https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests | ❌ 502 | Bad Gateway - Servidor caído |

**Problema**: El servidor de chat-test está caído o mal configurado.

**Solución Temporal**:
- Usa el **Playground local** en su lugar: http://localhost:3210/bodasdehoy/admin/playground
- O la página de **test local**: http://localhost:8080/probar-chat-test.html

**Acción Requerida**: Contactar DevOps para revisar el servidor chat-test.bodasdehoy.com

---

## 🎯 URLs Recomendadas para Testing

### Desarrollo Local (RECOMENDADO)

1. **Playground** - Principal herramienta de testing
   ```
   http://localhost:3210/bodasdehoy/admin/playground
   ```
   - ✅ Funcional
   - ✅ 9 preguntas disponibles
   - ✅ Interfaz completa
   - ⚠️ Respuestas limitadas por problema de Groq

2. **Chat Test (iframe)**
   ```
   http://localhost:8080/probar-chat-test.html
   ```
   - ✅ Prueba del iframe
   - ✅ Monitoreo visual

3. **Web App**
   ```
   http://localhost:8080
   ```
   - ✅ Aplicación principal
   - ✅ Todas las rutas funcionando

### Producción/Staging

1. **Backend Python IA**
   ```
   https://api-ia.bodasdehoy.com
   ```
   - ✅ Health check funcional
   - ✅ API disponible
   - ⚠️ Provider Groq con problemas

---

## 📊 Resumen de Estado

### Por Ambiente

**Local (Desarrollo)**:
- Total URLs: 4
- Funcionando: 4/4 (100%)
- Con problemas: 0

**Remoto (Producción/Staging)**:
- Total URLs: 3
- Funcionando: 2/3 (67%)
- Con problemas: 1 (chat-test.bodasdehoy.com)

### Por Tipo

**Interfaces Web**:
- Local: ✅ 100% funcionando
- Remoto: ❌ chat-test.bodasdehoy.com caído

**APIs/Backend**:
- ✅ 100% funcionando
- ⚠️ Provider Groq con limitaciones

---

## 🔧 Comandos de Verificación

### Verificar Estado Actual

```bash
# Verificar servicios locales
echo "Web App:" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080
echo "Copilot:" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3210
echo "Playground:" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3210/bodasdehoy/admin/playground

# Verificar servicios remotos
echo "Backend Python:" && curl -s https://api-ia.bodasdehoy.com/health | jq -r '.status'
echo "Chat Test:" && curl -s -o /dev/null -w "%{http_code}\n" https://chat-test.bodasdehoy.com
```

### Script de Verificación Completa

```bash
./scripts/test-playground-manual.sh
```

Este script verifica todos los servicios automáticamente.

---

## 🚀 Quick Start

**Para empezar a probar ahora mismo**:

1. Abre el Playground:
   ```
   http://localhost:3210/bodasdehoy/admin/playground
   ```

2. O ejecuta el script de test:
   ```bash
   ./scripts/test-playground-manual.sh
   ```

---

## 📝 Notas Importantes

### chat-test.bodasdehoy.com (502)

**¿Por qué está caído?**
- Servidor no responde
- Posible problema de configuración
- Puede estar en mantenimiento

**¿Cómo afecta?**
- No afecta el desarrollo local
- Tests automáticos que usan esta URL fallarán
- Playground local funciona perfectamente

**¿Qué hacer?**
1. Usa URLs locales para desarrollo
2. Informa al equipo de DevOps
3. Espera a que se resuelva
4. Mientras tanto, todo funciona localmente

---

## 📞 Reportar Problemas

### chat-test.bodasdehoy.com (502)

**Para reportar**:
```
Servicio: chat-test.bodasdehoy.com
Error: 502 Bad Gateway
Timestamp: 2026-02-06 06:35 AM
Impacto: TestSuite online no accesible
Workaround: Usar Playground local
```

**Equipo a contactar**: DevOps / Infraestructura

---

**Última verificación**: 2026-02-06 06:35 AM
**Próxima verificación recomendada**: En 1 hora o cuando DevOps reporte fix
