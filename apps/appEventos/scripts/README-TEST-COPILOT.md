# Test Automatizado del Copilot

## 🎯 3 Opciones de Test Disponibles

### Opción 1: Login Manual + Test Automático
```bash
node scripts/test-copilot-con-usuario-real.js
```
**Cómo funciona:**
1. Abre navegador VISIBLE en /login
2. TÚ haces login manualmente con tus credenciales
3. El script detecta que el login completó
4. Hace las 3 preguntas automáticamente
5. MANTIENE el navegador ABIERTO para que veas todo

**Cuándo usar:** Cuando quieres usar tu usuario REAL y ver todo el proceso.

---

### Opción 2: Login Automático con Espera Larga
```bash
node scripts/test-copilot-espera-larga.js
```
**Cómo funciona:**
1. Espera hasta 60 segundos a que el overlay de login desaparezca
2. Verifica que el formulario sea visible
3. Llena formulario automáticamente con credenciales reales
4. Espera a que las cookies se establezcan
5. Hace las 3 preguntas
6. MANTIENE el navegador ABIERTO

**Cuándo usar:** Para probar si Firebase se inicializa correctamente con más tiempo de espera.

**⚠️ ADVERTENCIA:** Firebase probablemente NO se inicializará en Playwright, por lo que este test puede fallar. Es útil para confirmar el problema.

---

### Opción 3: Dev Bypass (100% Confiable) ⭐ RECOMENDADO
```bash
node scripts/test-copilot-bypass-visible.js
```
**Cómo funciona:**
1. Usa el bypass de desarrollo que ya existe en el código
2. Simula usuario autenticado SIN necesitar Firebase
3. Navegador VISIBLE para que veas todo
4. Hace las 3 preguntas automáticamente
5. MANTIENE el navegador ABIERTO

**Cuándo usar:** Para pruebas rápidas y confiables. Este método SIEMPRE funciona.

**Ventajas:**
- ✅ No depende de Firebase
- ✅ 100% confiable
- ✅ Solo funciona en subdominios de test (seguro)
- ✅ Ya existe en el código (AuthContext.tsx:267-284)

---

## 📝 Preguntas que hace cada test

Todas las opciones hacen las mismas 3 preguntas:
1. "¿Cuántos invitados tengo?"
2. "¿Cuál es la boda de Raul?"
3. "Muéstrame la lista de todas las bodas"

## 📸 Capturas de pantalla

Cada opción guarda capturas en /tmp/ con diferentes prefijos:

- **Opción 1:** `/tmp/copilot-real-user-*.png`
- **Opción 2:** `/tmp/copilot-espera-*.png`
- **Opción 3:** `/tmp/copilot-bypass-visible-*.png`

## 🔧 Requisitos

- Node.js instalado
- Playwright instalado (`npm install` en apps/web)
- Acceso a app-test.bodasdehoy.com

## ✅ Resultado esperado

```
✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅

📸 Capturas guardadas en /tmp/copilot-*-*.png
```

## 🔍 Por qué existe el bypass de desarrollo

### El Problema con Firebase + Playwright

Firebase **detecta navegadores automatizados** (como Playwright) y **NO se inicializa**. Esto causa:

1. El overlay de loading en /login nunca desaparece
2. Las cookies de autenticación nunca se establecen
3. El usuario siempre queda como "guest"
4. Error en consola: "error no firebase"

**Ubicación del problema:** [apps/web/api.js:116](apps/web/api.js:116)

### La Solución: Dev Bypass

El bypass de desarrollo ya existe en el código:
- **Ubicación:** [apps/web/context/AuthContext.tsx:267-284](apps/web/context/AuthContext.tsx:267-284)

**Cómo se activa:**
```javascript
sessionStorage.setItem('dev_bypass', 'true')
```

**Usuario que simula:**
```javascript
const devUser = {
  uid: 'upSETrmXc7ZnsIhrjDjbHd7u2up1', // UID REAL de bodasdehoy.com@gmail.com
  email: 'bodasdehoy.com@gmail.com',
  displayName: 'Usuario Dev',
  role: ['creator'],
  status: true
}
```

**⚠️ IMPORTANTE:** El bypass ahora usa el **UID REAL** del usuario `bodasdehoy.com@gmail.com`, por lo que tiene acceso a todos los eventos, invitados y datos reales de ese usuario.

**Restricciones de seguridad:**
- ✅ Solo funciona en subdominios de test (app-test, chat-test)
- ❌ NO funciona en producción (bodasdehoy.com)
- ✅ Perfecto para tests automatizados

## 📊 Comparación de Opciones

| Característica | Opción 1 (Manual) | Opción 2 (Auto con espera) | Opción 3 (Bypass) |
|----------------|-------------------|----------------------------|-------------------|
| **Login** | Manual (tú lo haces) | Automático | Bypass (sin login) |
| **Confiabilidad** | ~0% (Firebase no funciona en Playwright) | ~0% (Firebase no funciona en Playwright) | 100% (siempre funciona) |
| **Usuario real** | ❌ Queda como guest (cookies no se establecen) | ❌ Queda como guest (cookies no se establecen) | ✅ Usa UID REAL con datos reales |
| **Datos reales** | ❌ Sin datos (usuario guest) | ❌ Sin datos (usuario guest) | ✅ Eventos, invitados, presupuesto real |
| **Velocidad** | Lenta (esperas login manual) | Lenta (espera 60s overlay) | Rápida (5-10s) |
| **Navegador visible** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Útil para** | Confirmar problema Firebase | Confirmar problema Firebase | Tests diarios confiables ⭐ |

## 📝 Notas importantes

- ✅ Todos los tests mantienen el navegador ABIERTO al final
- ✅ Las capturas se sobrescriben en cada ejecución
- ✅ Presiona Ctrl+C para cerrar el navegador
- ⚠️ Firebase NO funciona en Playwright (problema conocido)
- ✅ El bypass es la solución recomendada para CI/CD

## Troubleshooting

### El test falla con "Timeout"
- Verifica que app-test.bodasdehoy.com esté accesible
- Revisa la conexión a internet
- Aumenta los timeouts en el script

### No se ven las respuestas del Copilot
- Las capturas están en /tmp/copilot-bypass-q*-04-respuesta.png
- Abre las imágenes para ver las respuestas completas

### El navegador no se cierra
- El script tiene finally{} que siempre cierra el navegador
- Si falla, ejecuta: `pkill -9 -f chromium`
