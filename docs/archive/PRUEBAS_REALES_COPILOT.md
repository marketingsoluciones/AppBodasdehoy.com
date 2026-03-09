# 🧪 Pruebas Reales del Copilot - Casos de Uso

## 📋 Casos de Prueba con Preguntas Reales

### Categoría 1: Planificación Básica del Evento

#### Test 1.1: Consulta sobre cantidad de invitados
**Pregunta**: "¿Cuántos invitados tengo confirmados para mi boda?"

**Resultado esperado**:
- ✅ El copilot accede a los datos del evento actual
- ✅ Cuenta los invitados con estado "confirmado"
- ✅ Muestra el número total y posiblemente desglose

**Contexto necesario**:
- Usuario logueado
- Evento seleccionado con invitados registrados

---

#### Test 1.2: Consulta sobre presupuesto
**Pregunta**: "¿Cuánto llevo gastado de mi presupuesto?"

**Resultado esperado**:
- ✅ Accede a presupuesto_objeto del evento
- ✅ Suma gastos registrados
- ✅ Compara con presupuesto total
- ✅ Muestra porcentaje gastado

---

#### Test 1.3: Consulta sobre tareas pendientes
**Pregunta**: "¿Qué tareas me faltan completar para la boda?"

**Resultado esperado**:
- ✅ Lista tareas con estado "pendiente" o "en progreso"
- ✅ Muestra fechas límite
- ✅ Prioriza por fecha/importancia

---

### Categoría 2: Consultas de Navegación

#### Test 2.1: Navegación a módulo específico
**Pregunta**: "Llévame a la lista de invitados"

**Resultado esperado**:
- ✅ Genera link clickeable o navega directamente
- ✅ URL correcta: `/invitados` o similar
- ✅ Mantiene evento seleccionado

---

#### Test 2.2: Navegación a presupuesto
**Pregunta**: "Quiero ver mi presupuesto"

**Resultado esperado**:
- ✅ Navega a `/presupuesto`
- ✅ Evento actual en contexto

---

### Categoría 3: Consultas de Análisis

#### Test 3.1: Análisis de confirmaciones
**Pregunta**: "¿Cuántos invitados han confirmado asistencia?"

**Resultado esperado**:
- ✅ Cuenta invitados confirmados vs total
- ✅ Calcula porcentaje
- ✅ Muestra desglose si es posible

---

#### Test 3.2: Estado del presupuesto
**Pregunta**: "¿Estoy dentro del presupuesto?"

**Resultado esperado**:
- ✅ Compara gastado vs presupuestado
- ✅ Indica si está sobre/bajo presupuesto
- ✅ Sugiere ajustes si es necesario

---

#### Test 3.3: Tiempo restante
**Pregunta**: "¿Cuántos días faltan para mi boda?"

**Resultado esperado**:
- ✅ Calcula días desde hoy hasta fecha del evento
- ✅ Muestra cuenta regresiva
- ✅ Puede sugerir próximos pasos

---

### Categoría 4: Asistencia y Recomendaciones

#### Test 4.1: Sugerencias de organización
**Pregunta**: "¿Qué debería hacer primero para organizar mi boda?"

**Resultado esperado**:
- ✅ Analiza estado actual del evento
- ✅ Identifica áreas vacías (sin invitados, sin presupuesto, etc.)
- ✅ Sugiere pasos prioritarios

---

#### Test 4.2: Ayuda con mesas
**Pregunta**: "¿Cómo organizo las mesas para la recepción?"

**Resultado esperado**:
- ✅ Explica el módulo de mesas
- ✅ Sugiere distribución según número de invitados
- ✅ Puede ofrecer navegar al módulo

---

#### Test 4.3: Ayuda con invitaciones
**Pregunta**: "¿Cómo envío las invitaciones por WhatsApp?"

**Resultado esperado**:
- ✅ Explica proceso de envío de invitaciones
- ✅ Menciona requisitos (plantilla, lista de invitados)
- ✅ Ofrece navegar al módulo de invitaciones

---

### Categoría 5: Consultas Contextuales

#### Test 5.1: Información del evento
**Pregunta**: "¿Cuándo es mi boda?"

**Resultado esperado**:
- ✅ Muestra fecha del evento
- ✅ Formato legible (ej: "15 de agosto de 2026")
- ✅ Días restantes

---

#### Test 5.2: Tipo de evento
**Pregunta**: "¿Qué tipo de evento tengo registrado?"

**Resultado esperado**:
- ✅ Muestra tipo de evento (boda, cumpleaños, etc.)
- ✅ Detalles relevantes al tipo

---

#### Test 5.3: Múltiples eventos
**Pregunta**: "¿Cuántos eventos tengo registrados?"

**Resultado esperado**:
- ✅ Cuenta total de eventos
- ✅ Lista nombres de eventos
- ✅ Puede ofrecer cambiar entre eventos

---

### Categoría 6: Integración con Módulos

#### Test 6.1: Crear invitado
**Pregunta**: "Agrega a Juan Pérez como invitado"

**Resultado esperado**:
- ✅ Intenta crear invitado con ese nombre
- ✅ Solicita información adicional si es necesaria
- ✅ Confirma creación exitosa

---

#### Test 6.2: Consultar itinerario
**Pregunta**: "¿Qué actividades tengo planeadas para el día de la boda?"

**Resultado esperado**:
- ✅ Accede al itinerario del evento
- ✅ Lista actividades por hora
- ✅ Muestra detalles de cada actividad

---

#### Test 6.3: Agregar tarea
**Pregunta**: "Recuérdame contratar el fotógrafo para el 20 de marzo"

**Resultado esperado**:
- ✅ Crea tarea en servicios/itinerario
- ✅ Asigna fecha límite
- ✅ Confirma creación

---

### Categoría 7: Consultas Complejas

#### Test 7.1: Resumen general
**Pregunta**: "Dame un resumen completo de mi evento"

**Resultado esperado**:
- ✅ Información general (nombre, fecha, tipo)
- ✅ Estadísticas (invitados, presupuesto)
- ✅ Estado de progreso
- ✅ Tareas pendientes principales

---

#### Test 7.2: Comparación de datos
**Pregunta**: "¿Tengo más invitados confirmados o pendientes?"

**Resultado esperado**:
- ✅ Cuenta ambas categorías
- ✅ Compara números
- ✅ Muestra porcentajes

---

#### Test 7.3: Análisis financiero
**Pregunta**: "¿En qué estoy gastando más dinero?"

**Resultado esperado**:
- ✅ Analiza categorías de presupuesto
- ✅ Identifica categoría con mayor gasto
- ✅ Muestra desglose y porcentajes

---

## 🎯 Métricas de Éxito

Para cada prueba, evaluar:

1. **Precisión**: ¿La respuesta es correcta?
2. **Relevancia**: ¿Responde exactamente lo que se preguntó?
3. **Acción**: ¿Ofrece acciones útiles (navegar, crear, etc.)?
4. **Contexto**: ¿Usa correctamente los datos del usuario/evento?
5. **UX**: ¿La respuesta es clara y útil?

---

## 📝 Formato de Resultados

Para cada test, documentar:

```markdown
### Test X.Y: [Nombre]

**Pregunta**: "[Pregunta exacta]"

**Resultado Obtenido**:
- Respuesta del copilot
- Acciones realizadas
- Datos mostrados

**Evaluación**:
- ✅/❌ Precisión: [Comentario]
- ✅/❌ Relevancia: [Comentario]
- ✅/❌ Acción: [Comentario]
- ✅/❌ Contexto: [Comentario]
- ✅/❌ UX: [Comentario]

**Nota**: [Observaciones adicionales]
```

---

## 🚀 Ejecución de Pruebas

### Preparación

1. ✅ Servidores corriendo (web + copilot)
2. ⏳ Usuario con login activo
3. ⏳ Evento seleccionado con datos:
   - Invitados registrados
   - Presupuesto configurado
   - Tareas creadas
   - Fecha del evento

### Proceso

1. Abrir http://127.0.0.1:8080
2. Hacer login
3. Seleccionar evento de prueba
4. Abrir ChatSidebar (click en icono)
5. Ejecutar cada pregunta
6. Documentar resultados

---

## 📊 Casos Especiales a Probar

### Usuario Sin Evento
**Pregunta**: "¿Cuántos invitados tengo?"
**Esperado**: Mensaje indicando que no hay evento seleccionado

### Usuario Invitado (sin login)
**Pregunta**: "¿Qué puedo hacer con esta app?"
**Esperado**: Explicación básica de funcionalidades

### Evento Sin Datos
**Pregunta**: "Dame un resumen de mi boda"
**Esperado**: Indicar que el evento está vacío, sugerir empezar a agregar información

---

## 🎬 Próximos Pasos

1. Ejecutar cada categoría de tests
2. Documentar resultados en [RESULTADOS_PRUEBAS_COPILOT.md](RESULTADOS_PRUEBAS_COPILOT.md)
3. Identificar problemas o mejoras
4. Ajustar integración si es necesario

---

**Fecha**: 6 de febrero de 2026
**Estado**: ✅ Listo para ejecutar
**Ejecutor**: Usuario con eventos de prueba
