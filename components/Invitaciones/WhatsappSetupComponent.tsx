import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import { fetchApiBodas, queries } from '../../utils/Fetching';
import { FaWhatsapp } from 'react-icons/fa';
import { ErrorMessage, ConnectedView, PhoneNumberForm, QRCodeDisplay } from './whatsappSetupComponents';
import type { WhatsAppSession, CreateSessionResponse } from './whatsappSetupComponents/types';
import { SocketContextProvider } from '../../context/SocketContext';
import ModalDefault from './ModalDefault';
import { LoadingSpinner } from '../Utils/LoadingSpinner';

interface props {
  setShowModalSetupWhatsapp: Dispatch<SetStateAction<boolean>>
}

export function WhatsappSetupComponent({ setShowModalSetupWhatsapp }: props) {
  const { user, config } = AuthContextProvider();
  const { event } = EventContextProvider();

  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [checkingConnection, setCheckingConnection] = useState(false);
  const { socket } = SocketContextProvider()
  const [loadingSpinner, setLoadingSpinner] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      setTimeout(() => {
        setLoadingSpinner(false)
      }, 500);
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  // Manejo del socket
  useEffect(() => {
    const handleMessage = async (msg: any) => {
      if (msg?.payload?.action === "qrCode") {
        setQrCode(msg?.payload?.value);
        setLoading(false);
      }
      if (msg?.payload?.action === "whatsapp_deleted") {
        try {
          setQrCode(null);
          setSession(null);
          setPhoneNumber('');
          setCheckingConnection(false);
          setError(null);
          setLoading(false);
        } catch (error) {
          console.error('Error al desconectar la sesión:', error);
        }
      }
      if (msg?.payload?.action === "connected") {
        setQrCode(null);
        setLoading(false);
        setSession(msg?.payload?.value);
        setCheckingConnection(true);
      }
    }
    socket?.on("app:message", handleMessage)
    return () => {
      socket?.off("app:message", handleMessage)
    }
  }, [socket]);

  // Generar sessionId único basado en el evento y usuario
  useEffect(() => {
    if (event?._id && user?.uid) {
      const uniqueSessionId = `${event._id}_${user.uid}`;
      setSessionId(uniqueSessionId);
    }
  }, [event, user]);

  // Verificar si ya existe una sesión
  useEffect(() => {
    if (sessionId && config?.development) {
      checkExistingSession();
    }
  }, [sessionId, config]);

  // Desconectar sesión al desmontar el componente si no está conectada
  const disconnectSessionComponent = () => {
    setLoadingSpinner(true)

    if (sessionId && config?.development && !session?.isConnected) {
      // Llamar a la API directamente sin actualizar el estado
      fetchApiBodas({
        query: queries.whatsappDisconnectSession,
        variables: {
          args: {
            sessionId
          }
        },
        development: config.development
      }).then(() => {
        setShowModalSetupWhatsapp(false)
      }).catch(err => console.error('Error al desconectar en cleanup:', err))
    } else {
      setShowModalSetupWhatsapp(false)
    }
    setLoadingSpinner(false)

  };

  const checkExistingSession = async () => {
    if (!sessionId || !config?.development) return;
    try {
      setLoading(true);
      const result = await fetchApiBodas({
        query: queries.whatsappGetSession,
        variables: {
          args: {
            sessionId
          }
        },
        development: config.development
      });

      if (result) {
        setSession(result);
        if (result.isConnected) {
          setQrCode(null);
        } else if (result.qrCode) {
          setQrCode(result.qrCode);
        }
      }
    } catch (err) {
      console.log('No existe sesión previa', err);
    } finally {
      setLoading(false);
    }
  };

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
  }, [sessionId, config]);

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
          {!qrCode && <div className="border-t-[1px] bg-gray-50 p-4">
            <h4 className="font-display text-sm font-semibold text-gray-700 mb-2">
              Información importante
            </h4>
            <ul className="font-body text-[11px] text-gray-600 space-y-1">
              <li>• La conexión se mantendrá activa mientras tu teléfono esté conectado</li>
              <li>• Puedes desconectar desde WhatsApp o desde el botón arriba de desconectar</li>
              <li>• Manten la conexión activa solo si vas a enviar invitaciones</li>
              {!session?.isConnected && (
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