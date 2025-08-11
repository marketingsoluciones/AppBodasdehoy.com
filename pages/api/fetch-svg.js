export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({
      error: 'URL parameter is required',
      example: '/api/fetch-svg?url=https://example.com/icon.svg'
    });
  }
  try {
    // Validar que sea una URL válida
    const urlObj = new URL(url);

    // Lista de dominios permitidos (opcional, por seguridad)
    const allowedDomains = [
      'raw.githubusercontent.com',
      'cdn.jsdelivr.net',
      'heroicons.com',
      'feathericons.com',
      'simpleicons.org',
      'tabler-icons.io'
    ];
    // Verificar si el dominio está permitido (opcional)
    if (!allowedDomains.includes(urlObj.hostname)) {
      console.warn(`Dominio no permitido: ${urlObj.hostname}`);
      // Puedes comentar esta línea si quieres permitir cualquier dominio
      // return res.status(403).json({ error: 'Domain not allowed' });
    }
    console.log(`🔄 Descargando SVG desde: ${url}`);
    // Hacer la petición al servidor externo
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SVG-Fetcher/1.0)',
        'Accept': 'image/svg+xml, text/plain, */*'
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const content = await response.text();
    // Verificar que sea un SVG válido
    if (!content.includes('<svg')) {
      throw new Error('El contenido no parece ser un SVG válido');
    }
    // Verificar tamaño (10KB máximo)
    if (content.length > 10 * 1024) {
      throw new Error(`SVG demasiado grande. Tamaño máximo: 10KB. Tamaño del archivo: ${(content.length / 1024).toFixed(1)}KB`);
    }
    // Optimizar SVG (opcional)
    const optimizedContent = optimizeSvg(content);
    console.log(`✅ SVG descargado exitosamente: ${(content.length / 1024).toFixed(1)}KB`);
    // Devolver el SVG con headers apropiados
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Opción 1: Devolver como SVG directo
    console.log("aqui");
    res.status(200).send(optimizedContent);
    // Opción 2: Devolver como JSON (si prefieres)
    // res.status(200).json({
    //   success: true,
    //   content: optimizedContent,
    //   size: content.length,
    //   originalUrl: url,
    //   optimized: content.length !== optimizedContent.length
    // });
  } catch (error) {
    console.error('❌ Error descargando SVG:', error);
    res.status(500).json({
      error: 'Failed to fetch SVG',
      message: error.message,
      url: url
    });
  }
}

/**
 * Optimiza el contenido SVG
 */
function optimizeSvg(content) {
  let optimized = content;

  // Remover comentarios
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');

  // Remover espacios en blanco innecesarios
  optimized = optimized.replace(/\s+/g, ' ');

  // Remover espacios al inicio y final
  optimized = optimized.trim();

  return optimized;
} 