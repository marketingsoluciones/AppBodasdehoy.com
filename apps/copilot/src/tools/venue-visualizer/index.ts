import { BuiltinToolManifest } from '@lobechat/types';

export const VenueVisualizerManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Transforma la foto de un salón o espacio de boda aplicando un estilo de decoración con IA. Genera una visualización fotorrealista de cómo quedaría el espacio con la decoración elegida.',
      name: 'visualize_venue',
      parameters: {
        properties: {
          imageUrl: {
            description:
              'URL de la foto del salón o espacio subida por el usuario. Si el usuario no ha subido ninguna foto, pídela antes de llamar a esta herramienta.',
            type: 'string',
          },
          prompt: {
            description:
              'Descripción adicional en inglés de detalles específicos que el usuario quiere en la decoración. Por ejemplo: "with fairy lights, long tables for 150 guests, floral centerpieces".',
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
2. Pregunta qué estilo le gusta si no lo ha indicado: romántico, rústico-boho, minimalista, glamour, jardín floral, industrial, mediterráneo o tropical.
3. Pregunta el tipo de espacio: salón de banquetes, jardín, terraza, iglesia, restaurante, finca o rooftop.
4. Una vez tengas foto + estilo + tipo de espacio, llama a visualize_venue.
5. Después de generar, ofrece variaciones en otros estilos o ajustes.

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
