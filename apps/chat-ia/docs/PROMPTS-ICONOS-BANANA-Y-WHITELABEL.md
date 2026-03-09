# Prompts para crear iconos con Banana (Nano Banana) y uso con whitelabel bodasdehoy

Este documento contiene **prompts listos** para generar los iconos del chat con [Nano Banana API](https://nanobananaapi.dev/docs) (text-to-image) y cómo usarlos en entorno **whitelabel** para el developer **bodasdehoy**.

---

## 1. API usada: Nano Banana (text-to-image)

- **Endpoint:** `POST https://api.nanobananaapi.dev/v1/images/generate`
- **Headers:** `Authorization: Bearer YOUR_API_KEY`, `Content-Type: application/json`
- **Body:** `prompt`, `num`, `model`, `image_size`
- **Tamaño para iconos:** `image_size: "1:1"` (512×512 o el que devuelva el modelo).
- **Modelo recomendado (económico):** `gemini-2.5-flash-image` (2 créditos/imagen).

No hay integración whitelabel directa en Nano Banana: la API key es por cuenta. La parte whitelabel (bodasdehoy) se hace en **vuestro backend** (api-ia o app) guardando una API key por tenant y enviando `X-Development` cuando el front llama a vuestro proxy (ver sección 3).

---

## 2. Prompts por icono (tamaño, estilo, descripción)

Usar cada prompt en el campo `prompt` del body. Mantener **image_size: "1:1"** para todos.

### Especificaciones comunes para todos

- **Estilo:** icono de línea (line icon), minimalista, 2-3 trazos, sin relleno.
- **Fondo:** blanco puro o transparente.
- **Color del trazo:** negro (#000), grosor equivalente a ~2px en 24px.
- **Composición:** centrado, padding visual; encuadre cuadrado 1:1.

---

### 1. Chat / mensajes

```
Minimalist line icon, single chat bubble with a small tail, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Sidebar “Chat”, mensajes.

---

### 2. Base de conocimiento / archivos

```
Minimalist line icon, open folder or open book with two lines suggesting content, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Sidebar “Base de conocimiento”.

---

### 3. Imagen IA / creatividad

```
Minimalist line icon, painter palette with small color circle or single brush, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Sidebar “Imagen IA”.

---

### 4. Recuerdos / galería

```
Minimalist line icon, two or three overlapping photo rectangles or a simple heart shape, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Sidebar “Recuerdos (Memories)”.

---

### 5. Bandeja de entrada

```
Minimalist line icon, envelope with flap or inbox tray, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Sidebar “Bandeja de mensajes”.

---

### 6. Creador de bodas

```
Minimalist line icon, two wedding rings intertwined or a simple heart, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Sidebar “Creador de bodas”.

---

### 7. Descubrir / explorar

```
Minimalist line icon, compass with circle and needle or magnifying glass, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Sidebar “Descubrir”.

---

### 8. Enviar mensaje

```
Minimalist line icon, paper plane or short arrow inside circle, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Botón enviar del chat.

---

### 9. Micrófono

```
Minimalist line icon, microphone on stem, side view, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Acción STT (voz) en el input.

---

### 10. Adjuntar archivo

```
Minimalist line icon, paperclip, side view, outline only, no fill, black stroke on white background, centered in square frame, 2px stroke weight, clean vector style, 24px design for app icon. No text.
```

**Uso en UI:** Subir archivo en el input.

---

## 3. Uso con whitelabel para el developer bodasdehoy

No hay “conexión” automática entre Nano Banana y vuestro whitelabel. La idea es que **el backend del developer bodasdehoy** (api-ia o la app) sea quien llame a Banana y use el tenant para elegir API key y/o almacenar iconos por desarrollo.

### Opción A: Proxy en api-ia (recomendado)

1. **En api-ia:** Crear un endpoint, por ejemplo:
   - `POST /webapi/images/generate` (o `/webapi/whitelabel/generate-icon`).
2. **Headers del cliente:** El front envía los mismos que para chat:
   - `Authorization: Bearer <JWT>`
   - `X-Development: bodasdehoy`
3. **Body:** Incluir al menos `prompt` y opcionalmente `image_size`, `model`. Ejemplo:
   ```json
   { "prompt": "...", "image_size": "1:1", "model": "gemini-2.5-flash-image" }
   ```
4. **En api-ia:** Leer `X-Development`; obtener la API key de Nano Banana para ese tenant (por ejemplo desde getWhiteLabelConfig o desde vuestra config por desarrollo); llamar a `https://api.nanobananaapi.dev/v1/images/generate` con esa key; devolver la URL de la imagen o el binario.
5. Así el **developer bodasdehoy** solo usa su JWT y `X-Development: bodasdehoy`; nunca toca la API key de Banana.

### Opción B: Script/Cliente con API key por tenant

Si no tenéis proxy, el developer bodasdehoy puede tener en su `.env`:

- `NANO_BANANA_API_KEY` (o por tenant: `NANO_BANANA_API_KEY_BODASDEHOY`).

Y un script (Node/Python) que:

1. Lea el prompt (o el número de icono).
2. Llame a Nano Banana con esa key.
3. Guarde el resultado (por ejemplo en `/public/icons/` o en CDN) para usarlo en chat-ia.

No hay “whitelabel” en la API de Banana; el whitelabel es en **quién** tiene la key y **qué** dominio/tenant usa cada key en vuestra arquitectura.

### Ejemplo de llamada desde el front (contra vuestro proxy)

Si api-ia expone el endpoint de la Opción A:

```ts
// Ejemplo: generar icono "Chat" para whitelabel bodasdehoy
const res = await fetch('https://api-ia.bodasdehoy.com/webapi/images/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
    'X-Development': 'bodasdehoy',
  },
  body: JSON.stringify({
    prompt: 'Minimalist line icon, single chat bubble with a small tail...',
    image_size: '1:1',
    model: 'gemini-2.5-flash-image',
  }),
});
const data = await res.json();
// data.url o data.data.url según contrato de api-ia
```

---

## 4. Resumen para el developer bodasdehoy

- **Prompts:** Usar los de la **sección 2** en el campo `prompt` de Nano Banana, con `image_size: "1:1"`.
- **Tamaño en código:** En la app los iconos se usan a 24px o 20px; las imágenes generadas en 1:1 se pueden redimensionar por CSS o en build.
- **Whitelabel:** Implementar un proxy en api-ia que reciba `X-Development: bodasdehoy` y use la API key de Banana correspondiente a ese tenant (Opción A), o usar un script con API key por tenant (Opción B).
- **Referencia de headers whitelabel:** Ver `docs/X-DEVELOPMENT-VS-X-SUPPORT-KEY.md` (X-Development, X-Support-Key, getWhiteLabelConfig).

Si quieres, en el repo se puede añadir un script `scripts/generate-icons-banana.mjs` que reciba el número de icono (1–10) y llame a la API (o a vuestro proxy) con el prompt correspondiente y guarde el resultado en una ruta fija.
