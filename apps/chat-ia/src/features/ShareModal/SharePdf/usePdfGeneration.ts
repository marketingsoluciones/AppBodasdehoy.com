import { useCallback, useState } from 'react';

import { exportPdf } from '@/services/apiIa/pdf';

interface PdfGenerationParams {
  content: string;
  sessionId: string;
  title: string;
  topicId?: string;
}

interface PdfGenerationState {
  downloadPdf: () => Promise<void>;
  error: string | null;
  generatePdf: (params: PdfGenerationParams) => Promise<void>;
  loading: boolean;
  pdfData: string | null;
}

export const usePdfGeneration = (): PdfGenerationState => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('chat-export.pdf');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [lastGeneratedKey, setLastGeneratedKey] = useState<string | null>(null);

  const generatePdf = useCallback(async (params: PdfGenerationParams) => {
    const { content, sessionId, title, topicId } = params;
    const requestKey = `${sessionId}-${topicId || 'default'}-${content.length}`;

    if (isPending || lastGeneratedKey === requestKey) return;

    try {
      setError(null);
      setPdfData(null);
      setIsPending(true);

      const result = await exportPdf({ content, sessionId, title, topicId });

      setPdfData(result.pdf);
      setFilename(result.filename);
      setLastGeneratedKey(requestKey);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      setError(e instanceof Error ? e.message : 'Failed to generate PDF');
    } finally {
      setIsPending(false);
    }
  }, [isPending, lastGeneratedKey]);

  const downloadPdf = useCallback(async () => {
    if (!pdfData) return;

    try {
      // Convert base64 to blob
      const byteCharacters = atob(pdfData);
      const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) =>
        byteCharacters.charCodeAt(i)
      );
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  }, [pdfData, filename]);

  return {
    downloadPdf,
    error,
    generatePdf,
    loading: isPending,
    pdfData,
  };
};