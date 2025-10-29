interface ConnectedViewProps {
  onRefresh: () => void;
  onDisconnect: () => void;
  loading: boolean;
}

export function ConnectedView({ onRefresh, onDisconnect, loading }: ConnectedViewProps) {
  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <svg
          className="w-20 h-20 mx-auto text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="font-display text-xl font-semibold text-gray-800 mb-2">
        ¡WhatsApp Conectado!
      </h3>
      <p className="font-body text-sm text-gray-600 mb-6">
        Ya puedes enviar invitaciones por WhatsApp
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="font-display px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Actualizar estado
        </button>
        <button
          onClick={onDisconnect}
          disabled={loading}
          className="font-display px-4 py-2 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          Desconectar
        </button>
      </div>
    </div>
  );
}

