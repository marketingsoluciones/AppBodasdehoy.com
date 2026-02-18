# Probar chat-test en el navegador hasta que cargue

## 1. Probar chat-test sin servidor (solo iframe)

Abre en tu navegador **este archivo** (doble clic o `open`):

```
apps/web/public/probar-chat-test.html
```

O desde la terminal:

```bash
open /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/public/probar-chat-test.html
```

Si al abrir como `file://` el iframe no carga (restricciones de origen), sirve la carpeta y abre la URL:

```bash
cd apps/web
npx serve public -p 3333
# Abre: http://localhost:3333/probar-chat-test.html
```

Carga un iframe con `https://chat-test.bodasdehoy.com/bodasdehoy/chat?...`.  
Si aparece el chat → chat-test responde.  
Si no → 502, DNS o red (revisa Cloudflare/origen).

---

## 2. Usar el navegador de Cursor (Chrome DevTools MCP)

Para que **Cursor** pueda abrir el navegador y probar chat-test:

### a) Chrome con remote debugging

1. Cierra Chrome si está abierto.
2. Ábrelo con:

   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222
   ```

3. Comprueba: `curl http://127.0.0.1:9222/json/version`  
   Si responde JSON → OK.

### b) Script incluido

```bash
cd apps/web
./abrir-chrome-chat-test.sh
```

Eso abre Chrome en 9222 y la URL de chat-test.

### c) En Cursor

- Settings → Tools & MCP → que **chrome-devtools** esté conectado.
- Pide: “Abre chat-test en el navegador” o “Navega a https://chat-test.bodasdehoy.com”.

---

## 3. Levantar la app (web) y probar

```bash
cd apps/web
npm run dev
```

Luego abre **http://127.0.0.1:8080** (o el puerto que use `dev`).  
El copilot embebido usa chat-test; si el iframe carga, chat-test está bien.

---

## 4. Si chat-test no carga (502 / no resuelve)

- Revisar **Cloudflare**: DNS de `chat-test`, proxy, origen.
- Revisar **servidor de origen**: que el proceso (p. ej. Next.js del copilot) esté arriba y respondiendo.
- Probar **https://chat-test.bodasdehoy.com** en una pestaña; ver si ves 502 o error de DNS.

---

## Login automático (bot / MCP)

**No ir rápido:** si no le das tiempo a que cargue la pantalla de login y no escribes usuario y clave muy despacio (carácter a carácter, 3 s entre teclas), Firebase nos banea. Flujo seguro: **tú haces el login manual**; cuando confirmes, el agente solo usa la pestaña (Copilot, preguntas). Si se automatiza el login: 1) dejar que cargue el formulario y esperar 15–20 s, 2) escribir email y clave carácter a carácter con 3 s entre cada tecla, 3) solo entonces pulsar Enviar. Detalle: [docs/TESTING-LOGIN-AUTOMATICO.md](docs/TESTING-LOGIN-AUTOMATICO.md).

---

## Resumen

| Qué probar | Cómo |
|------------|------|
| Chat-test solo (iframe) | Abrir `public/probar-chat-test.html` en el navegador |
| Navegador desde Cursor | Chrome con `--remote-debugging-port=9222` + MCP chrome-devtools |
| App web + chat | `npm run dev` → http://127.0.0.1:8080 |
