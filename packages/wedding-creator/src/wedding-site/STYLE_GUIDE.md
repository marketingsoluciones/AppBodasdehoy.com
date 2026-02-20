# Wedding Site Style Guide

Guia completa de estilos, paletas y tipografias para webs de boda.

## Paletas de Colores

### 1. Romantico (`romantic`)

**Descripcion**: Rosas suaves y tonos pastel. Ideal para bodas clasicas y femeninas.

| Variable | Color | Hex | Uso |
|----------|-------|-----|-----|
| Primary | Rosa suave | `#d4a5a5` | Botones, enlaces |
| Secondary | Rosa claro | `#f0e6e6` | Fondos secundarios |
| Accent | Rosa medio | `#c9a9a9` | Detalles, bordes |
| Background | Fondo rosado | `#fff9f9` | Fondo general |
| Surface | Blanco | `#ffffff` | Tarjetas, modales |
| Text | Gris oscuro | `#4a3f3f` | Texto principal |
| Text Light | Gris medio | `#7a6f6f` | Texto secundario |
| Border | Rosa borde | `#e8d8d8` | Bordes, separadores |

**Fuentes**:
- Heading: Playfair Display
- Body: Lato

**Ideal para**: Bodas primaverales, estilo vintage, romantico clasico.

---

### 2. Elegante (`elegant`)

**Descripcion**: Negro, dorado y tonos sofisticados. Para bodas de lujo.

| Variable | Color | Hex | Uso |
|----------|-------|-----|-----|
| Primary | Dorado | `#c9a962` | Botones, acentos |
| Secondary | Gris claro | `#f5f5f5` | Fondos secundarios |
| Accent | Dorado suave | `#d4b87a` | Detalles |
| Background | Casi blanco | `#fafafa` | Fondo general |
| Surface | Blanco | `#ffffff` | Tarjetas |
| Text | Negro | `#1a1a1a` | Texto principal |
| Text Light | Gris | `#666666` | Texto secundario |
| Border | Gris borde | `#e0e0e0` | Bordes |

**Fuentes**:
- Heading: Cormorant Garamond
- Body: Montserrat

**Ideal para**: Bodas de gala, hoteles de lujo, estilo glamuroso.

---

### 3. Moderno (`modern`)

**Descripcion**: Minimalista con colores neutros y lineas limpias.

| Variable | Color | Hex | Uso |
|----------|-------|-----|-----|
| Primary | Verde menta | `#2d5a4a` | Botones, enlaces |
| Secondary | Gris verdoso | `#e8ede9` | Fondos secundarios |
| Accent | Menta claro | `#4a7c6f` | Detalles |
| Background | Blanco | `#ffffff` | Fondo general |
| Surface | Blanco | `#ffffff` | Tarjetas |
| Text | Gris oscuro | `#333333` | Texto principal |
| Text Light | Gris medio | `#777777` | Texto secundario |
| Border | Gris suave | `#e5e5e5` | Bordes |

**Fuentes**:
- Heading: Josefin Sans
- Body: Libre Baskerville

**Ideal para**: Bodas urbanas, estilo contemporaneo, millennials.

---

### 4. Rustico (`rustic`)

**Descripcion**: Tonos tierra y naturaleza. Para bodas al aire libre.

| Variable | Color | Hex | Uso |
|----------|-------|-----|-----|
| Primary | Terracota | `#a67c52` | Botones, enlaces |
| Secondary | Beige | `#f5f0e8` | Fondos secundarios |
| Accent | Marron | `#8b6b4a` | Detalles |
| Background | Crema | `#fdfbf7` | Fondo general |
| Surface | Blanco | `#ffffff` | Tarjetas |
| Text | Marron oscuro | `#3d3125` | Texto principal |
| Text Light | Marron medio | `#6b5d4d` | Texto secundario |
| Border | Beige oscuro | `#e0d5c5` | Bordes |

**Fuentes**:
- Heading: Amatic SC
- Body: Quicksand

**Ideal para**: Bodas en campo, granjas, estilo boho.

---

### 5. Playa (`beach`)

**Descripcion**: Azules y turquesas. Para bodas junto al mar.

| Variable | Color | Hex | Uso |
|----------|-------|-----|-----|
| Primary | Azul oceano | `#4a90a4` | Botones, enlaces |
| Secondary | Azul muy claro | `#e8f4f8` | Fondos secundarios |
| Accent | Turquesa | `#5ba3b5` | Detalles |
| Background | Casi blanco | `#f9fcfd` | Fondo general |
| Surface | Blanco | `#ffffff` | Tarjetas |
| Text | Azul oscuro | `#2c4a52` | Texto principal |
| Text Light | Azul gris | `#5a7a82` | Texto secundario |
| Border | Azul borde | `#d0e5eb` | Bordes |

**Fuentes**:
- Heading: Pacifico
- Body: Open Sans

**Ideal para**: Bodas en playa, destinos tropicales, estilo nautico.

---

### 6. Clasico (`classic`)

**Descripcion**: Colores tradicionales y atemporales.

| Variable | Color | Hex | Uso |
|----------|-------|-----|-----|
| Primary | Azul marino | `#2c3e50` | Botones, enlaces |
| Secondary | Gris azulado | `#ecf0f1` | Fondos secundarios |
| Accent | Azul claro | `#3d566e` | Detalles |
| Background | Blanco | `#ffffff` | Fondo general |
| Surface | Blanco | `#ffffff` | Tarjetas |
| Text | Gris oscuro | `#2c3e50` | Texto principal |
| Text Light | Gris medio | `#7f8c8d` | Texto secundario |
| Border | Gris borde | `#dce1e3` | Bordes |

**Fuentes**:
- Heading: Crimson Text
- Body: Raleway

**Ideal para**: Bodas tradicionales, iglesias, estilo conservador.

---

## Variables CSS

Todas las paletas generan las siguientes variables CSS:

```css
:root {
  /* Colores */
  --wedding-primary: #...;
  --wedding-secondary: #...;
  --wedding-accent: #...;
  --wedding-background: #...;
  --wedding-surface: #...;
  --wedding-text: #...;
  --wedding-text-light: #...;
  --wedding-border: #...;

  /* Fuentes */
  --wedding-font-heading: 'Font Name', serif;
  --wedding-font-body: 'Font Name', sans-serif;
}
```

### Uso en Componentes

```tsx
// En estilos CSS/Tailwind
.my-component {
  color: var(--wedding-text);
  background: var(--wedding-background);
  border: 1px solid var(--wedding-border);
}

// En styled-jsx
<style jsx>{`
  .button {
    background: var(--wedding-primary);
    color: white;
  }
`}</style>
```

---

## Tipografias

### Google Fonts Utilizadas

| Fuente | Estilo | Paletas |
|--------|--------|---------|
| Playfair Display | Serif elegante | romantic |
| Cormorant Garamond | Serif clasico | elegant |
| Josefin Sans | Sans-serif moderno | modern |
| Amatic SC | Handwritten | rustic |
| Pacifico | Script casual | beach |
| Crimson Text | Serif tradicional | classic |
| Lato | Sans-serif neutro | romantic |
| Montserrat | Sans-serif geometrico | elegant |
| Libre Baskerville | Serif legible | modern |
| Quicksand | Sans-serif redondeado | rustic |
| Open Sans | Sans-serif limpio | beach |
| Raleway | Sans-serif elegante | classic |

### Tamaños Recomendados

```css
/* Titulos principales (nombres pareja) */
h1 {
  font-family: var(--wedding-font-heading);
  font-size: 3rem;    /* 48px */
  font-weight: 600;
}

/* Titulos de seccion */
h2 {
  font-family: var(--wedding-font-heading);
  font-size: 2rem;    /* 32px */
  font-weight: 500;
}

/* Subtitulos */
h3 {
  font-family: var(--wedding-font-heading);
  font-size: 1.5rem;  /* 24px */
  font-weight: 500;
}

/* Texto normal */
p {
  font-family: var(--wedding-font-body);
  font-size: 1rem;    /* 16px */
  line-height: 1.6;
}

/* Texto pequeño */
small {
  font-family: var(--wedding-font-body);
  font-size: 0.875rem; /* 14px */
}
```

---

## Espaciado

### Sistema de Espaciado

Usamos un sistema basado en 4px:

| Nombre | Valor | Uso |
|--------|-------|-----|
| xs | 4px | Espacios minimos |
| sm | 8px | Entre elementos relacionados |
| md | 16px | Padding estandar |
| lg | 24px | Entre secciones internas |
| xl | 32px | Entre secciones |
| 2xl | 48px | Espacios grandes |
| 3xl | 64px | Entre secciones principales |

### Aplicacion en Secciones

```css
/* Padding de secciones */
.section {
  padding: 64px 16px;  /* 3xl vertical, md horizontal */
}

/* En mobile */
@media (max-width: 768px) {
  .section {
    padding: 48px 16px;
  }
}

/* Espaciado entre elementos dentro de seccion */
.section-content {
  gap: 24px;  /* lg */
}
```

---

## Responsive Design

### Breakpoints

| Nombre | Ancho | Dispositivo |
|--------|-------|-------------|
| sm | 640px | Mobile grande |
| md | 768px | Tablet |
| lg | 1024px | Laptop |
| xl | 1280px | Desktop |

### Adaptaciones por Breakpoint

**Mobile (< 768px)**:
- Una columna
- Hero imagen mas pequeña
- Menu hamburguesa si aplica
- Galeria en una columna

**Tablet (768px - 1024px)**:
- Dos columnas en galeria
- Hero con menos padding
- Timeline vertical

**Desktop (> 1024px)**:
- Grid completo
- Hero con imagen grande
- Galeria masonry

---

## Componentes Comunes

### Botones

```tsx
// Primario
<Button variant="primary">
  Confirmar Asistencia
</Button>

// Secundario
<Button variant="secondary">
  Ver Mapa
</Button>

// Outline
<Button variant="outline">
  Cancelar
</Button>
```

**Estilos de Boton**:
```css
.btn-primary {
  background: var(--wedding-primary);
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  font-family: var(--wedding-font-body);
}

.btn-secondary {
  background: var(--wedding-secondary);
  color: var(--wedding-text);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--wedding-primary);
  color: var(--wedding-primary);
}
```

### Tarjetas

```css
.card {
  background: var(--wedding-surface);
  border: 1px solid var(--wedding-border);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
```

### Inputs

```css
.input {
  border: 1px solid var(--wedding-border);
  border-radius: 4px;
  padding: 12px 16px;
  font-family: var(--wedding-font-body);
  background: var(--wedding-surface);
  color: var(--wedding-text);
}

.input:focus {
  border-color: var(--wedding-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--wedding-primary-rgb), 0.1);
}
```

---

## Accesibilidad

### Contraste de Colores

Todas las paletas cumplen con WCAG 2.1 AA:
- Texto normal: ratio minimo 4.5:1
- Texto grande: ratio minimo 3:1

### Focus States

```css
/* Todos los elementos interactivos */
:focus-visible {
  outline: 2px solid var(--wedding-primary);
  outline-offset: 2px;
}
```

### Skip Links

```tsx
<a href="#main-content" className="skip-link">
  Saltar al contenido principal
</a>
```

---

## Animaciones

### Transiciones Estandar

```css
/* Transicion rapida (hover, focus) */
.transition-fast {
  transition: all 150ms ease;
}

/* Transicion normal (modales, dropdowns) */
.transition-normal {
  transition: all 200ms ease;
}

/* Transicion lenta (page transitions) */
.transition-slow {
  transition: all 300ms ease;
}
```

### Animaciones Especiales

```css
/* Countdown pulse */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Fade in on scroll */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Iconos

Usamos SVG inline para iconos. Ver `utils/icons.tsx` para iconos disponibles.

### Tamaños

| Nombre | Tamaño | Uso |
|--------|--------|-----|
| sm | 16px | Inline con texto |
| md | 20px | Botones |
| lg | 24px | Navegacion |
| xl | 32px | Features |

### Colores

Los iconos heredan el color del texto:
```css
.icon {
  color: currentColor;
}
```

O usan variables:
```css
.icon-primary {
  color: var(--wedding-primary);
}
```
