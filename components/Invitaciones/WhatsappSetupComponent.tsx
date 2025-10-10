import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import { fetchApiBodas, queries } from '../../utils/Fetching';
import { FaWhatsapp } from 'react-icons/fa';
import { ErrorMessage, ConnectedView, PhoneNumberForm, QRCodeDisplay } from './whatsappSetupComponents';
import type { WhatsAppSession, CreateSessionResponse } from './whatsappSetupComponents/types';
import ModalDefault from './ModalDefault';
import { LoadingSpinner } from '../Utils/LoadingSpinner';
import { ImageAvatar } from '../Utils/ImageAvatar';
import { detalle_compartidos_array } from '../../utils/Interfaces';

interface props {
  setShowModalSetupWhatsapp: Dispatch<SetStateAction<boolean>>
  setSession: Dispatch<SetStateAction<WhatsAppSession | null>>
  setQrCode: Dispatch<SetStateAction<string | null>>
  setLoading: Dispatch<SetStateAction<boolean>>
  sessionId: string
  session: WhatsAppSession | null
  dupplicatingConnection: { state: boolean, user: detalle_compartidos_array }
  checkingConnection: boolean
  qrCode: string | null
  loading: boolean
  checkExistingSession: () => void
  setError: Dispatch<SetStateAction<string | null>>
  phoneNumber: string
  setPhoneNumber: Dispatch<SetStateAction<string>>
  error: string | null
}

export function WhatsappSetupComponent({ setShowModalSetupWhatsapp, setSession, setQrCode, setLoading, sessionId, session, dupplicatingConnection, checkingConnection, qrCode, loading, checkExistingSession, setError, phoneNumber, setPhoneNumber, error }: props) {
  const { user, config } = AuthContextProvider();
  const { event } = EventContextProvider();
  const [loadingSpinner, setLoadingSpinner] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingSpinner(false)
    }, 500);

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // Desconectar sesión al desmontar el componente si no está conectada
  const disconnectSessionComponent = async () => {
    console.log(100014, "para desconectar")
    setLoadingSpinner(true)

    if (sessionId && config?.development && !session?.isConnected && !dupplicatingConnection.state) {
      try {
        // Llamar a la API directamente sin actualizar el estado
        await fetchApiBodas({
          query: queries.whatsappDisconnectSession,
          variables: {
            args: {
              sessionId
            }
          },
          development: config.development
        })
      } catch (err) {
        console.error('Error al desconectar en cleanup:', err)
      } finally {
        setLoadingSpinner(false)
        setShowModalSetupWhatsapp(false)
      }
    } else {
      setLoadingSpinner(false)
      setShowModalSetupWhatsapp(false)
    }
  };

  useEffect(() => {
    console.log(100011, { dupplicatingConnection }, session, event?.detalles_compartidos_array?.find(elem => elem.uid === session?.userId))
  }, [dupplicatingConnection, session, event])


  const createSession = async () => {
    if (!sessionId || !config?.development) {
      setError('Faltan datos requeridos');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result: CreateSessionResponse = await fetchApiBodas({
        query: queries.whatsappCreateSession,
        variables: {
          args: {
            sessionId,
            development: config.development,
            userId: user?.uid,
            phoneNumber: phoneNumber || undefined
          }
        },
        development: config.development
      });
      if (result.success) {
        setSession(result.session || null);
        setQrCode(result.qrCode || null);
      } else {
        setError(result.error || 'Error al crear la sesión');
      }
    } catch (err) {
      console.error('Error al crear sesión:', err);
      setError('Error al conectar con el servidor');
    }
  };

  const regenerateQR = async () => {
    if (!sessionId || !config?.development) {
      setError('No hay una sesión activa');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result: CreateSessionResponse = await fetchApiBodas({
        query: queries.whatsappRegenerateQR,
        variables: {
          sessionId
        },
        development: config.development
      });

      if (result.success) {
        setSession(result.session || null);
        setQrCode(result.qrCode || null);
      } else {
        setError(result.error || 'Error al regenerar el código QR');
      }
    } catch (err) {
      console.error('Error al regenerar QR:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const disconnectSession = useCallback(async () => {
    if (!sessionId || !config?.development) {
      setError('No hay una sesión activa');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchApiBodas({
        query: queries.whatsappDisconnectSession,
        variables: {
          args: {
            sessionId
          }
        },
        development: config.development
      });

      if (result.success) {
        setSession(null);
        setQrCode(null);
        setPhoneNumber('');
      } else {
        setError(result.error || 'Error al desconectar la sesión');
      }
    } catch (err) {
      console.error('Error al desconectar:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [sessionId, config, setError, setLoading, setSession, setQrCode, setPhoneNumber]);

  return (
    <ModalDefault onClose={() => {
      disconnectSessionComponent()
    }}>
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
            Configuración de WhatsApp
          </h2>
        </div>

        {/* Contenido principal */}
        {!loadingSpinner && <div className="w-full flex-1 flex flex-col rounded-b-lg border-[1px] border-t-0 bg-white overflow-hidden z-10">
          <div className="w-full flex-1 flex items-center justify-center overflow-y-auto p-1">
            {error && <ErrorMessage error={error} />}
            {session?.isConnected ? (
              <ConnectedView
                onRefresh={checkExistingSession}
                onDisconnect={disconnectSession}
                loading={loading}
              />
            ) : dupplicatingConnection.state ? (
              <div className="w-full md:w-1/2 flex flex-col items-center space-y-4 text-center text-gray-600">
                <div className="w-20 h-20 shadow-md rounded-full overflow-hidden">
                  <ImageAvatar disabledTooltip size="xs" user={dupplicatingConnection.user} />
                </div>
                <p className="font-display text-sm font-semibold">
                  {dupplicatingConnection.user?.displayName || dupplicatingConnection.user?.email}
                </p>
                <p className="font-display text-sm">
                  Está intentando conectarse a WhatsApp en este momento, sólo puedes tener una conexión activa por evento
                </p>
              </div>
            ) : (
              <>
                {!qrCode && (
                  <PhoneNumberForm
                    phoneNumber={phoneNumber}
                    onPhoneNumberChange={setPhoneNumber}
                    onSubmit={createSession}
                    loading={loading}
                    disabled={!sessionId}
                  />
                )}
                {qrCode && (
                  <QRCodeDisplay
                    qrCode={qrCode}
                    checkingConnection={checkingConnection}
                    onRegenerateQR={regenerateQR}
                    loading={loading}
                  />
                )}
              </>
            )}
          </div>
          {/* Footer con información */}
          {!session?.isConnected && !dupplicatingConnection.state && <div className="border-t-[1px] bg-gray-50 p-4">
            <h4 className="font-display text-sm font-semibold text-gray-700 mb-2">
              Información importante
            </h4>
            <ul className="font-body text-[11px] text-gray-600 space-y-1">
              <li>• La conexión se mantendrá activa mientras tu teléfono esté conectado</li>
              <li>• Puedes desconectar desde WhatsApp o desde el botón de desconectar</li>
              <li>• Mantén la conexión activa solo si vas a enviar invitaciones</li>
              {qrCode && (
                <>
                  <li>• El código QR expira después de unos minutos</li>
                  <li>• Asegúrate de tener una conexión estable en tu teléfono</li>
                </>
              )}
            </ul>
          </div>}
        </div>}
      </div>
    </ModalDefault>
  );
}