import { createHeaderWithAuth } from '@/services/_auth';
import { VenueRoomType, VenueStyle } from '@/types/tool/venueVisualizer';

import { API_ENDPOINTS } from './_url';

// Detailed English prompts for each wedding decoration style
const STYLE_PROMPTS: Record<VenueStyle, string> = {
  glamour:
    'ultra-glamorous wedding reception with gold chandeliers, crystal decorations, white and gold color scheme, luxury floral centerpieces with white roses and orchids, candlelight, elegant drapery, opulent table settings with fine china',
  industrial:
    'industrial chic wedding venue with exposed brick walls, Edison bulb string lights, metal pipe decorations, wooden tables, geometric terrariums, greenery, warm amber lighting, urban loft aesthetic',
  'jardin-floral':
    'enchanted garden wedding with lush colorful flower arches, abundant floral arrangements in pink and white and purple, climbing roses, garden party atmosphere, fairy lights, natural light, romantic outdoor ceremony',
  mediterraneo:
    'Mediterranean wedding with blue and white color palette, terracotta pots with olive branches, ceramic tiles, whitewashed walls, bougainvillea flowers, rustic wooden elements, sea view atmosphere, coastal elegance',
  minimalista:
    'minimalist modern wedding with clean lines, neutral color palette of white and beige and sage green, simple elegant floral arrangements with pampas grass, natural light, geometric accents, understated luxury',
  romantico:
    'romantic classic wedding reception with white and blush pink flowers, soft candlelight, flowing white drapery, rose petals, vintage candelabras, lush floral arrangements with peonies and roses, dreamy soft lighting',
  'rustico-boho':
    'rustic boho wedding with macrame wall hangings, eucalyptus garlands, wooden farm tables, pampas grass arrangements, terracotta and earthy tones, vintage lanterns, wildflowers, candlelight, natural textures',
  tropical:
    'tropical beach wedding with palm leaf decorations, vibrant tropical flowers in orange and pink and yellow, rattan furniture, bamboo accents, monstera leaves, ocean breeze atmosphere, colorful and festive',
};

const ROOM_CONTEXT: Record<VenueRoomType, string> = {
  finca: 'rustic country estate venue',
  iglesia: 'church or chapel wedding ceremony venue',
  jardin: 'outdoor garden venue',
  restaurante: 'restaurant venue',
  rooftop: 'rooftop venue with city views',
  'salon-banquetes': 'ballroom banquet hall',
  terraza: 'outdoor terrace venue',
};

export interface GenerateVenueParams {
  imageUrl?: string;
  prompt?: string;
  roomType: VenueRoomType;
  style: VenueStyle;
}

export interface GenerateVenueResult {
  error?: string;
  provider?: string;
  url?: string;
}

function buildPrompt(style: VenueStyle, roomType: VenueRoomType, extraPrompt?: string): string {
  const styleDesc = STYLE_PROMPTS[style] || 'beautifully decorated wedding venue';
  const roomDesc = ROOM_CONTEXT[roomType] || 'wedding venue';
  const extra = extraPrompt ? `, ${extraPrompt}` : '';
  return `Professional interior design photo of a ${roomDesc} decorated in ${styleDesc}${extra}. Photorealistic, high quality, wedding photography style, well-lit, detailed`;
}

/**
 * Generates a venue visualization with the chosen decoration style.
 * The api-ia backend handles model routing internally.
 */
export async function generateVenueDesign(
  params: GenerateVenueParams,
): Promise<GenerateVenueResult> {
  const prompt = buildPrompt(params.style, params.roomType, params.prompt);

  const body: Record<string, unknown> = {
    prompt,
    requires_text: false,
    size: '1024x1024',
    use_case: 'decoration',
    ...(params.imageUrl && { image_url: params.imageUrl, strength: 0.75 }),
  };

  try {
    const headers = await createHeaderWithAuth({
      headers: { 'Content-Type': 'application/json' },
      provider: 'auto' as any,
    });

    const res = await fetch(API_ENDPOINTS.images('auto'), {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend error ${res.status}: ${text}`);
    }

    const data = await res.json();

    let url: string | undefined;
    const images = data?.images || [];
    if (images.length > 0) {
      const img = images[0];
      if (img.url) url = img.url;
      else if (img.b64_json) url = `data:image/png;base64,${img.b64_json}`;
      else if (img.base64) url = `data:image/png;base64,${img.base64}`;
    } else if (data?.url) {
      url = data.url;
    }

    if (!url) throw new Error('No image URL in response');

    return { provider: data?.provider || images[0]?.provider || 'auto', url };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return { error: `No se pudo generar la imagen: ${msg}` };
  }
}
