import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { url, format } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL es requerida' });
  }
  try {
    const response = await fetch("https://api-convert.bodasdehoy.com/url-to-pdf", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Generator/1.0)'
      },
      body: JSON.stringify({
        url,
        format
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    res.json({ base64 });
  } catch (error) {
    console.error('Error en generate-pdf:', error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}