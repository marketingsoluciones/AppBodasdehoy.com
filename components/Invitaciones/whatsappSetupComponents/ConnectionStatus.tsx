import type { WhatsAppSession } from './types';

interface ConnectionStatusProps {
  session: WhatsAppSession;
}

export function ConnectionStatus({ session }: ConnectionStatusProps) {
  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-md border-[1px] border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-medium text-gray-700">
            Estado de conexión
          </p>
          <div className="flex items-center mt-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${session?.isConnected ? 'bg-emerald-500' : 'bg-gray-400'
              }`} />
            <span className={`font-body text-xs font-semibold ${session?.isConnected ? 'text-emerald-600' : 'text-gray-500'
              }`}>
              {session?.isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {session?.phoneNumber && (
            <p className="font-body text-xs text-gray-600 mt-1">
              Número: {session?.phoneNumber}
            </p>
          )}
        </div>
        {session?.isConnected && session?.connectionTime && (
          <div className="text-right">
            <p className="font-body text-[11px] text-gray-500">Conectado desde:</p>
            <p className="font-body text-xs text-gray-700">
              {new Date(session?.connectionTime).toLocaleString('es-ES')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

