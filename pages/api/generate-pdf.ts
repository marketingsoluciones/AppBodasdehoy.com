import { NextApiRequest, NextApiResponse } from 'next';
import { generatePdf } from './services/pdfGenerator';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { html } = req.body;
  try {
    const response = await axios.post(
      "https://api-convert.bodasdehoy.com/html-to-pdf",
      { html },
      { responseType: "arraybuffer" }
    );
    const base64 = btoa(
      new Uint8Array(response.data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    res.json({ base64 });
  } catch (error) {
    res.status(500).json({ error: "Error generando PDF" });
  }
}