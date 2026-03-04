import { LoadingSpinner } from './LoadingSpinner';

interface PhoneNumberFormProps {
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
}


export function PhoneNumberForm({ phoneNumber, onPhoneNumberChange, onSubmit, loading, disabled }: PhoneNumberFormProps) {

  return (
    <div className="w-full md:px-10 space-y-14">
      <div>
        <label className="font-display block text-sm font-medium text-gray-700 mb-2">
          Número de teléfono (opcional)
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          placeholder="+34 123 456 789"
          disabled={loading}
          className="font-display w-full px-4 py-2 text-xs text-gray-500 border-[1px] border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
        <p className="font-body text-[11px] text-gray-500 mt-1">
          El número es opcional, solo para referencia
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading || disabled}
        className="font-display w-full py-3 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-md hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <LoadingSpinner />
            Creando sesión...
          </span>
        ) : (
          'Conectar WhatsApp'
        )}
      </button>
    </div>
  );
}

