import { LoadingSpinner } from './LoadingSpinner';
import Image from 'next/image';

interface QRCodeDisplayProps {
  qrCode: string;
  checkingConnection: boolean;
  onRegenerateQR: () => void;
  loading: boolean;
}

export function QRCodeDisplay({ qrCode, checkingConnection, onRegenerateQR, loading }: QRCodeDisplayProps) {
  return (
    <div className="flex w-full h-full justify-center items-center">
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold text-gray-800">
          Escanea el código QR
        </h3>
        <p className="font-body text-sm text-gray-600 mb-2">
          Abre WhatsApp en tu teléfono y escanea este código QR
        </p>

        <div className="bg-white p-4 rounded-md inline-block border-[1px] border-gray-200 mb-2">
          <Image
            src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`}
            alt="Código QR de WhatsApp"
            width={256}
            height={256}
            className="w-64 h-64"
            unoptimized
          />
        </div>

        {checkingConnection && (
          <div className="mb-4">
            <div className="flex items-center justify-center text-emerald-600">
              <LoadingSpinner />
              <span className="font-body text-xs">Esperando conexión...</span>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-6">
          <p className="font-body text-[11px] text-gray-500 font-medium">
            Pasos:
          </p>
          <ol className="font-body text-left text-xs text-gray-600 space-y-1 max-w-md mx-auto">
            <li>1. Abre WhatsApp en tu teléfono</li>
            <li>2. Ve a Menú → Dispositivos vinculados</li>
            <li>3. Toca &ldquo;Vincular un dispositivo&rdquo;</li>
            <li>4. Escanea este código QR</li>
          </ol>
        </div>

        <button
          onClick={onRegenerateQR}
          disabled={loading}
          className="font-display px-6 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Regenerando...' : 'Regenerar código QR'}
        </button>
      </div>
    </div>
  );
}

