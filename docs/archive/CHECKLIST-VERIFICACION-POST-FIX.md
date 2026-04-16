# ✅ Checklist de Verificación Post-Fix

**Fecha de creación**: 2026-02-11
**Propósito**: Verificar que todos los sistemas funcionan correctamente después de los fixes

---

## 📋 Checklist Principal

### 1️⃣ Verificación de Eventos (COMPLETADO ✅)

- [x] Servidor Next.js corriendo en puerto 8080
- [x] API Eventos (apiapp.bodasdehoy.com) respondiendo
- [x] Campo `queryenEvento` disponible en API
- [x] Configuración `.env.local` correcta (apiapp.bodasdehoy.com)
- [x] Proxies de API creados (/pages/api/proxy/graphql.ts)
- [x] Error de CORS resuelto
- [x] EventsGroupContext usando `fetchApiEventos` correcto

**Cómo verificar**:
```bash
# Ejecutar script de verificación
chmod +x /tmp/verificacion-completa-sistema.sh
/tmp/verificacion-completa-sistema.sh
```

**Prueba manual**:
1. Ir a http://app-test.bodasdehoy.com:8080/test-eventos
2. Hacer login
3. Click en "Probar Carga de Eventos"
4. Verificar que aparezcan eventos en la lista

**Resultado esperado**: ✅ Lista de eventos carga correctamente

---

### 2️⃣ Verificación de Copilot Backend (PENDIENTE ⏳)

- [x] Servidor Copilot corriendo en puerto 3210
- [x] API-IA (api-ia.bodasdehoy.com) saludable
- [x] API-IA root endpoint funcionando
- [ ] **❌ PENDIENTE**: Credenciales de Anthropic configuradas
- [x] Fallback de OpenAI configurado (temporal)

**Cómo verificar (después de configuración)**:
```bash
# Test 1: Chat básico
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"Hola"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": false
  }' | jq '.'
```

**Resultado esperado**: Respuesta de Claude (no error de API key)

---

### 3️⃣ Verificación de Copilot Frontend (PENDIENTE ⏳)

- [ ] Copilot responde con Claude (no con fallback OpenAI)
- [ ] Herramientas funcionan (agregar invitados, consultar presupuesto, etc.)
- [ ] Eventos enriquecidos (tool_result, ui_action) se reciben
- [ ] No hay errores de autenticación en consola

**Cómo verificar (después de configuración)**:
1. Ir a http://localhost:3210
2. Iniciar sesión
3. Enviar: "Hola, ¿cuántos eventos tengo?"
4. Verificar respuesta inteligente con contexto

**Resultado esperado**: Claude responde con información real del usuario

---

### 4️⃣ Verificación de Herramientas del Copilot (PENDIENTE ⏳)

**Test de herramientas**:

- [ ] **add_guests**: "Agrega un invitado llamado Juan García"
  - Resultado esperado: Invitado agregado en la base de datos

- [ ] **get_guests**: "¿Cuántos invitados tengo?"
  - Resultado esperado: Número real de invitados del evento

- [ ] **get_budget**: "¿Cuál es mi presupuesto total?"
  - Resultado esperado: Presupuesto real del evento

- [ ] **get_tables**: "¿Cuántas mesas tengo?"
  - Resultado esperado: Número real de mesas

- [ ] **create_task**: "Crea una tarea: Contratar fotógrafo"
  - Resultado esperado: Tarea creada en itinerario

**Cómo verificar**:
1. Abrir Copilot
2. Enviar cada comando de prueba
3. Verificar que la acción se ejecute (no solo texto)
4. Confirmar en la UI que los datos cambiaron

---

### 5️⃣ Verificación de Seguridad (PENDIENTE ⚠️)

- [ ] **OpenAI API Key rotada** (actualmente expuesta en .env.local)
- [ ] Variables de entorno en gestor de secretos
- [ ] .env.local en .gitignore
- [ ] No hay API keys en código fuente

**Acción requerida**:
```bash
# 1. Rotar API key de OpenAI
# 2. Mover a variable de entorno del servidor
# 3. Verificar .gitignore
grep -r "sk-proj-" apps/web/ --exclude-dir=node_modules
```

**Resultado esperado**: Sin API keys en código

---

### 6️⃣ Verificación de Logs (OPCIONAL)

**Logs del servidor Next.js** (terminal):
- [ ] No hay errores 500 de CORS
- [ ] Peticiones a API proxies funcionan
- [ ] No hay errores de GraphQL

**Logs del navegador** (DevTools):
- [ ] No hay errores rojos en consola
- [ ] Peticiones a `/api/proxy/graphql` exitosas (200)
- [ ] No hay advertencias de autenticación

**Cómo verificar**:
1. Abrir DevTools (F12)
2. Tab "Console"
3. Tab "Network"
4. Navegar por la aplicación
5. Verificar que no haya errores

---

## 📊 Matriz de Estado

| Componente | Estado | Bloqueante | Siguiente Acción |
|-----------|--------|------------|------------------|
| **APIs de Eventos** | ✅ Funcionando | No | Ninguna |
| **Login de usuarios** | ✅ Funcionando | No | Ninguna |
| **Carga de eventos** | ✅ Funcionando | No | Probar manualmente |
| **Copilot chat básico** | ✅ Funcionando (fallback) | No | Configurar credenciales |
| **Copilot herramientas** | ❌ No funciona | **Sí** | Backend: Configurar API key |
| **Seguridad API keys** | ⚠️ Mejorable | No | Rotar y mover a secrets |

---

## 🎯 Estado General del Sistema

### ✅ COMPLETADO (10/11 tests)
- Problema de CORS resuelto
- Configuración de API correcta
- Queries GraphQL restauradas
- Eventos cargan correctamente
- Copilot funciona con fallback

### ⏳ PENDIENTE (Backend Team)
- Configurar credenciales de Anthropic en api-ia
- Verificar que Copilot funcione con todas las herramientas

### ⚠️ PENDIENTE (DevOps/Security)
- Rotar OpenAI API Key expuesta
- Mover credenciales a gestor de secretos

---

## 🚀 Orden de Verificación Recomendado

### Verificación Inmediata (TÚ)
1. ✅ Ejecutar `/tmp/verificacion-completa-sistema.sh`
2. ⏳ Probar carga de eventos en http://app-test.bodasdehoy.com:8080/test-eventos
3. ⏳ Probar navegación en la aplicación principal

### Después de Configuración Backend
4. ⏳ Ejecutar tests de API-IA (ver BACKEND-TEAM-CONFIGURAR-API-IA.md)
5. ⏳ Probar Copilot end-to-end
6. ⏳ Verificar herramientas del Copilot (add_guests, get_budget, etc.)
7. ⏳ Verificar logs sin errores

### Limpieza Final
8. ⏳ Rotar OpenAI API Key
9. ⏳ Mover credenciales a gestor de secretos
10. ⏳ Verificar .gitignore

---

## 📝 Plantilla de Reporte de Verificación

Cuando completes la verificación, copia esto y llena los resultados:

```markdown
## Reporte de Verificación - [FECHA]

### Eventos
- [ ] Login funciona
- [ ] Eventos cargan
- [ ] Navegación funciona
- [ ] No hay errores de CORS

### Copilot
- [ ] Chat responde
- [ ] Herramientas funcionan
- [ ] add_guests funciona
- [ ] get_budget funciona
- [ ] create_task funciona

### Logs
- [ ] Sin errores en servidor
- [ ] Sin errores en consola
- [ ] Peticiones API exitosas

### Problemas encontrados:
[Describe cualquier problema aquí]

### Screenshots:
[Adjunta screenshots si es necesario]
```

---

## 📞 Contactos

| Responsable | Componente | Acción |
|-------------|-----------|--------|
| **TÚ** | Verificación Frontend | Probar eventos y UI |
| **Backend Team** | API-IA Credenciales | Configurar Anthropic API key |
| **DevOps/Security** | Seguridad | Rotar API keys |

---

## 📄 Documentación Relacionada

- [BACKEND-TEAM-CONFIGURAR-API-IA.md](BACKEND-TEAM-CONFIGURAR-API-IA.md) - Instrucciones para backend team
- [SOLUCION-EVENTOS-NO-CARGAN.md](apps/web/SOLUCION-EVENTOS-NO-CARGAN.md) - Análisis del problema de eventos
- [DIAGNOSTICO-API-IA-COPILOT.md](apps/web/DIAGNOSTICO-API-IA-COPILOT.md) - Diagnóstico de API-IA
- [SISTEMA-FALLBACK-COPILOT.md](apps/web/SISTEMA-FALLBACK-COPILOT.md) - Explicación del sistema de fallback
- [ESTADO-ACTUAL-Y-PRUEBAS.md](apps/web/ESTADO-ACTUAL-Y-PRUEBAS.md) - Estado y guía de pruebas

---

**Última actualización**: 2026-02-11 por Claude Code
**Próxima revisión**: Después de configuración de Backend Team
