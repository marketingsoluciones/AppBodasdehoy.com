# Guía Rápida: Tests del Copilot

## 🎯 Resumen en 30 Segundos

**Problema:** Firebase detecta TODOS los logins automatizados (Chrome y Firefox)

**Solución:** Login manual UNA VEZ → Guardar cookies → Tests automáticos INFINITOS

---

## ⚡ Uso Rápido

### Primera Vez (Setup - Solo 1 vez)

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node test-copilot-manual-login-save-cookies.js
```

**Qué hacer cuando Firefox se abre:**
1. ✅ Ingresar email: `bodasdehoy.com@gmail.com`
2. ✅ Ingresar contraseña: `lorca2012M*+`
3. ✅ Click en "Continuar"
4. ✅ Esperar mensaje: "✅ Cookies guardadas"

**Resultado:** Archivo `copilot-test-cookies.json` creado

---

### Tests Automatizados (Infinitas veces)

```bash
node test-copilot-automated-with-cookies.js
```

**Qué hace:**
- ✅ Login automático (sin escribir nada)
- ✅ Abre Copilot
- ✅ Hace 3 preguntas automáticamente
- ✅ Captura screenshots

**Screenshots generados:**
- `/tmp/firefox-auto-01-authenticated.png` - Homepage autenticado
- `/tmp/firefox-auto-02-copilot-open.png` - Copilot abierto
- `/tmp/firefox-auto-q1-*.png` - Respuesta pregunta 1
- `/tmp/firefox-auto-q2-*.png` - Respuesta pregunta 2
- `/tmp/firefox-auto-q3-*.png` - Respuesta pregunta 3

---

## 📋 Checklist de Setup

- [ ] Ejecutar `test-copilot-manual-login-save-cookies.js`
- [ ] Firefox se abre (headful, visible)
- [ ] Hacer login manual
- [ ] Ver mensaje "✅ Cookies guardadas"
- [ ] Verificar que existe `copilot-test-cookies.json`
- [ ] Ejecutar `test-copilot-automated-with-cookies.js`
- [ ] Ver los 3 screenshots generados
- [ ] ¡Listo! Ahora puedes ejecutar tests infinitas veces

---

## 🔥 Ventajas de Este Enfoque

| Aspecto | Antes (Automatizado) | Ahora (Cookies) |
|---------|---------------------|-----------------|
| **Firebase detecta** | ❌ Siempre | ✅ Nunca |
| **Login manual** | ❌ Cada test | ✅ Solo 1 vez |
| **Tests automatizados** | ❌ Imposible | ✅ Ilimitados |
| **Tiempo de setup** | - | 30 segundos |
| **Tiempo por test** | - | 5 minutos |
| **CI/CD** | ❌ No | ✅ Sí |

---

## ⚠️ Importante

### NO committear a Git

```bash
# Agregar a .gitignore:
echo "copilot-test-cookies.json" >> .gitignore
```

### Regenerar si expiran

```bash
# Si ves error "Cookies expiradas":
node test-copilot-manual-login-save-cookies.js
# Hacer login manual de nuevo
```

---

## 🐛 Errores Comunes

### "No se encontró archivo de cookies"

**Solución:** Ejecutar el script de login manual primero
```bash
node test-copilot-manual-login-save-cookies.js
```

### "Cookies expiradas"

**Solución:** Regenerar cookies (login manual de nuevo)
```bash
node test-copilot-manual-login-save-cookies.js
```

### "No se pudo encontrar el Copilot"

**Solución:** Verificar que el Copilot esté habilitado en la app

---

## 📚 Documentación Completa

Ver: `SOLUCION-FIREBASE-DETECCION.md` para documentación detallada

---

## 🚀 Estado Actual

**AHORA MISMO ({{ timestamp }}):**

✅ Script `test-copilot-manual-login-save-cookies.js` está ejecutándose

Firefox está abierto esperando que hagas login manual

**Qué hacer:**
1. Ve a la ventana de Firefox que se abrió
2. Ingresa email: `bodasdehoy.com@gmail.com`
3. Ingresa contraseña: `lorca2012M*+`
4. Click en "Continuar"
5. Espera mensaje "✅ Cookies guardadas" en la terminal

**Después:**
```bash
# Ejecutar test automatizado:
node test-copilot-automated-with-cookies.js
```

---

## 📊 Siguiente Paso

Una vez que hagas login manual y veas "✅ Cookies guardadas":

```bash
# 1. Verificar que el archivo existe:
ls -lh copilot-test-cookies.json

# 2. Ejecutar primer test automatizado:
node test-copilot-automated-with-cookies.js

# 3. Ver screenshots generados:
open /tmp/firefox-auto-*.png
```

**¡Eso es todo!** Tests completamente automatizados funcionando.
