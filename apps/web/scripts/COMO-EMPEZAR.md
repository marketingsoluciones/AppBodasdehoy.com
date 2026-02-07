# Cómo Empezar: Tests del Copilot - 3 Opciones

## 🎯 Objetivo

Obtener las cookies de autenticación para poder ejecutar tests automatizados del Copilot.

**Solo necesitas hacer esto UNA VEZ. Después podrás ejecutar tests infinitas veces.**

---

## ⚡ Opción 1: Login Manual en Firefox (RECOMENDADO - Más Seguro)

**Cuándo usar:** Primera vez, o si no tienes una sesión activa en el navegador.

**Tiempo:** ~30 segundos

### Pasos:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node test-copilot-manual-login-save-cookies.js
```

**Qué hacer cuando Firefox se abra:**
1. Ir a la ventana de Firefox
2. Ingresar email: `bodasdehoy.com@gmail.com`
3. Ingresar contraseña: `lorca2012M*+`
4. Click en "Continuar"
5. Esperar mensaje en terminal: "✅ Cookies guardadas"

**Ventajas:**
- ✅ Más seguro (no copias/pegas tokens manualmente)
- ✅ Captura TODAS las cookies automáticamente
- ✅ Menos propenso a errores

**Estado actual:** Script ejecutándose en background, esperando tu login

---

## 🚀 Opción 2: Copiar Cookies Manualmente (MÁS RÁPIDO)

**Cuándo usar:** Si ya estás loggeado en `app-test.bodasdehoy.com` en otro navegador.

**Tiempo:** ~10 segundos

### Pasos:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node copiar-cookies-manual.js
```

**El script te pedirá:**

1. Abrir https://app-test.bodasdehoy.com en tu navegador
2. Hacer login (si no lo estás ya)
3. Abrir DevTools (F12 o Cmd+Option+I)
4. Ir a: **Application** > **Cookies** > `https://app-test.bodasdehoy.com`
5. Copiar el valor de estas cookies:
   - `idTokenV0.1.0`
   - `sessionBodas`
6. Pegar los valores cuando el script los pida

**Ventajas:**
- ✅ MÁS RÁPIDO (si ya estás loggeado)
- ✅ No necesita abrir otro navegador
- ✅ Usa tu sesión actual

**Desventajas:**
- ⚠️ Copiar/pegar manual (más propenso a errores)
- ⚠️ Solo captura 2 cookies (puede faltar alguna)

---

## 🔧 Opción 3: Usar Cookies de Sesión Existente (AVANZADO)

**Cuándo usar:** Si tienes acceso a las cookies desde otro lugar (backup, otro test, etc.)

**Tiempo:** ~5 segundos

### Pasos:

1. Crear archivo `copilot-test-cookies.json` manualmente
2. Copiar cookies en formato JSON:

```json
[
  {
    "name": "idTokenV0.1.0",
    "value": "TU_TOKEN_AQUI",
    "domain": "app-test.bodasdehoy.com",
    "path": "/",
    "expires": 1738761600,
    "httpOnly": false,
    "secure": true,
    "sameSite": "Lax"
  },
  {
    "name": "sessionBodas",
    "value": "TU_SESSION_AQUI",
    "domain": "app-test.bodasdehoy.com",
    "path": "/",
    "expires": 1738761600,
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

3. Guardar como: `apps/web/scripts/copilot-test-cookies.json`

**Ventajas:**
- ✅ Total control
- ✅ Útil para automatización avanzada

**Desventajas:**
- ⚠️ Requiere conocimiento de formato JSON
- ⚠️ Propenso a errores de formato

---

## ✅ Verificar Que las Cookies Están Guardadas

Después de usar cualquiera de las 3 opciones:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
ls -lh copilot-test-cookies.json
```

**Deberías ver:**
```
-rw-r--r--  1 user  staff   XXX bytes  copilot-test-cookies.json
```

---

## 🚀 Ejecutar Tests Automatizados

Una vez que tengas las cookies guardadas:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node test-copilot-automated-with-cookies.js
```

**Qué hace:**
- ✅ Abre Firefox con cookies inyectadas
- ✅ Navega a la app (ya autenticado)
- ✅ Abre el Copilot
- ✅ Hace 3 preguntas automáticamente:
  1. "¿Cuántos invitados tengo?"
  2. "¿Cuál es la boda de Raul?"
  3. "Muéstrame la lista de todas las bodas"
- ✅ Captura screenshots de cada respuesta
- ✅ Tarda ~5 minutos

**Screenshots generados:**
```
/tmp/firefox-auto-01-authenticated.png
/tmp/firefox-auto-02-copilot-open.png
/tmp/firefox-auto-q1-*.png
/tmp/firefox-auto-q2-*.png
/tmp/firefox-auto-q3-*.png
```

---

## 📊 ¿Qué Opción Elegir?

| Situación | Opción Recomendada |
|-----------|-------------------|
| Primera vez, no estás loggeado | ✅ **Opción 1** (Login Firefox) |
| Ya estás loggeado en otro navegador | ✅ **Opción 2** (Copiar manual) |
| Tienes cookies de backup | ✅ **Opción 3** (JSON manual) |
| No estás seguro | ✅ **Opción 1** (Login Firefox) |

---

## 🐛 Problemas Comunes

### "No se encontró archivo de cookies"

**Causa:** No has ejecutado ninguna de las 3 opciones aún.

**Solución:** Usa Opción 1 o Opción 2 para generar el archivo.

### "Cookies expiradas"

**Causa:** Las cookies guardadas ya expiraron.

**Solución:** Ejecutar Opción 1 o 2 de nuevo para regenerar cookies frescas.

### Script de login se quedó esperando

**Causa:** No completaste el login en Firefox.

**Solución:**
- Ve a la ventana de Firefox que se abrió
- Completa el login manualmente
- O cancela (Ctrl+C) y usa Opción 2 en su lugar

---

## 💡 Estado Actual del Proyecto

### ✅ Completado

- [x] Scripts de test creados
- [x] Documentación completa
- [x] Script de login manual ejecutándose en background
- [x] 3 opciones para obtener cookies

### ⏳ Pendiente (Tu Acción)

- [ ] **Obtener cookies** (usando cualquiera de las 3 opciones)
- [ ] Ejecutar test automatizado
- [ ] Revisar screenshots de resultados

---

## 📞 Ayuda Rápida

### Script de login manual está esperando

```bash
# Ver progreso:
tail -f /private/tmp/claude/-Users-juancarlosparra-Projects-AppBodasdehoy-com/tasks/bddfc71.output

# Cancelar si prefieres Opción 2:
# Presiona Ctrl+C en la terminal donde lo ejecutaste
```

### Preferir Opción 2 (copiar cookies)

```bash
# Cancelar script de login manual (si está corriendo)
# Luego:
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node copiar-cookies-manual.js
```

### Ver todas las opciones disponibles

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
ls -lh test-copilot-*.js copiar-cookies-manual.js
```

---

## 🎯 Recomendación Ahora Mismo

**AHORA MISMO tienes el script de login manual ejecutándose en background.**

**Opción A (Completar login en Firefox):**
1. Ve a la ventana de Firefox que se abrió
2. Completa el login
3. Espera "✅ Cookies guardadas"

**Opción B (Más rápido - Copiar cookies):**
1. Cancela el script actual (si quieres)
2. Ejecuta: `node copiar-cookies-manual.js`
3. Copia cookies desde DevTools
4. Listo en 10 segundos

---

## 📚 Documentación Adicional

- [SOLUCION-FIREBASE-DETECCION.md](SOLUCION-FIREBASE-DETECCION.md) - Explicación técnica completa
- [GUIA-RAPIDA-COPILOT-TESTS.md](GUIA-RAPIDA-COPILOT-TESTS.md) - Guía rápida de referencia
- [RESUMEN-EJECUTIVO-COPILOT-TESTS.md](RESUMEN-EJECUTIVO-COPILOT-TESTS.md) - Vista general del proyecto
