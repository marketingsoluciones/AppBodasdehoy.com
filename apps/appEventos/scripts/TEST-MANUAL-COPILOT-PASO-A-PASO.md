# Test Manual del Copilot - Paso a Paso

**Fecha**: 2026-02-05
**Tester**: Juan Carlos Parra
**Usuario**: bodasdehoy.com@gmail.com
**Ambiente**: app-test.bodasdehoy.com

---

## 🎯 Objetivo

Probar el Copilot con login real y documentar:
1. ✅ Respuestas del Copilot con datos reales
2. ✅ Visualización en sidebar derecho
3. ✅ Integración frontend-backend
4. ❌ Identificar qué funcionalidades faltan

---

## ⚠️ Por qué Test Manual

**Firebase detecta TODA automatización** (Playwright, Puppeteer, Selenium):
- ❌ Overlay "Un momento, por favor" nunca desaparece
- ❌ Cookies no se establecen
- ❌ Usuario queda como "guest"

**Solución**: Test 100% manual en tu navegador normal.

---

## 📋 PASO 1: Login en tu Navegador Normal

### Acciones:

1. **Abre Chrome/Safari/Firefox NORMAL** (NO desde script)
2. **Ve a**: https://app-test.bodasdehoy.com/login
3. **Haz login con**:
   - Email: `bodasdehoy.com@gmail.com`
   - Password: `lorca2012M*+`

### Verificación:

- [ ] Overlay "Un momento, por favor" desapareció
- [ ] Redirigió a homepage
- [ ] URL actual: `https://app-test.bodasdehoy.com/` (sin /login)

### Captura de pantalla:

**Nombre**: `manual-01-login-exitoso.png`

**Ubicación**: Guardar en `/tmp/` o Desktop

---

## 📋 PASO 2: Verificar Usuario Autenticado

### Acciones:

1. **Mira la esquina superior derecha** de la app
2. **Verifica el nombre de usuario** mostrado

### Verificación:

- [ ] Nombre mostrado: _____________________ (ANOTAR)
- [ ] ¿Es "guest"? [ ] SÍ / [ ] NO
- [ ] ¿Es "Bodas de Hoy" u otro nombre real? [ ] SÍ / [ ] NO

### Captura de pantalla:

**Nombre**: `manual-02-usuario-verificado.png`

**Debe incluir**: Esquina superior derecha con nombre de usuario visible

---

## 📋 PASO 3: Ver Lista de Eventos

### Acciones:

1. **Navega a**: Eventos (link en navbar o https://app-test.bodasdehoy.com/eventos)
2. **Cuenta cuántos eventos ves**
3. **Busca un evento con "Raul" o "Isabel"**

### Verificación:

- [ ] Total de eventos visibles: _____ (ANOTAR NÚMERO)
- [ ] ¿Hay evento con "Raul"? [ ] SÍ / [ ] NO
  - Nombre exacto del evento: _____________________
- [ ] ¿Hay evento con "Isabel"? [ ] SÍ / [ ] NO
  - Nombre exacto del evento: _____________________

### Captura de pantalla:

**Nombre**: `manual-03-lista-eventos.png`

**Debe incluir**: Lista completa de eventos

---

## 📋 PASO 4: Abrir el Copilot

### Acciones:

1. **Busca el botón "Copilot"** en la barra de navegación superior
   - O usa atajo: **Cmd+Shift+C** (Mac) / **Ctrl+Shift+C** (Windows)
2. **Click en el botón**

### Verificación:

- [ ] Se abrió un sidebar en el lado derecho
- [ ] Ancho aproximado del sidebar: _____ px (estimado)
- [ ] ¿Hay mensaje de bienvenida? [ ] SÍ / [ ] NO
- [ ] ¿Hay campo de texto para escribir? [ ] SÍ / [ ] NO
- [ ] ¿Hay botón de enviar? [ ] SÍ / [ ] NO

### Captura de pantalla:

**Nombre**: `manual-04-copilot-abierto.png`

**Debe incluir**: Toda la pantalla con sidebar visible

---

## 📋 PASO 5: Pregunta 1 - "¿Cuántos invitados tengo?"

### Acciones:

1. **Escribe en el Copilot**: `¿Cuántos invitados tengo?`
2. **Presiona Enter** o click en botón de enviar
3. **Espera la respuesta** (puede tardar 10-30 segundos)

### Verificación:

**Respuesta del Copilot:**
```
[COPIAR AQUÍ LA RESPUESTA EXACTA]
```

**Análisis:**
- [ ] ¿Respondió con un número? [ ] SÍ / [ ] NO
  - Número reportado: _____ invitados
- [ ] ¿Incluye desglose? [ ] SÍ / [ ] NO
  - [ ] Confirmados: _____
  - [ ] Pendientes: _____
  - [ ] Rechazados: _____
- [ ] ¿Hay botones de acción? [ ] SÍ / [ ] NO
  - Botones encontrados: _____________________

### Verificación cruzada:

1. **Navega a** `/invitados` (sin cerrar Copilot)
2. **Cuenta el total real de invitados**
3. **Compara**: ¿Coincide el número? [ ] SÍ / [ ] NO

### Capturas de pantalla:

**Nombre**: `manual-05-pregunta1-respuesta.png`

**Debe incluir**: Respuesta completa del Copilot

---

## 📋 PASO 6: Pregunta 2 - "¿Cuál es la boda de Raul?"

### Acciones:

1. **Escribe en el Copilot**: `¿Cuál es la boda de Raul?`
2. **Presiona Enter** o click en botón de enviar
3. **Espera la respuesta**

### Verificación:

**Respuesta del Copilot:**
```
[COPIAR AQUÍ LA RESPUESTA EXACTA]
```

**Análisis:**
- [ ] ¿Encontró el evento correcto? [ ] SÍ / [ ] NO
  - Nombre del evento mostrado: _____________________
- [ ] Detalles incluidos:
  - [ ] Fecha del evento
  - [ ] Lugar/ubicación
  - [ ] Número de invitados
  - [ ] Presupuesto
  - [ ] Otro: _____________________
- [ ] ¿Hay botones de navegación? [ ] SÍ / [ ] NO
  - Botones encontrados: _____________________

### Capturas de pantalla:

**Nombre**: `manual-06-pregunta2-respuesta.png`

**Debe incluir**: Respuesta completa del Copilot

---

## 📋 PASO 7: Pregunta 3 - "Muéstrame la lista de todas las bodas"

### Acciones:

1. **Escribe en el Copilot**: `Muéstrame la lista de todas las bodas`
2. **Presiona Enter** o click en botón de enviar
3. **Espera la respuesta**

### Verificación:

**Respuesta del Copilot:**
```
[COPIAR AQUÍ O DESCRIBIR EL FORMATO]
```

**Análisis:**
- [ ] Total de eventos listados: _____
- [ ] ¿Coincide con el total en /eventos? [ ] SÍ / [ ] NO
- [ ] Formato de visualización:
  - [ ] Lista con bullets
  - [ ] Tabla
  - [ ] Cards/Tarjetas
  - [ ] Otro: _____________________
- [ ] Detalles por evento:
  - [ ] Nombre
  - [ ] Tipo (boda, cumpleaños, etc.)
  - [ ] Fecha
  - [ ] Botones de acción

### Capturas de pantalla:

**Nombre**: `manual-07-pregunta3-respuesta.png`

**Debe incluir**: Respuesta completa del Copilot

---

## 📋 PASO 8: Pregunta Adicional - Invitados de Evento Específico

### Acciones:

1. **Escribe en el Copilot**: `Muéstrame los invitados de la boda de Raul`
   - (Ajusta según el nombre exacto del evento que encontraste)
2. **Presiona Enter**
3. **Espera la respuesta**

### Verificación:

**Respuesta del Copilot:**
```
[DESCRIBIR FORMATO DE VISUALIZACIÓN]
```

**Análisis:**
- [ ] ¿Se ejecutó alguna herramienta? [ ] SÍ / [ ] NO
  - Herramienta vista: _____________________
- [ ] ¿Mostró indicador de carga? [ ] SÍ / [ ] NO
- [ ] Total de invitados listados: _____
- [ ] Formato:
  - [ ] Tabla con columnas
  - [ ] Lista simple
  - [ ] Cards individuales
  - [ ] Otro: _____________________
- [ ] ¿Hay botones por invitado? [ ] SÍ / [ ] NO

### Verificación cruzada:

1. **Navega a** `/invitados`
2. **Filtra por el evento de Raul** (si hay filtro)
3. **Compara**: ¿Coincide el número? [ ] SÍ / [ ] NO

### Capturas de pantalla:

**Nombre**: `manual-08-invitados-raul.png`

---

## 📋 PASO 9: Pregunta Adicional - Presupuesto

### Acciones:

1. **Escribe en el Copilot**: `¿Cuál es el presupuesto de la boda de Raul?`
2. **Presiona Enter**
3. **Espera la respuesta**

### Verificación:

**Respuesta del Copilot:**
```
[COPIAR AQUÍ LA RESPUESTA]
```

**Análisis:**
- [ ] ¿Ejecutó herramienta `get_budget`? [ ] SÍ / [ ] NO
- [ ] Presupuesto total mostrado: _____ €/USD
- [ ] Pagado mostrado: _____ €/USD
- [ ] Pendiente mostrado: _____ €/USD
- [ ] ¿Incluye desglose por categorías? [ ] SÍ / [ ] NO
- [ ] ¿Hay gráfico/visualización? [ ] SÍ / [ ] NO

### Verificación cruzada:

1. **Navega a** `/presupuesto`
2. **Selecciona el evento de Raul**
3. **Compara los números**: ¿Coinciden? [ ] SÍ / [ ] NO

### Capturas de pantalla:

**Nombre**: `manual-09-presupuesto-raul.png`

---

## 📋 PASO 10: Test de Navegación

### Acciones:

1. **Escribe en el Copilot**: `Llévame a la página de invitados`
2. **Presiona Enter**
3. **Observa qué pasa**

### Verificación:

- [ ] ¿Navegó automáticamente? [ ] SÍ / [ ] NO
- [ ] ¿Mostró botón de navegación? [ ] SÍ / [ ] NO
  - Texto del botón: _____________________
- [ ] URL después de acción: _____________________
- [ ] ¿El Copilot permaneció abierto? [ ] SÍ / [ ] NO

### Capturas de pantalla:

**Nombre**: `manual-10-navegacion.png`

---

## 📋 PASO 11: Test de Operación - Agregar Invitado (CRÍTICO)

### Acciones:

1. **Anota el número actual de invitados**: _____ (de Pregunta 1)
2. **Escribe en el Copilot**: `Agrega un invitado llamado Juan Pérez con email juan@test.com`
3. **Presiona Enter**
4. **Observa qué pasa**

### Verificación:

**Paso 1: Confirmación del Copilot**
- [ ] ¿Pidió confirmación? [ ] SÍ / [ ] NO
- [ ] ¿Mostraste mensaje de confirmación? [ ] SÍ / [ ] NO
  - Mensaje: _____________________
- [ ] ¿Confirmaste la acción? [ ] SÍ / [ ] NO (cómo: _______)
- [ ] ¿El Copilot confirmó que agregó? [ ] SÍ / [ ] NO

**Paso 2: Verificación sin recargar**
1. **SIN RECARGAR la página**, navega a `/invitados`
2. **Busca "Juan Pérez"** en la lista
3. **Resultado**: [ ] APARECE / [ ] NO APARECE

**Paso 3: Verificación recargando**
1. **Recarga la página** (F5 o Cmd+R)
2. **Busca "Juan Pérez"** nuevamente
3. **Resultado**: [ ] APARECE / [ ] NO APARECE

**Conclusión**:
- [ ] ✅ Se agregó Y la app se actualizó automáticamente
- [ ] ⚠️ Se agregó PERO solo después de recargar
- [ ] ❌ NO se agregó (ni recargando)

### Capturas de pantalla:

**Nombre**: `manual-11-agregar-invitado.png`

---

## 📋 PASO 12: Test de Auto-Refresh

### Acciones:

1. **Estando en** `/invitados` con Copilot abierto
2. **Pregunta**: `¿Cuántos invitados tengo?`
3. **Anota la respuesta**: _____ invitados
4. **Sin cerrar nada**, pregunta de nuevo: `¿Cuántos invitados tengo?`
5. **Anota la nueva respuesta**: _____ invitados

### Verificación:

- [ ] ¿El número cambió (incluyó a Juan Pérez)? [ ] SÍ / [ ] NO
- [ ] ¿La tabla de invitados se actualizó sola? [ ] SÍ / [ ] NO
- [ ] ¿Tuviste que recargar manualmente? [ ] SÍ / [ ] NO

**Conclusión**:
- [ ] ✅ Auto-refresh funciona (tabla + Copilot)
- [ ] ⚠️ Solo el Copilot se actualiza, tabla NO
- [ ] ❌ Ni el Copilot ni la tabla se actualizan sin recargar

### Capturas de pantalla:

**Nombre**: `manual-12-auto-refresh.png`

---

## 📊 RESUMEN DE RESULTADOS

### ✅ Funcionalidades que SÍ Funcionan

- [ ] Login real con Firebase
- [ ] Autenticación con cookies
- [ ] Usuario autenticado (NO guest)
- [ ] Copilot se abre en sidebar
- [ ] Respuestas con datos reales
- [ ] Pregunta sobre invitados
- [ ] Pregunta sobre evento específico
- [ ] Pregunta sobre lista de eventos
- [ ] Ejecución de herramientas (get_guests, get_budget)
- [ ] Navegación desde Copilot
- [ ] Otro: _____________________

### ❌ Funcionalidades que NO Funcionan

- [ ] Auto-refresh de datos después de operaciones
- [ ] Agregar invitado actualiza app sin recargar
- [ ] Actualizar presupuesto actualiza app sin recargar
- [ ] Ejecutar operaciones y ver cambios inmediatos
- [ ] Otro: _____________________

---

## 🐛 Bugs Encontrados

### Bug 1:
**Título**: _____________________

**Descripción**: _____________________

**Pasos para reproducir**:
1. _____________________
2. _____________________
3. _____________________

**Comportamiento esperado**: _____________________

**Comportamiento actual**: _____________________

### Bug 2:
(Agregar más según sea necesario)

---

## 💡 Observaciones Adicionales

```
[Agregar cualquier observación, comentario, o comportamiento inesperado]
```

---

## 📸 Checklist de Capturas

- [ ] `manual-01-login-exitoso.png`
- [ ] `manual-02-usuario-verificado.png`
- [ ] `manual-03-lista-eventos.png`
- [ ] `manual-04-copilot-abierto.png`
- [ ] `manual-05-pregunta1-respuesta.png`
- [ ] `manual-06-pregunta2-respuesta.png`
- [ ] `manual-07-pregunta3-respuesta.png`
- [ ] `manual-08-invitados-raul.png`
- [ ] `manual-09-presupuesto-raul.png`
- [ ] `manual-10-navegacion.png`
- [ ] `manual-11-agregar-invitado.png`
- [ ] `manual-12-auto-refresh.png`

---

**Fecha de ejecución**: _____________________
**Tiempo total**: _____ minutos
**Navegador usado**: _____________________
**Versión del navegador**: _____________________
