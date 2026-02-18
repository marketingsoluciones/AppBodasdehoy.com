# Respuestas completas – Baterías C y D (17 feb 2026)

Resumen de cómo fueron los tests: **Batería C** 18/20 OK (2 fallos: #15 502, #17 503). **Batería D** 17/20 OK (3 fallos: #13, #14, #17 → 503).  
A continuación, cada pregunta con la **respuesta** que devolvió api-ia.

---

## Batería C – Pregunta y respuesta

| # | Pregunta | HTTP | Respuesta (texto devuelto por api-ia) |
|---|----------|------|----------------------------------------|
| 1 | Buenos días, ¿qué puedo hacer hoy? | 200 | 🌞 Buenos días. Hay varias cosas que puedes hacer hoy: 1) Revisar eventos próximos, 2) Crear un nuevo evento, 3) Verificar lista de invitados, 4) Revisar presupuesto. ¿Hay algo en particular que te gustaría hacer hoy? 🤔 |
| 2 | ¿Cuánto cuesta el banquete en total? | 200 | Para darte una respuesta precisa necesito obtener información actualizada. Ejecutando `get_user_events()`… Una vez tenga los detalles podré darte el costo total del banquete. |
| 3 | Elimina la tarea de contratar DJ | 200 | Para eliminar la tarea necesito ubicar el evento. ¿Cuál es el nombre del evento? Luego identificaré el evento con `get_user_events`, encontraré la tarea y la eliminaré con la herramienta adecuada. |
| 4 | ¿Qué decoración tengo contratada? | 200 | Eventos encontrados: Boda — Decoración: Floristería, Alquiler de mobiliario; Cumpleaños — Globos y decoración temática, Fotomatón. Enlace a organizador.bodasdehoy.com/eventos. |
| 5 | Muéstrame el desglose de invitados por mesa | 200 | Ejecuta get_user_events y get_event_guests. Devuelve JSON con mesas e invitados (ej. Mesa 1: Pedro, María; Mesa 2: Juan, Luisa) y estado de confirmación. |
| 6 | ¿Cuándo es la entrega del vestido? | 200 | No tengo acceso a esa información. Sugiere verificar contrato o proveedor y enlace a eventos. |
| 7 | Añade un invitado: Laura Martínez, mesa 3 | 200 | "He procesado tu solicitud pero alcancé el límite de operaciones." |
| 8 | ¿Dónde está el banquete? | 200 | Necesito saber a qué evento te refieres. ¿Boda de Paco y Pico u otro? Puedo ejecutar get_user_events() para mostrar tus próximos eventos. |
| 9 | ¿Cuántos invitados son vegetarianos? | 200 | Ejecutando search_special_menu_guests. Encontré **15** invitados vegetarianos en el evento Boda de Ana y Juan del 15/06/2026. |
| 10 | Recomiéndame un pastel de boda para 80 personas | 200 | Respuesta mostró búsqueda de invitados con menús especiales (NINO, CELIACO) con lista de invitados y enlaces; no recomendación de pastel (posible confusión de herramienta). |
| 11 | ¿Qué regalos me han enviado ya? | 200 | Necesito ejecutar get_user_events y get_event_gifts. ¿Podrías esperar mientras ejecuto la herramienta? Luego diré qué regalos has recibido. |
| 12 | Pon recordatorio para confirmar catering la próxima semana | 200 | Recordatorio: Confirmar catering. Pasos: revisar detalles, confirmar con proveedor, verificar disponibilidad, firmar contrato. Enlace a proveedores de catering. |
| 13 | ¿Quién se sienta en la mesa 5? | 200 | Necesito el event_id del evento. Si no lo tienes, puedo buscarlo por nombre o fecha. |
| 14 | Dame opciones de transporte para invitados | 200 | Opciones: autobuses de lujo, taxis colectivos, transporte privado, estacionamiento y traslado, transporte público, alquiler de vehículos, transporte para discapacitados. Incluye consideraciones de costos. |
| 15 | ¿Qué facturas tengo pendientes de pago? | **502** | *(Sin respuesta; error del servidor.)* |
| 16 | ¿A qué hora es la ceremonia? | 200 | No tengo información sobre una ceremonia específica. ¿Podrías dar más contexto? |
| 17 | Asigna a los García a la mesa principal | **503** | *(Error: "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.")* |
| 18 | Sugiere una canción para el baile de los novios | 200 | Sugiere **"A Thousand Years" de Christina Perri**: clásico para bodas, melodía suave y emotiva. ¿Quieres más sugerencias? |
| 19 | Texto corto para las invitaciones de boda | 200 | Plantilla: "Con gran alegría te invitamos… [Nombre novia] y [Nombre novio] se casarán el [Fecha] en [Lugar]. Hora, Recepción, RSVP." |
| 20 | ¿Cuánto he pagado al fotógrafo? | 200 | Ejecutando search_budgets_by_category. Encontré gasto en Fotografía: **2.000 €** pagados al fotógrafo. Enlace a presupuesto. |

---

## Batería D – Pregunta y respuesta (Frontend levantado)

| # | Pregunta | HTTP | Respuesta (texto devuelto por api-ia) |
|---|----------|------|----------------------------------------|
| 1 | Hola, necesito ayuda con mi boda | 200 | ¡Hola! Puedo ayudarte con: planificación general, fecha y lugar, presupuesto, invitaciones, decoración, música, comida, fotografía y más. ¿Qué te preocupa o quieres resolver? |
| 2 | ¿Cuál es el total del presupuesto? | 200 | "Lo siento, pero no puedo acceder a tus datos en este momento. Por favor, intenta más tarde o verifica tu sesión." |
| 3 | Marca como hecha la tarea de reservar salón | 200 | Ejecutando get_user_tasks(). Tarea "Reservar salón" marcada como **HECHA**. Detalle: estado Hecha, fecha 17/02/2026, evento Boda de [Nombre]. |
| 4 | ¿Tengo proveedor de música? | 200 | Ejecutando get_user_providers. Resultado: proveedor **DJ Master** (Música) asociado al evento. ¿Ver detalles o agregar otro? |
| 5 | ¿Cuánto he gastado en decoración? | 200 | Necesito consultar presupuesto. Dime el nombre del evento para buscar el presupuesto y calcular el gasto en decoración. |
| 6 | Lista los invitados con dieta especial | 200 | Búsqueda de menús especiales (nino, celiaco, vegano): 43 invitados. Lista con enlaces por categoría (NINO 16, CELIACO 15, VEGANO 14) y enlaces a fichas. |
| 7 | Cambia el menú del banquete a menú degustación | 200 | Necesito verificar evento y menú asignado. ¿Nombre del evento? Ejecutaré get_user_events y get_event_details. |
| 8 | ¿En qué ciudad es el evento? | 200 | No tengo información del evento que estemos discutiendo. ¿Más contexto? |
| 9 | Invitados que aún no han confirmado | 200 | Misma búsqueda de menús especiales (nino, celiaco, vegano) con 43 invitados y enlaces; no filtra por “no confirmados”. |
| 10 | Ideas de centros de mesa low cost | 200 | Ideas: velitas y flores, frutas y hojas, botellas y flores, candelabros, centros de papel, frascos con flores, piedras y conchas, madera, velitas flotantes, reciclaje. Con costes aproximados (ej. 5–10 €). |
| 11 | ¿Puedo ver mi lista de bodas de regalo? | 200 | Ejecutando get_user_events para encontrar bodas. ¿Confirmas si quieres la lista para un evento concreto o "todos"? (Ej.: "Boda de Juan y María" o "todos"). |
| 12 | Recordatorio: llamar al catering mañana | 200 | Nota: recuerda llamar al **catering** mañana para confirmar fecha, hora, invitados y especificaciones. ¿Ayuda para encontrar teléfono u otro detalle? |
| 13 | Dame el nombre del invitado en asiento 12 | **503** | *(Error: "El proveedor ha alcanzado su límite de solicitudes. Por favor, intenta de nuevo en unos momentos.")* |
| 14 | Opciones de alojamiento para invitados | **503** | *(Error: mismo mensaje de límite de solicitudes.)* |
| 15 | Próximos pagos del evento | 200 | Necesito identificar el evento (nombre, tipo, fecha). Luego accederé al presupuesto y mostraré los próximos pagos pendientes. |
| 16 | Horario completo del día de la boda | 200 | Ejemplo de horario: mañana (preparativos, fotos), tarde (ceremonia, fotos), noche (recepción, banquete, discursos, pastel, baile). Con detalles y sugerencia de compartir con proveedores. |
| 17 | Renombra la mesa 2 a "Amigos del trabajo" | **503** | *(Error: "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.")* |
| 18 | Playlist sugerida para el cóctel | 200 | Lista por categorías: Jazz (Ella Fitzgerald, Louis Armstrong, Duke Ellington), acústica (Jack Johnson, Jason Mraz), pop/rock suave (Beatles, Fleetwood Mac), instrumental (Einaudi, Richter), románticas (John Legend, Ed Sheeran, Adele). |
| 19 | Borrador de tarjeta de agradecimiento | 200 | Borrador con: Para [Nombre], agradecimiento por [motivo], mención de apoyo/regalo, mensaje de buenos deseos, firma. Incluye guía de personalización. |
| 20 | Estado de pago del salón | 200 | Necesito get_event_details con event_id. ¿Puedes confirmar nombre del evento o event_id? Luego mostraré el estado de pago del salón. |

---

## Resumen de fallos

- **Batería C:** 502 en #15 (facturas pendientes); 503 en #17 (asignar García a mesa principal – respuesta vacía/genérica).
- **Batería D:** 503 en #13 y #14 (límite de solicitudes del proveedor); 503 en #17 (renombrar mesa – respuesta vacía/genérica).

Las respuestas completas sin recortar están en los JSON:  
`resultados-20-preguntas-bateria-c-2026-02-17.json` y `resultados-20-preguntas-bateria-d-2026-02-17.json` (en la raíz del repo).
