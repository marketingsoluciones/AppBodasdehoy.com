# 🚀 EMPIEZA AQUÍ - Tests del Copilot

## ⚡ La Forma MÁS RÁPIDA (30 segundos)

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
./setup-rapido-30-segundos.sh
```

**Qué hace:**
- ✅ Te guía paso a paso
- ✅ Solo copiar/pegar 2 valores
- ✅ Listo en 30 segundos

---

## 📋 Todas las Opciones Disponibles

### Opción 1: Setup Rápido (⭐ RECOMENDADO - 30 seg)

```bash
./setup-rapido-30-segundos.sh
```

**Pasos:**
1. Script abre y te dice qué hacer
2. Abres DevTools en tu navegador
3. Copias 2 valores
4. Los pegas en la terminal
5. ¡Listo!

---

### Opción 2: Login Manual en Firefox (Seguro - 1 min)

**Estado:** Ya está ejecutándose en background desde hace 7+ minutos.

Si quieres completarlo:
1. Ve a la ventana de Firefox que se abrió
2. Ingresa: `bodasdehoy.com@gmail.com` / `lorca2012M*+`
3. Click "Continuar"
4. Espera "✅ Cookies guardadas"

**Ver progreso:**
```bash
tail -f /private/tmp/claude/-Users-juancarlosparra-Projects-AppBodasdehoy-com/tasks/bddfc71.output
```

---

### Opción 3: Copiar con Asistente Interactivo (1 min)

```bash
node copiar-cookies-manual.js
```

Similar a Opción 1 pero con más validaciones.

---

## 🎯 Después de Obtener las Cookies

Una vez que hayas ejecutado CUALQUIERA de las opciones anteriores:

```bash
# Verificar que las cookies existen:
ls -lh copilot-test-cookies.json

# Ejecutar test automatizado:
node test-copilot-automated-with-cookies.js
```

**El test automatizado:**
- ✅ Abre Firefox con cookies inyectadas
- ✅ Navega a la app (ya autenticado)
- ✅ Abre el Copilot
- ✅ Hace 3 preguntas automáticamente
- ✅ Captura screenshots
- ✅ Tarda ~5 minutos

---

## 📸 Screenshots Generados

Después de ejecutar el test automatizado:

```
/tmp/firefox-auto-01-authenticated.png  - Homepage autenticado
/tmp/firefox-auto-02-copilot-open.png   - Copilot abierto
/tmp/firefox-auto-q1-*.png              - Pregunta 1: "¿Cuántos invitados tengo?"
/tmp/firefox-auto-q2-*.png              - Pregunta 2: "¿Cuál es la boda de Raul?"
/tmp/firefox-auto-q3-*.png              - Pregunta 3: "Muéstrame la lista de todas las bodas"
```

---

## 🆘 ¿Problemas?

### "No se encontró archivo de cookies"

```bash
# Ejecuta la opción más rápida:
./setup-rapido-30-segundos.sh
```

### "Cookies expiradas"

```bash
# Regenera cookies:
./setup-rapido-30-segundos.sh
```

### Firefox sigue esperando

```bash
# Cancela y usa el método rápido:
# Presiona Ctrl+C en la terminal donde está corriendo
# Luego:
./setup-rapido-30-segundos.sh
```

---

## 📚 Documentación Completa

- **[COMO-EMPEZAR.md](COMO-EMPEZAR.md)** - Guía completa con todas las opciones
- **[SOLUCION-FIREBASE-DETECCION.md](SOLUCION-FIREBASE-DETECCION.md)** - Explicación técnica
- **[GUIA-RAPIDA-COPILOT-TESTS.md](GUIA-RAPIDA-COPILOT-TESTS.md)** - Referencia rápida

---

## ⏰ AHORA MISMO - Recomendación

**MÉTODO MÁS RÁPIDO (30 segundos):**

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
./setup-rapido-30-segundos.sh
```

1. Ejecuta el comando arriba
2. Sigue las instrucciones en pantalla
3. Copia 2 valores desde DevTools
4. ¡Listo para tests automatizados!

**O si prefieres completar el login en Firefox:**

1. Ve a la ventana de Firefox que se abrió hace ~7 minutos
2. Completa el login
3. Espera el mensaje de confirmación

---

## 🎯 Objetivo Final

Una vez que tengas las cookies (usando cualquier método):

✅ Tests completamente automatizados del Copilot
✅ 3 preguntas ejecutadas automáticamente
✅ Screenshots capturados
✅ Repetible infinitas veces
✅ Sin más logins manuales

**¡Empecemos!** 🚀
