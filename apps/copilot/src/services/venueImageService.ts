import { VenueRoomType, VenueStyle } from '@/types/tool/venueVisualizer';

// Same pattern as image.ts — backend Python URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// Detailed English prompts for each wedding decoration style
const STYLE_PROMPTS: Record<VenueStyle, string> = {
  'glamour':
    'ultra-glamorous wedding reception with gold chandeliers, crystal decorations, white and gold color scheme, luxury floral centerpieces with white roses and orchids, candlelight, elegant drapery, opulent table settings with fine china',
  'industrial':
    'industrial chic wedding venue with exposed brick walls, Edison bulb string lights, metal pipe decorations, wooden tables, geometric terrariums, greenery, warm amber lighting, urban loft aesthetic',
  'jardin-floral':
    'enchanted garden wedding with lush colorful flower arches, abundant floral arrangements in pink and white and purple, climbing roses, garden party atmosphere, fairy lights, natural light, romantic outdoor ceremony',
  'mediterraneo':
    'Mediterranean wedding with blue and white color palette, terracotta pots with olive branches, ceramic tiles, whitewashed walls, bougainvillea flowers, rustic wooden elements, sea view atmosphere, coastal elegance',
  'minimalista':
    'minimalist modern wedding with clean lines, neutral color palette of white and beige and sage green, simple elegant floral arrangements with pampas grass, natural light, geometric accents, understated luxury',
  'romantico':
    'romantic classic wedding reception with white and blush pink flowers, soft candlelight, flowing white drapery, rose petals, vintage candelabras, lush floral arrangements with peonies and roses, dreamy soft lighting',
  'rustico-boho':
    'rustic boho wedding with macrame wall hangings, eucalyptus garlands, wooden farm tables, pampas grass arrangements, terracotta and earthy tones, vintage lanterns, wildflowers, candlelight, natural textures',
  'tropical':
    'tropical beach wedding with palm leaf decorations, vibrant tropical flowers in orange and pink and yellow, rattan furniture, bamboo accents, monstera leaves, ocean breeze atmosphere, colorful and festive',
};

const ROOM_CONTEXT: Record<VenueRoomType, string> = {
  'finca':           'rustic country estate venue',
  'iglesia':         'church or chapel wedding ceremony venue',
  'jardin':          'outdoor garden venue',
  'restaurante':     'restaurant venue',
  'rooftop':         'rooftop venue with city views',
  'salon-banquetes': 'ballroom banquet hall',
  'terraza':         'outdoor terrace venue',
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

// Same localStorage pattern as image.ts
function getDevUserConfig(): { development?: string; token?: string; userId?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('dev-user-config');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildPrompt(style: VenueStyle, roomType: VenueRoomType, extraPrompt?: string): string {
  const styleDesc = STYLE_PROMPTS[style] || 'beautifully decorated wedding venue';
  const roomDesc = ROOM_CONTEXT[roomType] || 'wedding venue';
  const extra = extraPrompt ? `, ${extraPrompt}` : '';
  return `Professional interior design photo of a ${roomDesc} decorated in ${styleDesc}${extra}. Photorealistic, high quality, wedding photography style, well-lit, detailed`;
}

async function generateViaBackend(params: GenerateVenueParams): Promise<GenerateVenueResult> {
  const userConfig = getDevUserConfig();
  const prompt = buildPrompt(params.style, params.roomType, params.prompt);

  // Use same body structure as image.ts createImageWithBackend
  const body: Record<string, unknown> = {
    development: userConfig?.development || 'bodasdehoy',
    prompt,
    requires_text: false,
    size: '1024x1024',
    token: userConfig?.token,
    use_case: 'decoration',
    user_id: userConfig?.userId || 'anonymous',
  };

  // If original image exists, include for image-to-image
  if (params.imageUrl) {
    body['image_url'] = params.imageUrl;
    body['strength'] = 0.75;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(userConfig?.token && { Authorization: `Bearer ${userConfig.token}` }),
    ...(userConfig?.userId && { 'X-User-ID': userConfig.userId }),
    ...(userConfig?.development && { 'X-Development': userConfig.development }),
  };

  // Use the same endpoint pattern as image.ts: /webapi/text-to-image/auto
  const res = await fetch(`${BACKEND_URL}/webapi/text-to-image/auto`, {
    body: JSON.stringify(body),
    headers,
    method: 'POST',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  const data = await res.json();

  // Handle same response formats as image.ts
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

  if (!url) throw new Error('No image URL in backend response');

  return { provider: data?.provider || images[0]?.provider || 'auto', url };
}

async function generateViaFal(params: GenerateVenueParams): Promise<GenerateVenueResult> {
  const userConfig = getDevUserConfig();
  const prompt = buildPrompt(params.style, params.roomType, params.prompt);

  const model = params.imageUrl
    ? 'fal-ai/flux/dev/image-to-image'
    : 'fal-ai/flux-2-lora/apartment-staging';

  const body: Record<string, unknown> = {
    development: userConfig?.development || 'bodasdehoy',
    model,
    
prompt,
    
// Tell backend to use fal provider
provider: 'fal',
    
requires_text: false,
    
size: '1024x1024',
    
token: userConfig?.token,
    
    use_case: 'decoration',
    user_id: userConfig?.userId || 'anonymous',
    ...(params.imageUrl && { image_url: params.imageUrl }),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(userConfig?.token && { Authorization: `Bearer ${userConfig.token}` }),
    ...(userConfig?.userId && { 'X-User-ID': userConfig.userId }),
    ...(userConfig?.development && { 'X-Development': userConfig.development }),
  };

  const res = await fetch(`${BACKEND_URL}/webapi/text-to-image/fal`, {
    body: JSON.stringify(body),
    headers,
    method: 'POST',
  });

  if (!res.ok) throw new Error(`FAL.ai error: ${res.status}`);
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

  if (!url) throw new Error('No image URL in FAL response');

  return { provider: 'fal-ai', url };
}

async function generateViaReplicate(params: GenerateVenueParams): Promise<GenerateVenueResult> {
  const userConfig = getDevUserConfig();
  const prompt = buildPrompt(params.style, params.roomType, params.prompt);

  const body: Record<string, unknown> = {
    development: userConfig?.development || 'bodasdehoy',
    model: 'adirik/interior-design',
    
prompt,
    
// Tell backend to use replicate provider
provider: 'replicate',
    
requires_text: false,
    
size: '1024x1024',
    
token: userConfig?.token,
    
    use_case: 'decoration',
    user_id: userConfig?.userId || 'anonymous',
    ...(params.imageUrl && { image_url: params.imageUrl }),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(userConfig?.token && { Authorization: `Bearer ${userConfig.token}` }),
    ...(userConfig?.userId && { 'X-User-ID': userConfig.userId }),
    ...(userConfig?.development && { 'X-Development': userConfig.development }),
  };

  const res = await fetch(`${BACKEND_URL}/webapi/text-to-image/replicate`, {
    body: JSON.stringify(body),
    headers,
    method: 'POST',
  });

  if (!res.ok) throw new Error(`Replicate error: ${res.status}`);
  const data = await res.json();

  let url: string | undefined;
  const images = data?.images || [];
  if (images.length > 0) {
    const img = images[0];
    if (img.url) url = img.url;
  } else if (data?.url) {
    url = data.url;
  } else if (Array.isArray(data) && data[0]) {
    url = typeof data[0] === 'string' ? data[0] : data[0].url;
  }

  if (!url) throw new Error('No image URL in Replicate response');

  return { provider: 'replicate', url };
}

/**
 * Generates a venue visualization with the chosen decoration style.
 * Tries in order: Backend Python (auto-routing) → FAL.ai → Replicate
 */
export async function generateVenueDesign(
  params: GenerateVenueParams,
): Promise<GenerateVenueResult> {
  // 1. Backend Python auto-routing (ComfyUI, DALL-E, Replicate, etc.)
  try {
    return await generateViaBackend(params);
  } catch {
    // silently fall through
  }

  // 2. FAL.ai direct via backend
  try {
    return await generateViaFal(params);
  } catch {
    // silently fall through
  }

  // 3. Replicate via backend (adirik/interior-design, specialized for interiors)
  try {
    return await generateViaReplicate(params);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return { error: `No se pudo generar la imagen: ${msg}` };
  }
}
