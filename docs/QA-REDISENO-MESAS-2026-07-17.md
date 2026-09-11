# QA — Rediseño pantalla «Mesas y asientos» (appEventos)

> Copia/pega esto como tarea para un **agente de navegador** (Playwright/Puppeteer) o para
> una **persona QA**. Simula a un usuario real: clics, esperas, casos de error. Salida = informe
> estructurado. Protocolo base y credenciales: ver `docs/QA-PROMPT-AGENTE-NAVEGADOR-2026-07-12.md`.

---

## OBJETIVO
Validar el rediseño de la pantalla **Mesas** (8 PRs #192–#199) y, sobre todo, que **el arrastre
de invitados a las sillas SIGUE FUNCIONANDO** (es la única zona que rozó el motor de arrastre).

## SETUP
1. Entra en **https://app-dev.bodasdehoy.com**, haz **login real** (credenciales que te den).
2. **Verifica el build**: en Network, `/_next/static/<BUILD_ID>/` debe ser **`FrvG_WGlP8kbHgUun_XDs`**.
   Si no coincide → **detente y repórtalo** (estás probando un build viejo; fuerza Cmd+Shift+R).
3. Entra en un **evento existente** (p. ej. "ITEL2 S.L PRUEBA"). **NO** toques "Boda de Isabel & Raúl".
4. Ve a **Mesas**. Consola + Network abiertas. Registra la **hora** de cada prueba.
5. Ignora ruido conocido (NO reportar): `React #418`, `react-i18next sin instancia`, abortos a `chat-dev`.

---

## BLOQUE A · Barra lateral (aspecto)
- **A1**: Las pestañas **Planos · Mesas · Mobiliario · Resumen** se ven sobre **fondo blanco** con
  **subrayado rosa** en la activa (no pastillas de color, no barra rosa).
- **A2 Planos**: pestaña Planos → lista **"Espacios del evento"** (icono en cuadrado + nombre + nº de
  mesas). Al hacer clic en un espacio se marca con **borde/tinte rosa + check**; el lienzo cambia a ese plano.
- **A3 Resumen**: pestaña Resumen → **tarjeta con "% ocupado"** + 3 stats (Mesas/Invitados/Sentados) +
  una barra de progreso por espacio. Los textos están **en español** (no "occupied"/"perspace" crudos).
- **A4 Mobiliario**: pestaña Mobiliario → grid de elementos; el botón **"Añadir SVG"** abre el modal real.

## BLOQUE B · Lienzo (aspecto y controles)
- **B1**: Botón **rosa "＋ Añadir mesa"** abajo-derecha (no dorado). Al lado, "＋ Bancos" secundario blanco.
- **B2 Estado vacío**: en un plano **sin mesas** aparece al centro un círculo punteado + *"Aún no hay
  mesas — Crea tu primera mesa"* con CTA rosa. Pulsar el CTA **abre el panel "Diseñar mesa"**.
- **B3 Controles**: arriba-izquierda, el **zoom** es una **pastilla blanca** `−  N%  ＋` (el % es el zoom
  real y cambia al hacer zoom); la **etiqueta del plano** es una **pastilla blanca** "Plano: X · A×B m".
- **B4**: El fondo del lienzo es **blanco con retícula gris**.

## BLOQUE C · Crear mesa (panel "Diseñar mesa")
- **C1**: Pulsa **"＋ Añadir mesa"** → se abre el panel **"Diseñar mesa"**. Las **formas** son **pastillas
  limpias** (Redonda/Rectangular/Oval/Cuadrada/Novios, sin emojis); la activa en **rosa**.
- **C2**: Cambia forma, diámetro (slider), nº de sillas (±) → el **preview** se actualiza.
- **C3**: Pulsa **"Añadir al plano"** → la mesa **aparece en el lienzo** y en la lista. Recarga (F5) →
  **persiste**.
- **C4 (deshacer)**: al crear, aparece abajo un aviso **"Mesa creada · Deshacer"**. Pulsa **Deshacer** →
  la mesa **desaparece**. Recarga → sigue sin estar.

## BLOQUE D · Invitados (filtros) — foco
- **D1**: En la sección **Invitados** (abajo-izquierda): cabecera con chevron (colapsa/expande) + badge
  **"Sentados N"**, y un **filtro segmentado**: **Todos / Por sentar / Sentados**.
- **D2**: "Por sentar" → solo invitados sin sentar. "Sentados" → invitados sentados con etiqueta de
  asiento **"Mesa · A3"**. "Todos" → ambas secciones. **No** deben verse invitados **cancelados**.
- **D3**: El botón **"Añadir invitados"** (pastilla punteada rosa) abre el formulario de alta.

## BLOQUE E · ARRASTRE (CRÍTICO — regresión) 🔴
> Esta es la prueba más importante. Si algo aquí falla, es **prioridad máxima**.
- **E1 Sentar**: con filtro "Por sentar" o "Todos", **arrastra** un invitado desde la lista a una **silla
  libre** de una mesa. ESPERADO: al empezar a arrastrar, **las sillas libres se resaltan en rosa**; al
  soltar sobre una silla, el invitado **queda sentado** (aparece su nombre/nº en la silla).
- **E2 Persistencia**: recarga (F5) → el invitado **sigue sentado** en esa silla.
- **E3 Devolver**: arrastra el invitado sentado **fuera** (a la lista) → vuelve a "Por sentar".
- **E4 Filtro no rompe drag**: cambia a "Sentados" y luego vuelve a "Todos" → **arrastrar sigue
  funcionando** (sentar un invitado tras cambiar de filtro).
- **E5 Mover mesa**: arrastra una **mesa** por el lienzo → se mueve; recarga → **mantiene** la posición.
- **E6 Mesa llena**: intenta sentar en una mesa sin sillas libres → aviso, no rompe.

## BLOQUE F · Borrar mesa + PDF
- **F1 Borrar + deshacer**: borra una mesa (selecciónala → icono borrar) → aviso **"Mesa eliminada ·
  Deshacer"**. Pulsa **Deshacer** → la mesa **vuelve**.
- **F2 PDF**: pulsa el icono **PDF** en la barra de controles → se abre una ventana con el **croquis del
  plano + la lista de invitados por mesa** y el diálogo de impresión (permite ventanas emergentes).
  Comprueba que las mesas y los nombres son los **reales** del evento.

## FORMATO DE SALIDA (por prueba)
```
[ID] resultado=✅|❌|⚠️intermitente  hora=HH:MM
pasos: 1)… 2)…
esperado: …    observado: … (texto EXACTO)
consola/red: …    persiste_tras_F5: sí/no    captura: file
```
Al final: nº pruebas, ✅/❌, **lista de fallos por severidad** (🔴 arrastre primero). Para cada fallo,
si es **constante** o **intermitente** (posible inestabilidad de backend api-mcp).

## NOTAS
- Backend `api-mcp` puede estar inestable a ratos (reinicios/latencia) → si guardar falla, **reintenta**
  y anota la hora; distingue "fallo de UI" de "backend caído".
- El botón **"Añadir plano"** aún **no existe** (bloqueado: falta `createPlanSpace` en backend). No es bug.
