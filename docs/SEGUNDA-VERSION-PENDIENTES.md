# Para la segunda versión — lo que se deja aparcado a propósito

Decisión del owner, 18-09-2026: **no se sigue con esto ahora**. Se documenta aquí lo que se
averiguó al auditarlo, para que quien lo retome no tenga que volver a investigarlo.

---

## 1. Entradas y lista de regalos: maquetas completas, sin servidor

No es un cable suelto: **el otro extremo no existe**. Las pantallas están hechas y son fieles
al diseño; lo que falta es todo lo de detrás.

| Parte | Dónde | Estado medido |
|---|---|---|
| Entradas — 13 pantallas (venta, reserva, recibo, cancelar, recuperar compra, entradas gratis) | `pages/RelacionesPublicas/` | 2.010 líneas · **0 llamadas a datos** |
| Lista de regalos (enlazada desde el menú principal y el de móvil) | `pages/lista-regalos.tsx` | **0 llamadas a datos** |

En api-mcp no hay nada de entradas ni de regalos. Terminarlo significa definir el modelo
(entrada, reserva, pago, regalo reservado por un invitado) y después enchufar las pantallas,
que es la parte que ya está hecha.

Quién ve esa sección hoy: `context/AuthContext.tsx:290` redirige a `/RelacionesPublicas`
únicamente si el subdominio es `ticket` o `testticket`. No depende de la marca.

## 2. Restos de un diseño de terceros en esa sección

La maqueta de entradas viene de un export del sitio de **fourvenues.com** y quedó a medio
rebrandear. Detectado y NO corregido, por decisión de aparcar la sección entera:

- `pages/RelacionesPublicas/ComprasComp.tsx:88` — **`soporte@fourvenues.com` se muestra como
  texto visible al comprador**. Es lo único de esta lista con consecuencia inmediata: mientras
  el subdominio de entradas esté publicado, un cliente con un problema escribe a otra empresa.
  Arreglo de un minuto cuando se decida el correo de soporte propio.
- 37 clases CSS exportadas de ese sitio (`text-wwwfourvenuescom-*`) que **no están definidas en
  ninguna parte**: no pintan nada. Los colores de texto que debían aplicar no se aplican.
- 27 `bg-[#6096B9]` — el azul de eventosorganizador, fijo, no un respaldo.
- `development: "bodasdehoy"` escrito a mano en 5 sitios y correos de relleno (`f@gmail.com`).

## 3. Límite de plan: el módulo está hecho y probado, falta llamarlo

`utils/planLimitFromApiError.ts` (87 líneas) detecta que el backend ha rechazado algo por
cuota — HTTP 402, código de error, marcador en el mensaje, y el caso traicionero de una
respuesta con éxito aparente que dentro trae el rechazo. **Pasa sus 10 pruebas hoy.**

Los dos extremos del puente están vivos: `components/InfoApp/ObtenerFullAcceso.tsx` (el modal
de mejora) y los formularios de invitados. **Nadie llama al detector**: comprobado en todo el
historial, la única línea que lo ha importado jamás es la de su propio test.

Consecuencia: cuando un anfitrión llega a su límite de invitados no ve la oferta de mejora,
justo en el momento en que pagaría. Es trabajo de minutos, no de días — y es lo que más
rendimiento da de esta lista.

## 4. Limpieza de código muerto: lo hecho y lo que queda

Hecho el 18-09: 42 ficheros y ~5.400 líneas huérfanas borradas (commits `b1e354b4` y
`810bc9d5`), verificado con un build completo de appEventos.

Queda **sin tocar**: 23 ficheros (~3.000 líneas) marcados como dudosos porque su nombre aparece
en algún sitio —documentación, o un fichero cuyo nombre contiene al otro, como `GuestTable`
dentro de `GuestTableAll`—. Hay que mirarlos uno a uno.

**Dos trampas comprobadas al borrar, que morderán a quien siga:**

1. **Tildes.** macOS guarda los nombres de fichero descompuestos (`n` + tilde) y el código los
   escribe compuestos (`ñ`). Un detector que compare las dos cosas da por huérfanos ficheros
   vivos: pasó con `DiseñoComponent` y `FormAcompañante`, los dos se borraron y hubo que
   restaurarlos. Normalizar con `unicodedata.normalize('NFC', ...)` **en los dos lados**.
2. **git escapa los nombres no ASCII** (`Dise\303\261o`) en `git diff --name-only`, así que la
   comprobación de seguridad hereda la misma ceguera. Usar `-z`.

Y las cuatro formas de importar, no solo la primera: `from '...'`, `import('...')`,
`import '...'` (efecto secundario) y `require('...')`. Mirar solo la primera daba por muerto
`CopilotEmbed`, 1.295 líneas del chat IA integrado, que está vivo.

## 5. Tercera capa del whitelabel, sin barrer

336 colores escritos a mano dentro de clases Tailwind con valor arbitrario (`bg-[#FCE7F0]`),
en 62 ficheros. Los barridos anteriores cubrieron literales sueltos y clases `pink-*`; esta
sintaxis no la toca ninguna de las dos reglas.

**Ojo: aquí no todo es marca.** `text-[#3A3A42]`, `border-[#f0f0f2]` y `text-[#a0a0a8]` son
grises y deben quedarse. Convertirlos en masa sería el error simétrico al de pintar de rosa el
distintivo de Instagram.
