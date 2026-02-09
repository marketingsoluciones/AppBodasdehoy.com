import OpenAI from 'openai';

/**
 * Creates an OpenAI client instance for business operations (STT/TTS)
 * @param req - The incoming request
 * @returns OpenAI instance or Response with error
 */
export const createBizOpenAI = (req: Request): OpenAI | Response => {
  // Get API key from environment or request headers
  const apiKey = process.env.OPENAI_API_KEY || req.headers.get('x-openai-api-key');

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable or provide x-openai-api-key header.',
      }),
      {
        headers: { 'content-type': 'application/json' },
        status: 401,
      },
    );
  }

  // Get optional base URL from environment or headers
  const baseURL = process.env.OPENAI_BASE_URL || req.headers.get('x-openai-base-url') || undefined;

  return new OpenAI({
    apiKey,
    baseURL,
  });
};
