import { NextApiRequest, NextApiResponse } from 'next';
import { generatePdf } from './services/pdfGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { html, filename, format } = req.body;
  try {
    const pdfBuffer = await generatePdf({ html, filename, format });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
}