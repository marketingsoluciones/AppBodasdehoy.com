/**
 * Servicio para generar visualizaciones de venue vía api-ia.
 * El backend expone POST /api/venue/generate-design.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-ia.bodasdehoy.com';

interface GenerateVenueDesignParams {
  imageUrl?: string;
  prompt?: string;
  roomType: string;
  style: string;
}

interface GenerateVenueDesignResult {
  error?: string;
  provider?: string;
  url?: string;
}

export async function generateVenueDesign(
  params: GenerateVenueDesignParams,
): Promise<GenerateVenueDesignResult> {
  try {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('jwt_token') || ''
      : '';

    const response = await fetch(`${BACKEND_URL}/api/venue/generate-design`, {
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      method: 'POST',
    });

    if (!response.ok) {
      return { error: `Error ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return {
      provider: data.provider,
      url: data.url || data.image_url,
    };
  } catch (error: any) {
    return { error: error.message || 'Error generando diseño de venue' };
  }
}
