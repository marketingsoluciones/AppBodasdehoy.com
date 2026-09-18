# Encargo de QA — Bandeja de mensajes (chat-ia)

**Qué se revisa:** la bandeja de mensajes de chat-ia en **dev**.
**Dónde:** `https://chat-dev.bodasdehoy.com/bandeja`
**Con qué:** un móvil real y un escritorio. El móvil no es opcional: los tres fallos
encontrados el 18-09 solo aparecían en teléfono.
**Credenciales:** NO van en este documento. Pídelas a quien te lo encargue.

> Antes de reportar, comprueba que tu hallazgo no está en "Ya sabido" (abajo). Lo que está
> ahí ya tiene dueño y decisión pendiente; reportarlo otra vez no aporta.

---

## Cómo reportar

Un hallazgo sirve si trae **qué esperabas, qué pasó y cómo repetirlo**. Sin los tres, no se
puede arreglar ni verificar. Si puedes, añade captura y modelo de teléfono.

Y una regla que nos ha costado dos días aprender: **no digas "no funciona" si lo que viste es
"no lo encontré"**. No son lo mismo y llevan a arreglos distintos.

---

## 1. En el teléfono, lo primero (aquí es donde sale todo)

- [ ] Abre la bandeja con el teléfono en **modo claro** y luego en **modo oscuro**. ¿Se lee
      todo en los dos? ¿Hay texto invisible, mitades blancas y mitades negras, iconos que
      desaparecen? → **ojo: ya sabemos que esto falla, ver "Ya sabido"**
- [ ] ¿Puedes **escribir a alguien nuevo**? Tiene que haber un botón flotante abajo a la
      derecha. Pruébalo con un teléfono con prefijo (+34…).
- [ ] ¿Puedes **dar acceso** a una conversación desde la lista, sin entrar en ella?
- [ ] Entra en una conversación y vuelve. ¿Vuelves a donde estabas o te pierdes?
- [ ] Gira el teléfono. ¿Sobrevive algo o se rompe la maqueta?
- [ ] ¿Se puede leer un mensaje sin que la barra de arriba se coma media pantalla?

## 2. Los colores de la marca

La bandeja debe pintar el color de la marca activa, nunca uno fijo. Los colores de CANAL
(verde WhatsApp, rosa Instagram, azul Messenger) son la excepción y deben quedarse.

- [ ] Recorre la bandeja buscando morados y rosas que no sean de la marca. Sitios donde ya
      apareció: pestañas de arriba, punto de no leído, botones principales.
- [ ] Cambia de marca (si tienes acceso a otra) y repite. Lo que no cambia, es un color fijo.

## 3. Lista de conversaciones

- [ ] ¿Se entiende cada fila de un vistazo: quién escribe, qué dijo, cuándo?
- [ ] Los indicadores de la derecha: 👥 acceso, ⚡ automático, 🤖 copiloto, ✋ manual.
      ¿Se entienden sin que nadie te los explique? ¿Estorban?
- [ ] Pulsa el indicador de IA. ¿El menú dice qué hace cada modo? ¿El cambio se guarda?
- [ ] Filtros de canal: ¿se ve que hay más a la derecha de los que caben?
- [ ] Busca algo que no exista. ¿El mensaje ayuda o solo dice "sin resultados"?

## 4. Dentro de una conversación

- [ ] Envía un mensaje. ¿El ✓ que aparece dice la verdad? **Un ✓ es "salió de aquí"; ✓✓ es
      "llegó"; ✓✓ azul es "lo leyeron".** Si ves ✓✓ nada más enviar, es un fallo.
- [ ] ¿Quién escribió cada mensaje está bien atribuido? Los tuyos a la derecha, los del
      contacto a la izquierda. Si algo tuyo aparece como suyo, es un fallo grave.
- [ ] Compartir con alguien del equipo: ¿aparece después el 👥 con el número en su fila?
- [ ] Archivar: ¿desaparece para TODO el equipo o solo para ti? (Debe ser para todos.)
- [ ] Silenciar: debe decir "solo aquí" — es una preferencia tuya, no del equipo.

## 5. Mensaje nuevo

- [ ] WhatsApp con un número con prefijo: debe dejarte.
- [ ] Las demás redes salen desactivadas **a propósito**, con su motivo escrito (Instagram no
      permite escribir en frío; Telegram exige que el contacto inicie). ¿Se entiende el motivo
      o parece que está roto?

---

## Ya sabido — no hace falta reportarlo

| Qué | Estado |
|---|---|
| Tema oscuro | **Resuelto el 18-09** con una paleta semántica: 159 colores a mano y 342 clases claras pasaron a seis nombres por función, con los valores oscuros en un solo fichero. Los de ESTADO y CANAL (verde WhatsApp, ámbar, rojo) se quedan fijos a propósito. **Sí hace falta probarlo**: poner el teléfono en oscuro y entrar |
| El modo de IA por conversación en WhatsApp no se puede fijar: el backend devuelve error y todas heredan el de la bandeja | Petición P11 al backend |
| El aviso de "has llegado al límite de tu plan" no salta | Módulo hecho y probado, falta llamarlo |
| Sección de entradas y lista de regalos: maquetas sin servidor | Aparcado para la segunda versión |

## Qué se arregló el 18-09 y conviene comprobar que sigue bien

- Botón flotante para escribir a alguien nuevo en móvil (antes no existía).
- Icono de dar acceso visible en pantallas táctiles (antes necesitaba ratón: invisible en móvil).
- Pestañas de arriba en color de marca (antes, morado del prototipo).
- Los ✓ dejaron de afirmar entregas y lecturas que nadie había confirmado.
- La ventana de 24h y las plantillas de pago solo se aplican ya a WhatsApp API (antes
  bloqueaban también el QR, y daban por caducada toda conversación sin mensajes entrantes).
- Cada fila dice si es API o QR, que es lo que decide si se puede responder libremente.
- Un solo control de modo de IA por nivel (había dos editando lo mismo).
- Filtros plegados en móvil, con una puerta para conectar otro canal.
- Quién lleva cada conversación, visible en la fila.
- Los indicadores de fila tienen 42px de área táctil aunque se vean de 18.
- Los mensajes que llegan en tiempo real dejaron de atribuirse al revés.
