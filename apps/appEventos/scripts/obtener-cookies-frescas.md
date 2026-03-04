# 🍪 Obtener Cookies Frescas - 30 Segundos

## Pasos:

1. **Abre tu navegador** donde estás logueado en `https://app-test.bodasdehoy.com`

2. **Abre DevTools**:
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `F12`

3. **Ve a la pestaña "Console"**

4. **Copia y pega este código** y presiona Enter:

```javascript
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
  console.log('✅ Cookies extraídas. JSON copiado al portapapeles.');

  navigator.clipboard.writeText(json).then(() => {
    console.log('✅ ¡JSON copiado! Ahora pégalo en el archivo.');
    console.log('Archivo: apps/web/scripts/copilot-test-cookies.json');
  });
})();
```

5. **El JSON se copiará automáticamente** al portapapeles

6. **Pega el JSON en el archivo** usando este comando:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
pbpaste > copilot-test-cookies.json
```

7. **Ejecuta el test nuevamente**:

```bash
node test-copilot-automated-with-cookies.js
```

---

## ⏱️ Total: 30 segundos

Ahora las cookies estarán frescas y el usuario debería aparecer como `bodasdehoy.com@gmail.com` en lugar de "guest".
