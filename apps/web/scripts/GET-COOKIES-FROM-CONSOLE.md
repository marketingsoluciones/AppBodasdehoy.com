# 🚀 Método Super Rápido - Copiar Cookies (10 segundos)

## Pasos:

1. **Ve a tu navegador** donde estás logueado en `https://app-test.bodasdehoy.com`

2. **Abre DevTools**:
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `F12` o `Ctrl + Shift + I`

3. **Ve a la pestaña "Console"**

4. **Copia y pega este código**:

```javascript
// Copiar este código completo y pegarlo en la consola
(function() {
  const idToken = document.cookie.split('; ').find(c => c.startsWith('idTokenV0.1.0='))?.split('=')[1];
  const session = document.cookie.split('; ').find(c => c.startsWith('sessionBodas='))?.split('=')[1];

  if (!idToken || !session) {
    console.error('❌ No se encontraron las cookies. Asegúrate de estar logueado.');
    return;
  }

  const cookies = [
    {
      name: 'idTokenV0.1.0',
      value: idToken,
      domain: 'app-test.bodasdehoy.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      httpOnly: false,
      secure: true,
      sameSite: 'Lax'
    },
    {
      name: 'sessionBodas',
      value: session,
      domain: 'app-test.bodasdehoy.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }
  ];

  const json = JSON.stringify(cookies, null, 2);
  console.log('✅ Cookies extraídas. Copia el JSON de abajo:\n');
  console.log(json);
  console.log('\n📋 Guarda esto en: apps/web/scripts/copilot-test-cookies.json');

  // Copiar automáticamente al portapapeles
  navigator.clipboard.writeText(json).then(() => {
    console.log('\n✅ ¡JSON copiado al portapapeles!');
    console.log('Ahora pégalo en el archivo copilot-test-cookies.json');
  }).catch(err => {
    console.log('\n⚠️ No se pudo copiar automáticamente. Copia el JSON manualmente.');
  });
})();
```

5. **Presiona Enter**

6. **El JSON se copiará automáticamente al portapapeles** ✨

7. **Crea el archivo de cookies**:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
# Pega el JSON que copiaste:
pbpaste > copilot-test-cookies.json
```

8. **¡Listo!** Ahora ejecuta:

```bash
node test-copilot-automated-with-cookies.js
```

---

## ⏱️ Total: 10 segundos

Este método es el más rápido porque:
- ✅ No necesitas escribir nada
- ✅ Solo copiar/pegar
- ✅ Las cookies se copian automáticamente
- ✅ Listo para tests automáticos
