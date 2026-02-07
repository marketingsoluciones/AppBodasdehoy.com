import { Plus, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const DepositFormSection = ({ onDepositSubmit, buttonText = "Registrar Nuevo Depósito de la Novia" }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoDeposito, setNuevoDeposito] = useState('');

  const handleNuevoDeposito = () => {
    if (nuevoDeposito && !isNaN(nuevoDeposito)) {
      onDepositSubmit(parseFloat(nuevoDeposito));
      setNuevoDeposito('');
      setMostrarFormulario(false);
    }
  };

  return (
    <div className="mb-6">
      {!mostrarFormulario ? (
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-base"
        >
          <Plus className="w-4 h-4" />
          {buttonText}
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Monto del depósito</label>
            <input
              type="number"
              value={nuevoDeposito}
              onChange={(e) => setNuevoDeposito(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNuevoDeposito}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Confirmar Depósito
            </button>
            <button
              onClick={() => {
                setMostrarFormulario(false);
                setNuevoDeposito('');
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositFormSection;