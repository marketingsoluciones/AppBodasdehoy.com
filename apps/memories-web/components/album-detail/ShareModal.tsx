import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useMemoriesStore } from '@bodasdehoy/memories';

export default function ShareModal({ albumId, onClose }: { albumId: string; onClose: () => void }) {
  const { generateShareLink } = useMemoriesStore();
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const loadShareLink = () => {
    setLoading(true);
    setShareError(false);
    generateShareLink(albumId, 30)
      .then((result) => {
        if (result?.shareUrl) setShareUrl(result.shareUrl);
        else setShareError(true);
      })
      .catch(() => setShareError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadShareLink(); }, [albumId]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl)}&size=200x200&margin=10`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div data-testid="share-modal" className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Compartir álbum</h2>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400 animate-pulse">Generando enlace…</div>
        ) : shareError ? (
          <div data-testid="share-error" className="h-48 flex flex-col items-center justify-center gap-3">
            <p className="text-red-500 text-sm font-medium">No se pudo generar el enlace</p>
            <p className="text-gray-400 text-xs">Comprueba tu conexión e inténtalo de nuevo.</p>
            <button
              onClick={loadShareLink}
              className="text-xs text-rose-500 underline hover:text-rose-600 py-2 px-3"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {qrUrl && !qrFailed && (
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                  <Image
                    src={qrUrl}
                    alt="QR del álbum"
                    width={160}
                    height={160}
                    unoptimized
                    onError={() => setQrFailed(true)}
                  />
                </div>
              </div>
            )}
            {qrFailed && (
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs text-gray-400 text-center">
                  QR no disponible.<br />Usa el enlace de abajo.
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <input
                readOnly
                data-testid="share-link"
                value={shareUrl}
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 truncate"
              />
              <button
                onClick={copyToClipboard}
                className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-600 transition flex-shrink-0"
              >
                {copied ? '✓' : 'Copiar'}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Comparte este enlace o código QR con tus invitados para que puedan ver y subir fotos sin registro.
            </p>
          </>
        )}

        <button onClick={onClose} className="mt-6 text-sm text-gray-400 hover:text-gray-700 transition py-2 px-4 rounded-xl min-h-[44px] w-full">Cerrar</button>
      </div>
    </div>
  );
}
