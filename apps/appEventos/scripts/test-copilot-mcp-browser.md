# Test del Copilot con Login Real usando MCP Browser

## 🎯 Objetivo

Probar el Copilot en app-test.bodasdehoy.com con:
- Login REAL (sin bypass) con credenciales de `bodasdehoy.com@gmail.com`
- Obtener eventos del usuario
- Obtener invitados de "Isabel y Raul"
- Verificar que los resultados se muestren en el sidebar derecho
- **Verificar integración frontend-backend** (el backend YA está completo)
- Identificar qué funcionalidades faltan en el **frontend**

---

## ⚠️ IMPORTANTE: Backend YA Está Completo

Según análisis del backend (2026-02-03):
- ✅ **62 herramientas** implementadas (206% del requisito)
- ✅ **9 tipos de eventos SSE** (225% del requisito)
- ✅ **API2 integrado** para datos reales
- ✅ **Features extra**: event_card, confirm_required, export, QR, etc.

**Por lo tanto, este test se enfoca en:**
1. Verificar que el **frontend integra correctamente** con el backend
2. Identificar gaps en **auto-refresh** y **callbacks**
3. Documentar qué falta para UX completa

Ver: [BACKEND-COPILOT-ANALISIS.md](BACKEND-COPILOT-ANALISIS.md)

---

## ⚠️ Por qué MCP Browser y NO Playwright

**Playwright NO funciona porque:**
- Firebase detecta navegadores automatizados y NO se inicializa
- El overlay "Un momento, por favor" nunca desaparece
- Las cookies de autenticación nunca se establecen
- Usuario siempre queda como "guest"
- Ya confirmado en tests anteriores (Opciones 1 y 2)

**MCP Browser SÍ funciona porque:**
- Es un navegador real (Chrome) controlado por herramientas MCP
- Firebase funciona correctamente
- Cookies se establecen sin problemas
- Login manual funciona

---

## 📋 Instrucciones Paso a Paso

### PASO 1: Login en app-test

**Acción:**
```
Abrir en MCP Browser: https://app-test.bodasdehoy.com/login
```

**Credenciales:**
- Email: `bodasdehoy.com@gmail.com`
- Password: `lorca2012M*+`

**Verificar:**
1. El overlay "Un momento, por favor" desaparece (debe tomar 2-3 segundos)
2. El formulario de login es visible
3. Después de login, redirige a la homepage (no queda en /login)
4. En la esquina superior derecha se ve el nombre del usuario (NO "guest")

**Screenshot a capturar:**
- `mcp-01-login-success.png` - Homepage después de login exitoso

---

### PASO 2: Verificar Autenticación

**Acción:**
```
Abrir DevTools > Application > Cookies
```

**Verificar que existan estas cookies:**
1. `idTokenV0.1.0` - Token de Firebase (valor largo)
2. `sessionBodas` - Token de sesión del backend

**Si alguna cookie falta:**
- ❌ El login NO funcionó
- ❌ El usuario es "guest"
- ❌ NO continuar con el test

**Screenshot a capturar:**
- `mcp-02-cookies-verificadas.png` - Panel de cookies en DevTools

---

### PASO 3: Navegar a Eventos

**Acción:**
```
Ir a: https://app-test.bodasdehoy.com/eventos
```

**Verificar:**
1. Se muestra lista de eventos del usuario
2. Hay al menos un evento visible
3. Se puede ver nombre, tipo y fecha de eventos

**Datos a documentar:**
- ¿Cuántos eventos tiene el usuario?
- ¿Cuáles son los nombres de los eventos?
- ¿Alguno menciona "Raul" o "Isabel"?

**Screenshot a capturar:**
- `mcp-03-lista-eventos.png` - Lista completa de eventos

---

### PASO 4: Seleccionar Evento de Raul e Isabel

**Acción:**
```
Clickear en el evento que mencione "Raul" o "Isabel"
```

**Verificar:**
1. Navega a la pantalla del evento (URL: `/eventos` o `/resumen-evento`)
2. Se ve nombre del evento
3. Se ven datos del evento (fecha, lugar, invitados)

**Datos a documentar:**
- ID del evento (si es visible en URL o DevTools)
- Nombre completo del evento
- Fecha del evento
- Lugar del evento
- Número de invitados mostrado

**Screenshot a capturar:**
- `mcp-04-evento-raul-isabel.png` - Vista del evento seleccionado

---

### PASO 5: Navegar a Invitados

**Acción:**
```
Ir a: /invitados (desde el menú lateral)
```

**Verificar:**
1. Se muestra tabla de invitados
2. Hay invitados en la lista
3. Se puede ver nombres, asistencia, pases

**Datos a documentar:**
- Total de invitados del evento
- ¿Se ve "Isabel" en la lista?
- ¿Se ve "Raul" en la lista?
- Invitados confirmados vs pendientes

**Screenshot a capturar:**
- `mcp-05-invitados.png` - Lista de invitados del evento

---

### PASO 6: Abrir el Copilot

**Acción:**
```
Clickear el botón "Copilot" en la barra de navegación
O usar atajo: Cmd+Shift+C (Mac) / Ctrl+Shift+C (Windows)
```

**Verificar:**
1. Se abre un panel/sidebar desde el LADO DERECHO de la pantalla
2. El panel tiene un chat con el Copilot
3. Hay un input donde escribir mensajes
4. El Copilot muestra mensaje de bienvenida

**Características del sidebar a documentar:**
- Ancho aproximado (px o %)
- Posición (derecha, izquierda, centro)
- ¿Se puede redimensionar?
- ¿Hay botones adicionales? (expandir, cerrar, etc.)

**Screenshot a capturar:**
- `mcp-06-copilot-abierto.png` - Vista completa con Copilot en el sidebar

---

### PASO 7: Pregunta 1 - "¿Cuántos invitados tengo?"

**Acción:**
```
Escribir en el Copilot: "¿Cuántos invitados tengo?"
Presionar Enter o clickear botón de enviar
```

**Esperar:**
- 3-10 segundos para que el Copilot responda

**Verificar:**
1. El Copilot responde con un número específico
2. La respuesta coincide con el número visto en /invitados
3. La respuesta incluye detalles (confirmados, pendientes, etc.)

**Preguntas a documentar:**
- ¿La respuesta es correcta?
- ¿Muestra solo el número o también detalles?
- ¿Hay botones de acción (ej: "Ver invitados")?
- ¿Si clickeas un botón, navega a algún lado?

**Screenshots a capturar:**
- `mcp-07-pregunta1-enviada.png` - Pregunta escrita antes de enviar
- `mcp-08-pregunta1-respuesta.png` - Respuesta completa del Copilot

---

### PASO 8: Pregunta 2 - "¿Cuál es la boda de Raul?"

**Acción:**
```
Escribir en el Copilot: "¿Cuál es la boda de Raul?"
Presionar Enter
```

**Esperar:**
- 3-10 segundos para respuesta

**Verificar:**
1. El Copilot identifica el evento correcto
2. Muestra detalles del evento (nombre, fecha, lugar)
3. Los datos coinciden con lo visto en PASO 4

**Preguntas a documentar:**
- ¿Encuentra el evento correcto?
- ¿Qué detalles muestra?
- ¿Hay botones de navegación?
- ¿La respuesta es útil y completa?

**Screenshots a capturar:**
- `mcp-09-pregunta2-respuesta.png` - Respuesta del Copilot

---

### PASO 9: Pregunta 3 - "Muéstrame la lista de todas las bodas"

**Acción:**
```
Escribir en el Copilot: "Muéstrame la lista de todas las bodas"
Presionar Enter
```

**Esperar:**
- 3-10 segundos para respuesta

**Verificar:**
1. El Copilot muestra lista de eventos
2. Incluye todos los eventos vistos en PASO 3
3. El formato es legible (lista, tabla, cards, etc.)

**Preguntas a documentar:**
- ¿Formato de visualización? (lista con bullets, tabla, cards)
- ¿Incluye todos los eventos?
- ¿Los detalles coinciden con los reales?
- ¿Hay botones para cada evento?

**Screenshots a capturar:**
- `mcp-10-pregunta3-respuesta.png` - Lista de eventos en el Copilot

---

### PASO 10: Pregunta Adicional 1 - "Muéstrame los invitados de la boda de Raul"

**Acción:**
```
Escribir: "Muéstrame los invitados de la boda de Raul"
Presionar Enter
```

**Verificar:**
1. Ejecuta herramienta `get_guests` (puede aparecer indicador de "Buscando...")
2. Muestra lista de invitados específicos de ese evento
3. Incluye nombres, asistencia, pases

**Preguntas a documentar:**
- ¿Formato de visualización? (tabla, lista, cards)
- ¿Los invitados coinciden con los de /invitados?
- ¿Hay botones de acción? (editar, eliminar, etc.)
- ¿Si hay botones, funcionan?

**Screenshots a capturar:**
- `mcp-11-invitados-raul.png` - Lista de invitados del evento

---

### PASO 11: Pregunta Adicional 2 - "¿Cuál es el presupuesto de la boda de Raul?"

**Acción:**
```
Escribir: "¿Cuál es el presupuesto de la boda de Raul?"
Presionar Enter
```

**Verificar:**
1. Ejecuta herramienta `get_budget`
2. Muestra presupuesto total, pagado, pendiente
3. Incluye detalles de categorías o items

**Preguntas a documentar:**
- ¿Los números son correctos?
- ¿Formato de visualización?
- ¿Hay desglose por categorías?
- ¿Hay gráfico o solo texto?

**Screenshots a capturar:**
- `mcp-12-presupuesto-raul.png` - Detalles del presupuesto

---

### PASO 12: Probar Navegación desde Copilot

**Acción:**
```
Escribir: "Llévame a la página de invitados"
Presionar Enter
```

**Verificar:**
1. El Copilot responde (puede ser con botón o automático)
2. La app NAVEGA a /invitados
3. El Copilot permanece abierto (o se cierra, documentar)

**Si no navega automáticamente:**
- ¿Hay un botón "Ir a invitados"?
- ¿Clickearlo navega?
- ¿O solo da instrucciones de cómo ir?

**Screenshots a capturar:**
- `mcp-13-navegacion-copilot.png` - Respuesta del Copilot
- `mcp-14-despues-navegacion.png` - Vista después de navegar

---

### PASO 13: Probar Agregar Invitado (probablemente NO funcione)

**Acción:**
```
Escribir: "Agrega un invitado llamado Juan Pérez con email juan@test.com"
Presionar Enter
```

**Verificar:**
1. El Copilot responde (puede pedir confirmación)
2. Si pide confirmación, confirmar
3. **Luego ir a /invitados y verificar si el invitado se agregó**

**Resultado ESPERADO según análisis:**
- ❌ El Copilot confirma pero la app NO se actualiza
- ❌ Al ir a /invitados, Juan Pérez NO aparece
- ❌ O aparece solo después de recargar la página (F5)

**Documentar:**
- ¿Qué respondió el Copilot?
- ¿El invitado se agregó realmente?
- ¿Hubo que recargar la página para verlo?
- ¿Hubo algún error?

**Screenshots a capturar:**
- `mcp-15-agregar-invitado-respuesta.png` - Respuesta del Copilot
- `mcp-16-invitados-despues-agregar.png` - Lista de invitados después

---

### PASO 14: Verificar Auto-refresh (probablemente NO funcione)

**Acción:**
```
Mientras estás en /invitados con el Copilot abierto:
1. Pregunta: "¿Cuántos invitados tengo?"
2. Anota el número
3. Agrega invitado desde el Copilot
4. Sin recargar, pregunta de nuevo: "¿Cuántos invitados tengo?"
```

**Verificar:**
1. ¿El número cambió automáticamente?
2. ¿La tabla de invitados se actualizó sola?
3. ¿O hay que recargar manualmente?

**Resultado ESPERADO según análisis:**
- ❌ La tabla NO se actualiza automáticamente
- ❌ El Copilot muestra el número actualizado pero la app no

**Screenshots a capturar:**
- `mcp-17-auto-refresh-test.png` - Estado antes y después

---

## 📊 Checklist de Verificación

### Login y Autenticación
- [ ] Login exitoso con credenciales reales
- [ ] Cookies `idTokenV0.1.0` y `sessionBodas` establecidas
- [ ] Usuario NO es "guest"
- [ ] Redirige a homepage después de login

### Navegación y Datos
- [ ] Lista de eventos visible
- [ ] Evento de "Raul" o "Isabel" encontrado
- [ ] Invitados del evento visibles
- [ ] Presupuesto del evento visible

### Copilot - Sidebar Visual
- [ ] Copilot se abre en el sidebar derecho
- [ ] Ancho: ~380-500px (documentar exacto)
- [ ] Se puede redimensionar (sí/no)
- [ ] Tiene botones de expandir/cerrar
- [ ] Mensaje de bienvenida visible

### Copilot - Respuestas
- [ ] Pregunta 1: Responde con número correcto de invitados
- [ ] Pregunta 2: Identifica evento de Raul correctamente
- [ ] Pregunta 3: Lista todos los eventos
- [ ] Invitados de Raul: Muestra lista correcta
- [ ] Presupuesto de Raul: Muestra números correctos

### Copilot - Navegación
- [ ] "Llévame a invitados" navega correctamente
- [ ] El Copilot permanece abierto después de navegar (sí/no)
- [ ] Hay botones de navegación en las respuestas (sí/no)
- [ ] Los botones funcionan (sí/no)

### Copilot - Operaciones (probablemente FALLAN)
- [ ] Agregar invitado: Copilot confirma
- [ ] Agregar invitado: Se agrega en BD (verificar en /invitados)
- [ ] Agregar invitado: La app se actualiza automáticamente (sí/no)
- [ ] Auto-refresh: Datos se actualizan sin recargar (sí/no)

---

## 📸 Screenshots a Capturar (Total: 17)

1. `mcp-01-login-success.png` - Homepage después de login
2. `mcp-02-cookies-verificadas.png` - Cookies en DevTools
3. `mcp-03-lista-eventos.png` - Lista de eventos
4. `mcp-04-evento-raul-isabel.png` - Detalles del evento
5. `mcp-05-invitados.png` - Lista de invitados
6. `mcp-06-copilot-abierto.png` - Copilot en sidebar
7. `mcp-07-pregunta1-enviada.png` - Pregunta 1 escrita
8. `mcp-08-pregunta1-respuesta.png` - Respuesta pregunta 1
9. `mcp-09-pregunta2-respuesta.png` - Respuesta pregunta 2
10. `mcp-10-pregunta3-respuesta.png` - Respuesta pregunta 3
11. `mcp-11-invitados-raul.png` - Invitados del evento
12. `mcp-12-presupuesto-raul.png` - Presupuesto del evento
13. `mcp-13-navegacion-copilot.png` - Navegación desde Copilot
14. `mcp-14-despues-navegacion.png` - Después de navegar
15. `mcp-15-agregar-invitado-respuesta.png` - Confirmación de agregar
16. `mcp-16-invitados-despues-agregar.png` - Lista después de agregar
17. `mcp-17-auto-refresh-test.png` - Test de auto-refresh

---

## 📝 Datos a Documentar

Crear archivo `RESULTADOS-TEST-COPILOT-REAL.md` con:

### Información del Usuario
- Email: bodasdehoy.com@gmail.com
- UID: (copiar de cookies o DevTools)
- Eventos totales: X
- Eventos encontrados con "Raul" o "Isabel": X

### Evento Principal (Raul e Isabel)
- ID: XXX
- Nombre: XXX
- Fecha: XXX
- Lugar: XXX
- Total invitados: X
- Confirmados: X
- Pendientes: X

### Funcionalidades que SÍ Funcionan ✅
- Login real
- Autenticación con cookies
- Copilot se abre en sidebar
- Respuestas con datos reales
- Navegación desde Copilot
- (Agregar más según resultados)

### Funcionalidades que NO Funcionan ❌
- Auto-refresh de datos después de operaciones
- Agregar invitado actualiza la app
- (Agregar más según resultados)

### Bugs Encontrados 🐛
- (Listar cualquier error o comportamiento inesperado)

### Recomendaciones de Mejora 💡
- Implementar endpoints de operación (/api/guests/add, etc.)
- Agregar callbacks de auto-refresh
- Integrar con EventContext para actualizar datos
- (Agregar más según análisis)

---

## 🚀 Próximos Pasos

Una vez completado el test:
1. Revisar screenshots y documentación
2. Crear lista de funcionalidades faltantes
3. Priorizar implementaciones
4. Crear plan de desarrollo para completar el sistema

---

## ⚠️ Notas Importantes

- **NO usar Playwright** - Este test es 100% manual con MCP Browser
- **Documentar TODO** - Screenshots, comportamientos, errores
- **No modificar código** - Solo verificar funcionalidad actual
- **Ser exhaustivo** - Probar todos los casos del checklist
