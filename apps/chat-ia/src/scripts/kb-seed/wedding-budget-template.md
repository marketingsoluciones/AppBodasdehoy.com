# Plantilla de Presupuesto de Boda — Base de Conocimiento del Organizador

## Distribución porcentual por categoría

Esta plantilla define los porcentajes recomendados del presupuesto total para cada categoría principal de una boda, así como las partidas habituales dentro de cada una.

### Categorías y porcentajes estándar

| Categoría | % del presupuesto | Notas |
|---|---|---|
| Venue / Finca | 20 – 25 % | Incluye alquiler del espacio, tasas municipales |
| Catering (comida y bebida) | 25 – 30 % | Cena de gala + cóctel + barra libre |
| Fotografía y vídeo | 10 – 12 % | Fotógrafo, videógrafo, álbum |
| Música y entretenimiento | 6 – 8 % | DJ, orquesta o grupo en vivo |
| Flores y decoración | 8 – 10 % | Centros de mesa, arco floral, pétalos |
| Vestuario y belleza | 8 – 10 % | Traje/vestido, arras, tocado, maquillaje |
| Papelería e invitaciones | 2 – 3 % | Invitaciones, lugar cards, menús, seating |
| Transporte | 2 – 3 % | Coche nupcial, autobús invitados |
| Banquete de ensayo / post-boda | 2 – 3 % | Cena de ensayo, brunch del día siguiente |
| Imprevistos y extras | 3 – 5 % | Siempre reservar un colchón |

---

## Multiplicadores por país (ajuste de costes)

Los precios varían significativamente según el país. Usa estos multiplicadores sobre los costes base de España (1.0):

| País | Multiplicador | Referencia |
|---|---|---|
| España | 1.0 | Base |
| México | 0.55 | Destinos como Riviera Maya +30 % |
| Colombia | 0.45 | Ciudades como Bogotá, Medellín |
| Argentina | 0.40 | Variación alta por tipo de cambio |
| Chile | 0.65 | Santiago más caro que el resto |
| Perú | 0.50 | Lima vs provincias |
| Estados Unidos | 1.8 – 2.2 | NYC / LA más caros |
| Reino Unido | 1.7 | Londres +40 % |
| Francia | 1.5 | París +35 % |
| Italia | 1.3 | Toscana / Amalfi como destino premium |
| Alemania | 1.4 | |
| Portugal | 0.85 | Lisboa / Oporto similares a España |
| Grecia | 1.1 | Santorini/Mykonos hasta x2 |
| Turquía | 0.70 | |
| Emiratos Árabes | 2.0 | Dubai bodas de lujo |
| Australia | 1.9 | |

---

## Partidas habituales por categoría

### Venue / Finca
- Alquiler del espacio (ceremonia civil / religiosa)
- Uso de instalaciones (jardines, salón, suite nupcial)
- Seguro de responsabilidad civil del evento
- Tasas y licencias municipales

### Catering
- Menú cena (por comensal)
- Cóctel de bienvenida
- Barra libre noche (vinos, licores, refrescos)
- Tarta nupcial
- Menú infantil / menú de alergias
- Personal de servicio

### Fotografía y vídeo
- Fotógrafo principal (día completo)
- Segundo fotógrafo
- Videógrafo + edición
- Álbum de boda impreso
- Sesión preboda (engagement)

### Música y entretenimiento
- DJ con equipo de sonido e iluminación
- Grupos de música en directo (cuarteto cóctel, orquesta cena)
- Photobox / cabina de fotos
- Animación infantil (si aplica)

### Flores y decoración
- Ramo de novia
- Boutonnière y ramos de las damas
- Centros de mesa (altos y bajos)
- Arco / altar floral
- Decoración de sillas y pasillo
- Pétalos y confeti biodegradable

### Vestuario y belleza
- Vestido / traje de la novia
- Traje del novio
- Vestidos de las damas
- Complementos (velo, tocado, corona)
- Maquillaje y peluquería nupcial
- Manicura nupcial
- Arras y alianzas

### Papelería e invitaciones
- Invitaciones (diseño + impresión)
- Tarjetas RSVP y sobre
- Seating plan / plano de mesas
- Menús de mesa
- Letrero de bienvenida
- Tarjetas de agradecimiento post-boda

### Transporte
- Coche de los novios (alquiler)
- Autobús para invitados (ida y vuelta)
- Transfer desde aeropuerto (invitados destino)

---

## Lógica de generación por presupuesto total

Cuando el organizador indica el presupuesto total, aplicar esta lógica:

1. **Calcular importe de cada categoría**: `presupuesto_total × porcentaje_categoría`
2. **Ajustar por país**: si se conoce el país del evento, aplicar el multiplicador como referencia orientativa (no modificar la suma total, sino los costes unitarios estimados)
3. **Número de invitados**: las categorías de catering y transporte escalan directamente con los invitados; fotografía y música son costes fijos con ligero incremento
4. **Notas al planner**: incluir siempre un 3-5 % de imprevistos

### Ejemplo: presupuesto 30.000 € / 100 invitados / España
| Categoría | % | Importe |
|---|---|---|
| Venue | 22 % | 6.600 € |
| Catering | 28 % | 8.400 € |
| Fotografía y vídeo | 11 % | 3.300 € |
| Música | 7 % | 2.100 € |
| Flores y decoración | 9 % | 2.700 € |
| Vestuario y belleza | 9 % | 2.700 € |
| Papelería | 2 % | 600 € |
| Transporte | 3 % | 900 € |
| Imprevistos | 4 % | 1.200 € |
| Banquete / extras | 5 % | 1.500 € |
| **Total** | **100 %** | **30.000 €** |
