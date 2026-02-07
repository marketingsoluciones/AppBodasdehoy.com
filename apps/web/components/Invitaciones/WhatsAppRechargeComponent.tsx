import { useState, useEffect } from 'react';
import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import { fetchApiBodas, queries } from '../../utils/Fetching';
import { FaWhatsapp, FaCreditCard, FaHistory } from 'react-icons/fa';
import ModalDefault from './ModalDefault';
import { LoadingSpinner } from '../Utils/LoadingSpinner';

interface RechargePackage {
  id: string;
  messages: number;
  price: number;
  description: string;
}

interface RechargeHistory {
  id: string;
  package: RechargePackage;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
}

interface props {
  setShowModalRecharge: (show: boolean) => void;
  currentMessages: number;
  onRechargeSuccess?: (newMessages: number) => void;
}

const MESSAGE_PACKAGES: RechargePackage[] = [
  { id: '100', messages: 100, price: 4, description: '100 Mensajes' },
  { id: '300', messages: 300, price: 12, description: '300 Mensajes' },
  { id: '500', messages: 500, price: 20, description: '500 Mensajes' },
  { id: '1000', messages: 1000, price: 40, description: '1000 Mensajes' }
];

export function WhatsAppRechargeComponent({ setShowModalRecharge, currentMessages, onRechargeSuccess }: props) {
  const { user, config } = AuthContextProvider();
  const { event } = EventContextProvider();
  const [loadingSpinner, setLoadingSpinner] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string>('500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rechargeHistory, setRechargeHistory] = useState<RechargeHistory[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingSpinner(false);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Simular historial de recargas (en producción vendría de la API)
  useEffect(() => {
    const mockHistory: RechargeHistory[] = [
      {
        id: '1',
        package: MESSAGE_PACKAGES[2], // 500 mensajes
        date: '2024-01-15',
        status: 'completed',
        amount: 20
      },
      {
        id: '2',
        package: MESSAGE_PACKAGES[1], // 300 mensajes
        date: '2024-01-10',
        status: 'completed',
        amount: 12
      }
    ];
    setRechargeHistory(mockHistory);
  }, []);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      setError('Por favor selecciona un paquete de mensajes');
      return;
    }

    const selectedPkg = MESSAGE_PACKAGES.find(pkg => pkg.id === selectedPackage);
    if (!selectedPkg) {
      setError('Paquete seleccionado no válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Aquí iría la lógica real de pago
      // Por ahora simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular éxito del pago
      const newTotalMessages = currentMessages + selectedPkg.messages;

      // Agregar a historial
      const newRecharge: RechargeHistory = {
        id: Date.now().toString(),
        package: selectedPkg,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        amount: selectedPkg.price
      };

      setRechargeHistory(prev => [newRecharge, ...prev]);

      // Notificar éxito
      if (onRechargeSuccess) {
        onRechargeSuccess(newTotalMessages);
      }

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        setShowModalRecharge(false);
      }, 1500);

    } catch (err) {
      console.error('Error al procesar pago:', err);
      setError('Error al procesar el pago. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = MESSAGE_PACKAGES.find(pkg => pkg.id === selectedPackage);

  return (
    <ModalDefault onClose={() => setShowModalRecharge(false)}>
      <div className='w-full h-full flex flex-col rounded-lg space-y-2 relative'>
        <LoadingSpinner loading={loadingSpinner} />

        {/* Ícono de fondo con opacidad */}
        <div className="w-full h-full flex items-center justify-center absolute inset-0 opacity-10 pointer-events-none z-0">
          <FaWhatsapp className="w-80 h-80 text-emerald-500 -rotate-12" />
        </div>

        {/* Header */}
        <div className='flex gap-2 items-center w-full h-12 px-4 py-2 border-b-[1px] bg-white rounded-t-lg z-10'>
          <FaWhatsapp className="w-6 h-6 text-emerald-500" />
          <h2 className="font-display text-lg font-semibold text-gray-800">
            Módulo de compra
          </h2>
        </div>

        {/* Contenido principal */}
        {!loadingSpinner && (
          <div className="w-full flex-1 flex flex-col rounded-b-lg border-[1px] border-t-0 bg-white overflow-hidden z-10">
            <div className="w-full flex-1 flex flex-col p-4 space-y-4">

              {/* Sección superior con botón de recarga y mensajes disponibles */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col space-y-2">
                  <button
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                    onClick={() => {/* Scroll to packages */ }}
                  >
                    Recarga tus mensajes aquí
                  </button>
                </div>

                {/* Mensajes disponibles */}
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-medium">Mensajes disponibles</p>
                  <p className="text-3xl font-bold text-emerald-600">{currentMessages}</p>
                </div>
              </div>

              {/* Paquetes de mensajes */}
              <div className="space-y-3">
                <h3 className="font-display text-sm font-semibold text-gray-700">
                  Selecciona tu paquete de mensajes:
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  {MESSAGE_PACKAGES.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedPackage === pkg.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="package"
                        value={pkg.id}
                        checked={selectedPackage === pkg.id}
                        onChange={() => handlePackageSelect(pkg.id)}
                        className="mr-3 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">
                          {pkg.description}
                        </span>
                        <span className="ml-2 text-emerald-600 font-semibold">
                          ${pkg.price}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botón de pago */}
              <div className="flex justify-center">
                <button
                  onClick={handlePayment}
                  disabled={loading || !selectedPackage}
                  className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${loading || !selectedPackage
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg hover:shadow-xl'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FaCreditCard className="w-4 h-4" />
                      <span>PAGAR</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Resumen de compra */}
              {selectedPkg && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Resumen de compra:</h4>
                  <div className="flex justify-between text-sm">
                    <span>{selectedPkg.description}</span>
                    <span className="font-semibold">${selectedPkg.price}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Mensajes actuales:</span>
                    <span>{currentMessages}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 font-semibold text-emerald-600">
                    <span>Total después de la compra:</span>
                    <span>{currentMessages + selectedPkg.messages}</span>
                  </div>
                </div>
              )}

              {/* Historial de recargas */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FaHistory className="w-4 h-4 text-gray-600" />
                  <h4 className="font-semibold text-gray-800">Lista de Recargas</h4>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {rechargeHistory.length > 0 ? (
                    <div className="space-y-2">
                      {rechargeHistory.map((recharge) => (
                        <div key={recharge.id} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{recharge.package.description}</span>
                            <span className="text-gray-500 ml-2">({recharge.date})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">${recharge.amount}</span>
                            <span className={`px-2 py-1 rounded text-xs ${recharge.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : recharge.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                              {recharge.status === 'completed' ? 'Completado' :
                                recharge.status === 'pending' ? 'Pendiente' : 'Fallido'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-2">
                      No hay recargas anteriores
                    </p>
                  )}
                </div>
              </div>

              {/* Explicación y condiciones */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Explicación - Condiciones</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Los mensajes se acreditan inmediatamente después del pago exitoso</p>
                  <p>• Los mensajes no tienen fecha de vencimiento</p>
                  <p>• Puedes recargar en cualquier momento desde este módulo</p>
                  <p>• Los pagos se procesan de forma segura</p>
                  <p>• Para soporte técnico contacta a nuestro equipo</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalDefault>
  );
}
