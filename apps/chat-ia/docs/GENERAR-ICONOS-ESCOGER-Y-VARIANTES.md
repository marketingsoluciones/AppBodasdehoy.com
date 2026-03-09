# Generar iconos, escoger los que te gustan y hacer variantes

Flujo simple: **generar** → **revisar** → **elegir** → **pedir variantes** de los elegidos.

---

## 1. Generar las imágenes

Usa Banana (Nano Banana) o cualquier text-to-image. Por cada icono, manda el **prompt** y pide **varias imágenes** (ej. `num: 4`) para tener opciones.

**API (Nano Banana):**  
`POST https://api.nanobananaapi.dev/v1/images/generate`  
Body: `{ "prompt": "...", "num": 4, "model": "gemini-2.5-flash-image", "image_size": "1:1" }`

### Prompts por icono (copiar y pegar)

**1. Chat**
```
Minimalist line icon, single chat bubble with small tail, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**2. Conocimiento / archivos**
```
Minimalist line icon, open folder or open book with content lines, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**3. Imagen IA**
```
Minimalist line icon, painter palette with color circle or brush, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**4. Recuerdos**
```
Minimalist line icon, overlapping photo rectangles or heart, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**5. Bandeja**
```
Minimalist line icon, envelope with flap or inbox tray, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**6. Bodas**
```
Minimalist line icon, wedding rings intertwined or heart, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**7. Descubrir**
```
Minimalist line icon, compass or magnifying glass, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**8. Enviar**
```
Minimalist line icon, paper plane or arrow in circle, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**9. Micrófono**
```
Minimalist line icon, microphone on stem, side view, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

**10. Adjuntar**
```
Minimalist line icon, paperclip side view, outline only, no fill, black stroke on white background, centered, 2px stroke, square 1:1. No text.
```

---

## 2. Escoger los que te gustan

- Descarga o guarda todas las imágenes generadas.
- Marca o anota: **qué icono** (1–10) y **qué imagen** (ej. “Chat – imagen 3”) te gusta.
- Los que no te gustan, descártalos.

---

## 3. Pedir variantes de los elegidos

Cuando tengas uno que te gusta, genera **variantes** usando el mismo concepto con pequeños cambios en el prompt. Usa el prompt original como base y añade o cambia solo lo que quieras.

### Ejemplos de variantes (añadir al final del prompt)

- **Más grueso:**  
  `Same icon, thicker stroke, bolder line.`

- **Más fino:**  
  `Same icon, thinner stroke, more delicate.`

- **Más redondo:**  
  `Same icon, rounder shapes, soft corners.`

- **Más geométrico:**  
  `Same icon, more geometric, sharp edges.`

- **Más minimal:**  
  `Same icon, even more minimal, fewer details.`

- **Un poco más grande en el encuadre:**  
  `Same icon, slightly larger in frame, less padding.`

- **Más pequeño en el encuadre:**  
  `Same icon, smaller in frame, more padding.`

### Cómo usarlo

1. Copia el **prompt del icono** que te gustó (ej. Chat).
2. Añade una frase de variante, por ejemplo:  
   `Minimalist line icon, single chat bubble with small tail... No text. Same icon, thicker stroke, bolder line.`
3. Genera otra vez con `num: 2` o `num: 4` y elige entre las nuevas imágenes.

Puedes repetir con otra variante (más fino, más redondo, etc.) hasta quedarte con la versión que quieras.

---

## Resumen

1. **Generar:** Usa los 10 prompts con `num: 4` (o 2–3) para tener varias opciones por icono.
2. **Escoger:** Revisas todas, te quedas solo con las que te gustan.
3. **Variantes:** Para cada una elegida, pides variantes añadiendo al prompt cosas como “thicker stroke”, “thinner”, “more minimal”, “rounder”, etc., y generas de nuevo hasta tener la versión final.

No hace falta whitelabel ni proxy para este flujo: solo la API de generación (Banana u otra) y estos prompts.
