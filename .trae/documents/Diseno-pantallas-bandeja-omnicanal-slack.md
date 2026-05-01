# Diseño de pantallas — Bandeja Omnicanal tipo Slack (desktop-first)

## Global Styles (tokens)
- Grid base: 8px; radios: 8px; sombras sutiles en cards.
- Tipografía: Inter/System; escala 12/14/16/20; peso 400/600.
- Colores: fondo `#0B1220` (app) o `#0F172A`; superficies `#111827`; bordes `#1F2937`; texto `#E5E7EB`; secundario `#94A3B8`.
- Accento: `#6366F1` (acciones primarias); éxito `#22C55E`; warning `#F59E0B`; error `#EF4444`.
- Botones: primary sólido; secondary outline; hover +6% brillo; disabled 40% opacidad.
- Badges SLA: verde (ok), ámbar (por vencer), rojo (vencido) con contador visible.

---

## Página: Login
### Layout
- Centrado con Flexbox; contenedor fijo (max-width 420px) y padding generoso.

### Meta Information
- Title: “Acceder — Bandeja Omnicanal”
- Description: “Inicia sesión para gestionar conversaciones omnicanal.”

### Page Structure
1. Marca + nombre del producto.
2. Formulario de acceso.
3. Mensajes de estado (error / cargando).

### Sections & Components
- Card “Login”: email, password, botón “Entrar”, link “¿Olvidaste tu contraseña?” (si existe en Auth).
- Estados:
  - Error credenciales (texto breve).
  - Loading en botón.

---

## Página: Bandeja Omnicanal (3 paneles siempre visibles)
### Layout
- CSS Grid 3 columnas (desktop-first):
  - Col 1 Sidebar: 280px (min 240 / max 320)
  - Col 2 Lista: 420px (min 360 / max 520)
  - Col 3 Detalle: 1fr (mín 520)
- Altura: 100vh; header fijo (48–56px) + contenido scrollable por panel.
- Cada panel con scroll independiente (evita perder contexto al leer detalles).

### Meta Information
- Title: “Bandeja — Omnicanal”
- Description: “Gestiona conversaciones, notas internas, asignación y SLA.”
- OG: título + descripción; (opcional) imagen del producto.

### Page Structure
1. **Top Bar (global)**
2. **Sidebar (izquierda)**
3. **Lista de conversaciones (centro)**
4. **Detalle de conversación (derecha)**

### 1) Top Bar (global)
- Izquierda: nombre de organización/espacio y vista actual.
- Centro: búsqueda global (busca en conversaciones de la vista).
- Derecha: usuario (avatar), estado, salir.

### 2) Sidebar (colas y vistas)
**Componentes**
- Sección “Vistas”: Mis asignadas, Sin asignar, Vencidas SLA.
- Sección “Colas/Buzones”: lista con contador (pendientes) y estado (normal/alerta).
- Sección “Filtros rápidos”: canal (chips), estado (open/pending/closed).

**Interacción**
- Al cambiar vista/cola, la lista se refresca y el detalle mantiene selección si aún existe; si no, muestra estado vacío en detalle.

### 3) Lista de conversaciones
**Fila (ConversationRow)**
- Izquierda: icono canal + indicador no leído.
- Centro: nombre/contacto (si existe), preview del último mensaje, etiquetas.
- Derecha: asignado (iniciales), badge SLA (contador), timestamp.

**Cabecera de lista**
- Orden: por SLA (due_at asc), luego last_message_at desc.
- Filtros: estado, asignado, canal; botón “Limpiar”.

**Estados**
- Empty: “No hay conversaciones en esta vista”.
- Loading skeleton.

### 4) Detalle de conversación
**Sub-layout interno (vertical)**
1. Header detalle
2. Timeline (scroll)
3. Composer (fijo abajo)

**4.1 Header detalle**
- Título: contacto + canal.
- Acciones: asignar (dropdown), cambiar estado (open/pending/closed), botón “Añadir nota interna”.
- SLA: badge con tipo activo + contador; tooltip con objetivos.

**4.2 Timeline**
- Mensajes en bloques:
  - Entrante (cliente): alineación izquierda.
  - Saliente (agente): alineación derecha.
  - Nota interna: bloque destacado con icono “lock” y label “Interno”.
- Cada item: autor, hora, y estado de envío si es saliente.

**4.3 Composer**
- Tabs o selector de modo: “Responder” / “Nota interna”.
- Área de texto multi-línea; atajos básicos (Enter para enviar, Shift+Enter salto línea).
- Botón enviar; estado disabled si vacío.
- Errores de envío: toast + opción reintentar.

### Responsive (mínimo)
- < 1024px: colapsar sidebar a iconos (rail) y permitir alternar lista/detalle con split ajustable.
