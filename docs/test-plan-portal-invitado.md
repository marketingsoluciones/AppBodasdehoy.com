# Plan de Pruebas — Portal del Invitado (pre-producción)

> Estado: 🔄 En ejecución
> Fecha: 2026-03-03
> URL base: https://app-test.bodasdehoy.com

---

## Flujos a probar

### T1 — Portal principal `/e/[eventId]`

| # | Caso | Acción | Esperado | Estado |
|---|------|---------|---------|--------|
| T1.1 | Anónimo — primera visita, sin momentos | Abrir portal | Portada evento, sin modal automático, empty state "sin momentos" | ⬜ |
| T1.2 | Anónimo — primera visita, con momentos | Abrir portal | Modal "¿Cómo te llamas?" aparece ~800ms | ⬜ |
| T1.3 | Dar nombre → persistencia | Introducir nombre, refrescar | `guest_session_{eventId}` en localStorage, "Hola, {nombre}" al volver | ⬜ |
| T1.4 | Token válido `?g=TOKEN` | Abrir portal con token real | Nombre del invitado del sistema, nivel 2 (verificado) | ⬜ |
| T1.5 | Token inválido `?g=FAKE` | Abrir portal con token falso | Fallback anónimo gracioso, sin error visible | ⬜ |
| T1.6 | Sesión distinta por evento | Dos eventIds distintos | localStorage aislado por eventId | ⬜ |
| T1.7 | Botón instalar iOS | Safari iOS (o simulado) | Botón visible, click abre modal instrucciones | ⬜ |
| T1.8 | Botón instalar Android/Desktop | Chrome DevTools | Botón visible si `beforeinstallprompt` se dispara | ⬜ |
| T1.9 | Modo standalone | Instalado como PWA | Botón "Instalar" oculto | ⬜ |
| T1.10 | EventId no existe | URL con ID inventado | Pantalla "Evento no encontrado" | ⬜ |

### T2 — Galería `/e/[eventId]/m/[taskId]`

| # | Caso | Acción | Esperado | Estado |
|---|------|---------|---------|--------|
| T2.1 | Momento con álbum existente | Abrir galería | Grid de fotos, botón subir visible | ⬜ |
| T2.2 | Momento sin álbum | Abrir galería | "Aún no hay álbum", botón subir oculto | ⬜ |
| T2.3 | Anónimo intenta subir | Click en botón subir | Flujo funciona (usa anon_id de sesión) | ⬜ |
| T2.4 | Con nombre, subir foto real | Seleccionar archivo → upload | Foto aparece en galería | ⬜ |
| T2.5 | taskId inválido | URL con ID inventado | Estado de error gracioso | ⬜ |
| T2.6 | Botón atrás | Click header ← | Vuelve al portal del evento | ⬜ |

### T3 — RSVP → Redirect al portal

| # | Caso | Acción | Esperado | Estado |
|---|------|---------|---------|--------|
| T3.1 | Confirmar asistencia con eventId | Completar RSVP | Pantalla éxito + countdown 4s + redirect a `/e/{id}?g={token}` | ⬜ |
| T3.2 | Click enlace manual antes del countdown | Click "Ver el programa" | Redirect inmediato | ⬜ |
| T3.3 | RSVP sin eventId (legacy) | Confirmar sin eventId | No redirect, pantalla éxito estática | ⬜ |

### T4 — Buscador de mesa (inline en portal)

| # | Caso | Acción | Esperado | Estado |
|---|------|---------|---------|--------|
| T4.1 | Evento con mesas asignadas | Buscar nombre | Resultado con mesa + asiento | ⬜ |
| T4.2 | Evento sin mesas | Ver sección | Empty state "mesas no asignadas" | ⬜ |
| T4.3 | Búsqueda con tilde/acento | Buscar "María" → "maria" | Encuentra resultado | ⬜ |
| T4.4 | Nombre parcial | Buscar "Juan" cuando hay "Juan García" | Encuentra resultado | ⬜ |
| T4.5 | Nombre no encontrado | Buscar "XxXxX" | "No se encontró ningún invitado" | ⬜ |

### T5 — PWA Manifest dinámico

| # | Caso | Acción | Esperado | Estado |
|---|------|---------|---------|--------|
| T5.1 | Manifest por evento | GET /api/manifest/{eventId} | JSON con nombre del evento, start_url correcto | ⬜ |
| T5.2 | Manifest sin foto | Evento sin imgEvento | Usa /logo.png como icono | ⬜ |
| T5.3 | Manifest EventId inválido | GET /api/manifest/FAKE | Defaults genéricos (no crash) | ⬜ |

### T6 — Responsive (distintos tamaños de pantalla)

| # | Dispositivo | Viewport | Qué verificar | Estado |
|---|-------------|---------|---------------|--------|
| T6.1 | Mobile portrait (iPhone SE) | 375×667 | Header, momentos, buscador — sin overflow horizontal | ⬜ |
| T6.2 | Mobile portrait (iPhone 14) | 390×844 | Igual, más espacio | ⬜ |
| T6.3 | Tablet (iPad) | 768×1024 | Layout centrado, max-w-lg funciona | ⬜ |
| T6.4 | Desktop (1280px) | 1280×800 | Centrado, legible, no se estira | ⬜ |

### T7 — LocalStorage & almacenamiento

| # | Caso | Qué se guarda | Estado |
|---|------|--------------|--------|
| T7.1 | Nombre introducido | `guest_session_{eventId}` = `{guestId, guestName, level, eventId}` | ⬜ |
| T7.2 | Token QR válido | `guest_session_{eventId}` = `{guestId real, guestName real, level: 2, pGuestToken}` | ⬜ |
| T7.3 | Dos eventos distintos | Dos keys distintas en localStorage, no se mezclan | ⬜ |
| T7.4 | Sin datos (anónimo) | No hay key en localStorage | ⬜ |

### T8 — Creación de estructura de momentos (organizador)

| # | Caso | Acción | Esperado | Estado |
|---|------|---------|---------|--------|
| T8.1 | Botón "Crear álbumes" en /momentos | Autenticado, evento con itinerario | Crea álbum por cada tarea spectatorView | ⬜ |
| T8.2 | Portal actualizado tras crear | Abrir /e/{eventId} | Lista de momentos visible | ⬜ |

---

## Checklist de bugs conocidos / a verificar

- [ ] Modal no se abre si no hay momentos (hasMoments = false)
- [ ] Botón upload oculto cuando error === 'no_album'
- [ ] Token inválido → anónimo (sin crash JS)
- [ ] Servidor Next.js cache — manifest cambia al cambiar evento
- [ ] iOS: `navigator.standalone` detectado correctamente
- [ ] Desktop Chrome: `beforeinstallprompt` se captura antes de que el navegador lo use
- [ ] CSP / CORS — manifest servido con Content-Type correcto
- [ ] Imágenes de api-ia cargadas via https (no mixed content)

---

## Resultados por ejecutar

> Se irán completando durante la sesión de testing

