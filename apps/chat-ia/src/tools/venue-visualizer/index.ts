import { BuiltinToolManifest } from '@lobechat/types';

export const VenueVisualizerManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Transforma la foto de un salón o espacio de boda aplicando uno o varios estilos de decoración con IA. Genera visualizaciones fotorrealistas en paralelo. Puedes pedir hasta 4 variaciones a la vez pasando múltiples ítems en el array.',
      name: 'visualize_venue',
      parameters: {
        properties: {
          items: {
            description:
              'Lista de visualizaciones a generar. Incluye de 1 a 4 ítems para generar múltiples estilos en paralelo. Cada ítem tiene su propio estilo y tipo de espacio.',
            items: {
              properties: {
                imageUrl: {
                  description:
                    'URL de la foto del salón o espacio subida por el usuario. Si el usuario no ha subido ninguna foto, omite este campo.',
                  type: 'string',
                },
                prompt: {
                  description:
                    'Descripción adicional en inglés de detalles específicos que el usuario quiere. Por ejemplo: "with fairy lights, long tables for 150 guests".',
                  type: 'string',
                },
                roomType: {
                  description: 'Tipo de espacio o venue.',
                  enum: [
                    'salon-banquetes',
                    'jardin',
                    'terraza',
                    'iglesia',
                    'restaurante',
                    'finca',
                    'rooftop',
                  ],
                  type: 'string',
                },
                style: {
                  description: 'Estilo de decoración a aplicar en el espacio.',
                  enum: [
                    'romantico',
                    'rustico-boho',
                    'minimalista',
                    'glamour',
                    'jardin-floral',
                    'industrial',
                    'mediterraneo',
                    'tropical',
                  ],
                  type: 'string',
                },
              },
              required: ['style', 'roomType'],
              type: 'object',
            },
            maxItems: 4,
            minItems: 1,
            type: 'array',
          },
        },
        required: ['items'],
        type: 'object',
      },
    },
  ],
  identifier: 'lobe-venue-visualizer',
  meta: {
    avatar: '🏛️',
    title: 'Diseño de Espacios',
  },
  systemRole: `Eres un asistente experto en diseño de espacios para bodas y eventos. Cuando el usuario quiera visualizar cómo quedaría su salón o espacio con cierta decoración, usa la herramienta lobe-venue-visualizer.

Usa esta herramienta cuando el usuario mencione:
- "cómo quedaría mi salón", "visualizar la decoración", "ver el espacio decorado"
- "diseño del venue", "decorar el salón", "estilo para mi boda"
- "cómo se vería con estilo romántico/rústico/etc."
- Cualquier petición de visualizar o imaginar un espacio de boda decorado

Flujo recomendado:
1. Si el usuario no ha subido foto del espacio, pídela con amabilidad: "Para visualizar tu espacio, ¿puedes subir una foto del salón o venue?"
2. Si el usuario no especifica estilo, genera 4 variaciones con los estilos más populares: romántico, rústico-boho, glamour y jardín floral.
3. Si el usuario especifica un estilo concreto, genera solo ese estilo (1 ítem en el array).
4. Si el usuario pide "muéstrame varias opciones" o "quiero ver diferentes estilos", genera hasta 4 variaciones simultáneas.
5. Pregunta el tipo de espacio si no lo has identificado del contexto.
6. Llama a visualize_venue con el array de ítems — se generan en paralelo automáticamente.
7. Después de generar, ofrece ajustes o variaciones adicionales.

IMPORTANTE: La herramienta acepta un array "items" con 1 a 4 visualizaciones. Aprovecha esto para generar múltiples estilos en paralelo cuando el usuario quiera ver opciones.

Estilos disponibles y qué significan:
- romantico: flores blancas, velas, drapeados, tonos rosa y marfil, muy romántico
- rustico-boho: madera, macramé, eucalipto, tonos tierra, boho chic
- minimalista: líneas limpias, colores neutros, luz natural, elegancia sin excesos
- glamour: dorado, cristal, lámparas de araña, lujo y sofisticación
- jardin-floral: flores coloridas, arcos vegetales, verde exuberante, jardín de ensueño
- industrial: ladrillo visto, metal, bombillas Edison, estilo urbano chic
- mediterraneo: azul y blanco, cerámica, olivos, ambiente mediterráneo
- tropical: palmeras, colores vibrantes, rattan, ambiente de playa`,
  type: 'builtin',
};
