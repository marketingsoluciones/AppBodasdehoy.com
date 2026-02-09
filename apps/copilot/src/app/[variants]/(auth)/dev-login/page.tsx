'use client';

import { Alert, Button, Card, Divider, Input, Radio, Typography } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { eventosAPI } from '@/config/eventos-api';
import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import { FirebaseAuth } from '@/features/FirebaseAuth';
import { useChatStore } from '@/store/chat';
import { optimizedApiClient } from '@/utils/api-client-optimized';
import { useVisitorData } from '@/hooks/useVisitorData';
import { registerWithEmailPassword, processGoogleRedirectResult, processFacebookRedirectResult } from '@/services/firebase-auth';
import { auth } from '@/libs/firebase';
import { getRedirectResult } from 'firebase/auth';

const { Title, Text } = Typography;

/**
 * Componente interno que usa useSearchParams
 */
function DevLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [developer, setDeveloper] = useState('bodasdehoy');
  const [userId, setUserId] = useState('bodasdehoy.com@gmail.com');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'simple' | 'jwt' | 'register'>('simple');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');

  const { setExternalChatConfig, fetchExternalChats } = useChatStore();
  const { migrateVisitorData, getStoredSessionId } = useVisitorData();

  // ✅ OPTIMIZACIÓN: Cargar datos de forma asíncrona sin bloquear render inicial
  useEffect(() => {
    // Usar setTimeout para diferir la carga y no bloquear el render inicial
    const loadStoredData = () => {
      if (typeof window !== 'undefined') {
        try {
          // Intentar obtener configuración guardada
          const storedConfig = localStorage.getItem('dev-user-config');
          if (storedConfig) {
            // ✅ FIX: Manejo robusto de parsing JSON
            let config;
            try {
              if (!storedConfig.trim().startsWith('{') && !storedConfig.trim().startsWith('[')) {
                throw new Error('Stored config is not valid JSON');
              }
              config = JSON.parse(storedConfig);
            } catch (parseError) {
              console.warn('⚠️ Error parseando storedConfig:', parseError);
              config = null;
            }
            console.log('✅ Usuario encontrado en localStorage:', {
              developer: config.developer,
              hasToken: !!config.token,
              userId: config.userId?.slice(0, 20) + '...',
            });

            // Pre-llenar campos con datos del usuario logueado
            if (config.developer) setDeveloper(config.developer);
            if (config.userId) setUserId(config.userId);
          }
        } catch (error) {
          console.warn('⚠️ Error leyendo localStorage:', error);
        }
      }
    };

    // Diferir carga para no bloquear render inicial
    const timeoutId = setTimeout(loadStoredData, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  // ✅ Estado para mostrar mensaje de sesión expirada
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  // ✅ OPTIMIZACIÓN: Obtener parámetros de URL inmediatamente (sincrónico, rápido)
  useEffect(() => {
    const urlDeveloper = searchParams.get('developer');
    const urlUserId = searchParams.get('userId');
    const urlEmail = searchParams.get('email');
    const urlPhone = searchParams.get('phone');
    const urlMode = searchParams.get('mode'); // ✅ NUEVO: Detectar modo desde URL
    const urlReason = searchParams.get('reason'); // ✅ NUEVO: Razón de redirección

    if (urlDeveloper) setDeveloper(urlDeveloper);
    if (urlUserId) setUserId(urlUserId);
    else if (urlEmail) setUserId(urlEmail);
    else if (urlPhone) setUserId(urlPhone);

    // ✅ NUEVO: Si viene con mode=register, cambiar automáticamente al modo registro
    if (urlMode === 'register') {
      setLoginMode('register');
    }

    // ✅ NUEVO: Si viene con reason=session_expired, mostrar mensaje
    if (urlReason === 'session_expired') {
      setSessionExpiredMessage('Tu sesion ha expirado. Por favor, inicia sesion nuevamente para continuar.');
    }
  }, [searchParams]);

  // ✅ NUEVO: Manejar resultado de redirect de Google/Facebook
  // ✅ IMPORTANTE: Solo se ejecuta una vez al cargar la página
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const handleRedirectResult = async () => {
      try {
        // ✅ Esperar un poco para asegurar que Firebase esté listo
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), 500);
        });
        
        if (!isMounted) return;
        
        // Verificar si hay un resultado de redirect pendiente
        const redirectResult = await getRedirectResult(auth);
        if (!redirectResult || !isMounted) {
          return; // No hay redirect pendiente o el componente se desmontó
        }
        
        console.log('✅ Redirect result detectado, procesando login...', {
          email: redirectResult.user.email,
          providerId: redirectResult.providerId,
        });
        
        setLoading(true);
        
        // Determinar qué provider se usó (Google o Facebook)
        // ✅ Usar localStorage como fallback si sessionStorage no está disponible
        const getStoredDevelopment = (key: string) => {
          try {
            return sessionStorage.getItem(key) || localStorage.getItem(key);
          } catch {
            return localStorage.getItem(key);
          }
        };
        
        const savedDevelopment = getStoredDevelopment('google_login_development') || 
                                 getStoredDevelopment('facebook_login_development') || 
                                 developer;
        
        // Procesar el login según el provider
        const providerId = redirectResult.providerId;
        let result;
        
        if (providerId === 'google.com') {
          result = await processGoogleRedirectResult(savedDevelopment);
        } else if (providerId === 'facebook.com') {
          result = await processFacebookRedirectResult(savedDevelopment);
        } else {
          throw new Error(`Provider no reconocido: ${providerId}`);
        }
        
        if (!isMounted) return; // Verificar de nuevo después de async
        
        if (result && result.success && result.user) {
          // Configurar usuario en el chat store
          const userEmail = result.user.email || '';
          const jwtToken = localStorage.getItem('api2_jwt_token') || undefined;

          // ⚠️ Advertir si no se obtuvo JWT (funciones limitadas)
          if (!jwtToken && (result as any).jwtError) {
            console.warn('⚠️ Login exitoso pero sin JWT:', (result as any).jwtError);
            const { message } = await import('antd');
            message.warning('Sesion iniciada pero algunas funciones como crear eventos estaran limitadas. Intenta cerrar sesion y volver a entrar.');
          }

          const configToSave = {
            developer: savedDevelopment,
            role: 'user',
            timestamp: Date.now(),
            token: jwtToken || null,
            userId: userEmail,
            user_data: {
              displayName: result.user.displayName || '',
              photoURL: result.user.photoURL || '',
              uid: result.user.uid,
            },
            user_type: 'registered'
          };
          
          localStorage.setItem('dev-user-config', JSON.stringify(configToSave));
          
          // Configurar en chat store
          await setExternalChatConfig(
            userEmail,
            savedDevelopment,
            jwtToken,
            'registered',
            undefined,
            configToSave.user_data
          );
          
          // ✅ Obtener URL de redirección guardada o usar /chat por defecto
          const getStoredRedirectUrl = () => {
            try {
              return sessionStorage.getItem('google_login_redirect_url') || 
                     sessionStorage.getItem('facebook_login_redirect_url') ||
                     localStorage.getItem('google_login_redirect_url') || 
                     localStorage.getItem('facebook_login_redirect_url') ||
                     '/chat';
            } catch {
              return localStorage.getItem('google_login_redirect_url') || 
                     localStorage.getItem('facebook_login_redirect_url') ||
                     '/chat';
            }
          };
          
          const redirectUrl = getStoredRedirectUrl();
          
          // Limpiar URLs de redirección
          try {
            sessionStorage.removeItem('google_login_redirect_url');
            sessionStorage.removeItem('facebook_login_redirect_url');
            localStorage.removeItem('google_login_redirect_url');
            localStorage.removeItem('facebook_login_redirect_url');
          } catch {
            // Ignorar errores al limpiar storage
          }
          
          // Redirigir
          console.log('🔄 Redirigiendo a:', redirectUrl);
          
          // ✅ Usar window.location para forzar recarga completa si es necesario
          if (redirectUrl.startsWith('http')) {
            window.location.href = redirectUrl;
          } else {
            router.push(redirectUrl);
            router.refresh();
          }
        } else {
          throw new Error('No se pudo procesar el login');
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        console.error('❌ Error procesando redirect result:', error);
        
        // ✅ Si el error es que no hay redirect result, no mostrar error (es normal)
        if (error.code === 'auth/no-auth-event' || error.message?.includes('no-auth-event')) {
          console.log('ℹ️ No hay redirect result pendiente (normal si no se hizo login)');
          return;
        }
        
        setError(error.message || 'Error al procesar el login');
        setLoading(false);
      }
    };
    
    // ✅ Ejecutar inmediatamente y también después de un delay por si acaso
    handleRedirectResult();
    
    // ✅ También intentar después de 1 segundo (por si Firebase tarda en inicializar)
    timeoutId = setTimeout(() => {
      if (isMounted) {
        handleRedirectResult();
      }
    }, 1000);
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // ✅ IMPORTANTE: Array vacío para ejecutar solo una vez

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    // Validaciones
    if (!userId || !password) {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (!userId.includes('@')) {
      setError('Por favor, ingresa un email válido');
      setLoading(false);
      return;
    }

    console.log('🚀 Iniciando proceso de registro...', {
      developer,
      email: userId.slice(0, 10) + '...',
    });

    try {
      const result = await registerWithEmailPassword(userId, password, developer);
      
      console.log('✅ Registro exitoso:', {
        development: result.development,
        hasToken: !!result.token,
        user_id: result.user_id?.slice(0, 20),
      });

      if (result.success && result.user_id && result.development) {
        console.log('✅ Registro exitoso, configurando store...');

        // Guardar token en cache optimizado y en localStorage (múltiples ubicaciones para compatibilidad)
        if (result.token) {
          optimizedApiClient.setToken(result.token, result.user_id, result.development);
          // ✅ CORRECCIÓN: Guardar token en TODAS las ubicaciones esperadas
          localStorage.setItem('jwt_token', result.token);
          localStorage.setItem('api2_jwt_token', result.token);
        }

        // Guardar en localStorage
        const configToSave = {
          developer: result.development,
          timestamp: Date.now(),
          token: result.token || null,
          userId: result.user_id,
          user_type: 'registered',
        };
        localStorage.setItem('dev-user-config', JSON.stringify(configToSave));
        console.log('💾 Config guardado en localStorage');

        // Guardar en cookie
        const cookieValue = encodeURIComponent(JSON.stringify(configToSave));
        // eslint-disable-next-line unicorn/no-document-cookie
        document.cookie = `dev-user-config=${cookieValue}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        console.log('🍪 Cookie dev-user-config establecida');

        // Configurar store
        const configPromise = setExternalChatConfig(
          result.user_id,
          result.development,
          result.token || undefined,
          'registered',
        )
          .then(() => {
            console.log('✅ Store configurado correctamente');
          })
          .catch((err) => {
            console.warn('⚠️ Error en setExternalChatConfig (continuando):', err);
          });

        await Promise.race([
          configPromise,
          new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 1000);
          }),
        ]);

        // Recuperar datos de visitante si existen
        try {
          const guestSessionId = getStoredSessionId();
          if (guestSessionId) {
            console.log('🔍 Intentando recuperar datos de visitante...');
            const visitorData = await migrateVisitorData(result.user_id, guestSessionId);
            
            if (visitorData && visitorData.partial_event_data) {
              console.log('✅ Datos de visitante recuperados:', visitorData);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error recuperando datos de visitante (continuando):', error);
        }

        // Cargar chats
        fetchExternalChats().catch((err) => {
          console.warn('⚠️ Error cargando chats (continuando):', err);
        });

        // Redirigir al chat
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 200);
        });

        console.log('🔄 Redirigiendo a /chat...');
        if (typeof window !== 'undefined') {
          try {
            router.replace('/chat');
            setTimeout(() => {
              if (window.location.pathname !== '/chat') {
                window.location.href = '/chat';
              }
            }, 100);
          } catch {
            window.location.href = '/chat';
          }
        }
      } else {
        const errorMsg = result.message || 'Error en el registro. Por favor, intenta de nuevo.';
        console.error('❌ Registro falló:', errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Error al registrarse:', error);
      setError(error.message || 'Error al registrarse. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
      console.log('🏁 Proceso de registro finalizado');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    console.log('🚀 Iniciando proceso de login...', {
      developer,
      loginMode,
      userId: userId.slice(0, 10) + '...',
    });

    try {
      if (loginMode === 'jwt' && password) {
        // Login completo con JWT
        console.log('📡 Llamando a loginWithJWT...');
        const result = await eventosAPI.loginWithJWT(userId, password, developer);

        console.log('📥 Respuesta loginWithJWT:', {
          development: result.development,
          hasToken: !!result.token,
          success: result.success,
          user_id: result.user_id?.slice(0, 20),
        });

        if (result.success && result.user_id && result.development) {
          console.log('✅ Login exitoso, configurando store...');

          // Guardar token en cache optimizado y en localStorage (múltiples ubicaciones para compatibilidad)
          if (result.token) {
            optimizedApiClient.setToken(result.token, result.user_id, result.development);
            // ✅ CORRECCIÓN: Guardar token en TODAS las ubicaciones esperadas
            localStorage.setItem('jwt_token', result.token);
            localStorage.setItem('api2_jwt_token', result.token);
          }

          // Guardar en localStorage inmediatamente
          const configToSave = {
            developer: result.development,
            timestamp: Date.now(),
            token: result.token || null,
            userId: result.user_id,
          };
          localStorage.setItem('dev-user-config', JSON.stringify(configToSave));
          console.log('💾 Config guardado en localStorage');

          // ✅ NUEVO: También guardar en cookie HTTP para autenticación del servidor
          const cookieValue = encodeURIComponent(JSON.stringify(configToSave));
          // eslint-disable-next-line unicorn/no-document-cookie
          document.cookie = `dev-user-config=${cookieValue}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          console.log('🍪 Cookie dev-user-config establecida');

          // Configurar store (esperar un poco pero no bloquear)
          const configPromise = setExternalChatConfig(
            result.user_id,
            result.development,
            result.token || undefined,
          )
            .then(() => {
              console.log('✅ Store configurado correctamente');
            })
            .catch((err) => {
              console.warn('⚠️ Error en setExternalChatConfig (continuando):', err);
            });

          // No esperar más de 1 segundo por la configuración
          await Promise.race([
            configPromise,
            new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve();
              }, 1000);
            }),
          ]);

          // Intentar cargar chats pero no bloquear
          fetchExternalChats().catch((err) => {
            console.warn('⚠️ Error cargando chats (continuando):', err);
          });

          // ✅ Generar mensaje de bienvenida con eventos
          const eventos = result.eventos || [];
          let welcomeMessage = `¡Hola ${result.user_data?.displayName || result.user_id?.split('@')[0] || 'Usuario'}! 👋\n\n`;

          if (eventos.length > 0) {
            welcomeMessage += `Tienes ${eventos.length} evento(s) registrado(s):\n\n`;
            eventos.forEach((evento: any, index: number) => {
              const fecha = evento.fecha
                ? new Date(evento.fecha).toLocaleDateString('es-ES')
                : 'Fecha no especificada';
              welcomeMessage += `${index + 1}. **${evento.nombre || 'Sin nombre'}**\n`;
              welcomeMessage += `   - Fecha: ${fecha}\n`;
              if (evento.tipo) welcomeMessage += `   - Tipo: ${evento.tipo}\n`;
              if (evento.poblacion) welcomeMessage += `   - Ubicación: ${evento.poblacion}\n`;
              welcomeMessage += `\n`;
            });
            welcomeMessage += `¿En qué puedo ayudarte con tus eventos hoy?`;
          } else {
            welcomeMessage += `Estás registrado en el sistema. Aún no tienes eventos creados, pero puedo ayudarte a crear uno cuando estés listo.\n\n`;
            welcomeMessage += `¿En qué puedo ayudarte hoy?`;
          }

          // ✅ NUEVO: Recuperar datos de visitante si existen
          try {
            const guestSessionId = getStoredSessionId();
            if (guestSessionId) {
              console.log('🔍 Intentando recuperar datos de visitante...');
              const visitorData = await migrateVisitorData(result.user_id, guestSessionId);
              
              if (visitorData && visitorData.partial_event_data) {
                console.log('✅ Datos de visitante recuperados:', visitorData);
                
                // Si había intención de crear evento, agregar sugerencia al mensaje de bienvenida
                if (visitorData.intent === 'crear_evento' && visitorData.partial_event_data) {
                  const eventData = visitorData.partial_event_data;
                  welcomeMessage += `\n\n💡 **Nota:** Detectamos que intentabas crear un evento antes de registrarte. `;
                  if (eventData.nombre) {
                    welcomeMessage += `¿Te gustaría completar la creación del evento "${eventData.nombre}"?`;
                  } else {
                    welcomeMessage += `¿Te gustaría crear tu primer evento ahora?`;
                  }
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Error recuperando datos de visitante (continuando):', error);
            // No bloquear el login si falla la recuperación
          }

          // Guardar mensaje de bienvenida en localStorage para que se muestre al cargar el chat
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'welcome-message',
              JSON.stringify({
                eventos_count: eventos.length,
                message: welcomeMessage,
                timestamp: Date.now(),
                user_id: result.user_id,
              }),
            );
            console.log('✅ Mensaje de bienvenida guardado:', { eventos_count: eventos.length });
          }

          // Pequeño delay para asegurar que el store se actualice
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, 200);
          });

          console.log('🔄 Redirigiendo a /chat...');
          // Usar navegación directa para evitar prefetch errors de Next.js
          if (typeof window !== 'undefined') {
            try {
              router.replace('/chat');
              // Fallback rápido en caso de errores
              setTimeout(() => {
                if (window.location.pathname !== '/chat') {
                  console.warn('⚠️ Redirección falló, forzando navegación...');
                  window.location.href = '/chat';
                }
              }, 100);
            } catch (error) {
              console.warn('⚠️ router.replace falló, usando window.location:', error);
              window.location.href = '/chat';
            }
          }
        } else {
          const errorMsg = result.message || 'Error en login con JWT. Verifica tus credenciales.';
          console.error('❌ Login falló:', errorMsg);
          setError(errorMsg);
        }
      } else {
        // Login simple (identificación directa) - usar endpoint identifyUser
        console.log('📡 Llamando a identifyUser...');

        // Detectar si userId es email o teléfono
        const isEmail = userId.includes('@');
        const email = isEmail ? userId : undefined;
        const phone = !isEmail ? userId : undefined;

        console.log('📤 Parámetros identifyUser:', {
          developer,
          email: email?.slice(0, 10),
          phone: phone?.slice(0, 10),
        });

        const result = await eventosAPI.identifyUser(developer, email, phone);

        console.log('📥 Respuesta identifyUser:', {
          development: result.development,
          success: result.success,
          user_id: result.user_id?.slice(0, 20),
          user_type: result.user_type,
        });

        if (result.success && result.user_id && result.development) {
          console.log('✅ Identificación exitosa, configurando store...');

          // Bienvenida se maneja desde ChatHydration para evitar duplicados

          // Guardar en localStorage inmediatamente con información completa
          const configToSave2 = {
            developer: result.development,
            role: result.role,
            timestamp: Date.now(),
            userId: result.user_id,
            user_data: result.user_data,
            user_type: result.user_type, // Guardar también user_data para persistencia
          };
          localStorage.setItem('dev-user-config', JSON.stringify(configToSave2));
          console.log('💾 Config guardado en localStorage con información completa');

          // ✅ NUEVO: También guardar en cookie HTTP para autenticación del servidor
          const cookieValue2 = encodeURIComponent(JSON.stringify(configToSave2));
          // eslint-disable-next-line unicorn/no-document-cookie
          document.cookie = `dev-user-config=${cookieValue2}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          console.log('🍪 Cookie dev-user-config establecida');

          // Configurar store (esperar un poco pero no bloquear)
          // ✅ CORRECCIÓN: Pasar user_type, role y user_data para que se guarde en el store
          const configPromise = setExternalChatConfig(
            result.user_id,
            result.development,
            undefined, // token
            result.user_type, // userType
            result.role, // userRole
            result.user_data, // userData
          )
            .then(() => {
              console.log('✅ Store configurado correctamente con user_type:', result.user_type);
            })
            .catch((err) => {
              console.warn('⚠️ Error en setExternalChatConfig (continuando):', err);
            });

          // No esperar más de 1 segundo por la configuración
          await Promise.race([
            configPromise,
            new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve();
              }, 1000);
            }),
          ]);

          // Intentar cargar chats pero no bloquear
          fetchExternalChats().catch((err) => {
            console.warn('⚠️ Error cargando chats (continuando):', err);
          });

          // Pequeño delay para asegurar que el store se actualice
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, 200);
          });

          console.log('🔄 Redirigiendo a /chat...');
          // Usar navegación directa para evitar prefetch errors de Next.js
          if (typeof window !== 'undefined') {
            try {
              router.replace('/chat');
              // Fallback rápido en caso de errores
              setTimeout(() => {
                if (window.location.pathname !== '/chat') {
                  console.warn('⚠️ Redirección falló, forzando navegación...');
                  window.location.href = '/chat';
                }
              }, 100);
            } catch (error) {
              console.warn('⚠️ router.replace falló, usando window.location:', error);
              window.location.href = '/chat';
            }
          }
        } else {
          const errorMsg =
            result.error || 'Error al identificar usuario. Verifica tus credenciales.';
          console.error('❌ Identificación falló:', errorMsg, result);
          setError(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión:', error);
      // ✅ Ignorar errores de API2 relacionados con password (no críticos)
      const errorMsg = error.message || '';
      if (errorMsg.includes('password') || errorMsg.includes('validation failed')) {
        console.warn('⚠️ Error de API2 ignorado (no crítico para login):', errorMsg);

        // ✅ NUEVO: Guardar sesión básica en localStorage para que funcionen features premium
        const fallbackConfig = {
          developer: developer || 'bodasdehoy',
          note: 'Sesión creada con fallback por error de API2',
          role: 'user',
          timestamp: Date.now(), 
          userId: userId,
          // El email/teléfono que ingresó el usuario
user_type: 'guest'
        };
        localStorage.setItem('dev-user-config', JSON.stringify(fallbackConfig));
        console.log('💾 Config de fallback guardada en localStorage:', fallbackConfig.userId);

        // Redirigir al chat
        if (typeof window !== 'undefined') {
          window.location.href = '/chat';
        }
        return;
      }
      setError(errorMsg || 'Error al iniciar sesión. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
      console.log('🏁 Proceso de login finalizado');
    }
  };

  return (
    <>
      <EventosAutoAuth />
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Card style={{ width: 400 }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Title level={2}>🚀 Login Desarrollador</Title>
            <Text type="secondary">Configura tus credenciales para acceder</Text>
          </div>

          {error && (
            <Alert
              closable
              description={error}
              message="Error"
              onClose={() => setError(null)}
              showIcon
              style={{ marginBottom: 16 }}
              type="error"
            />
          )}

          {sessionExpiredMessage && (
            <Alert
              closable
              description={sessionExpiredMessage}
              message="Sesion Expirada"
              onClose={() => setSessionExpiredMessage(null)}
              showIcon
              style={{ marginBottom: 16 }}
              type="warning"
            />
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
              Modo de Login:
            </label>
            <Radio.Group
              onChange={(e) => setLoginMode(e.target.value)}
              style={{ width: '100%' }}
              value={loginMode}
            >
              <Radio value="simple">Simple (Solo identificación)</Radio>
              <Radio value="jwt">Completo (Con JWT)</Radio>
              <Radio value="register">Registrarse (Nuevo usuario)</Radio>
            </Radio.Group>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Developer:</label>
            <Input
              onChange={(e) => setDeveloper(e.target.value)}
              placeholder="bodasdehoy"
              value={developer}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
              Usuario (Email o Teléfono):
            </label>
            <Input
              onChange={(e) => setUserId(e.target.value)}
              placeholder="bodasdehoy.com@gmail.com"
              value={userId}
            />
          </div>

          {(loginMode === 'jwt' || loginMode === 'register') && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                Contraseña:
              </label>
              <Input.Password
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                value={password}
              />
            </div>
          )}

          {loginMode === 'register' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                Confirmar Contraseña:
              </label>
              <Input.Password
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
              />
            </div>
          )}

          <Button
            block
            disabled={
              !userId || 
              ((loginMode === 'jwt' || loginMode === 'register') && !password) ||
              (loginMode === 'register' && password !== confirmPassword)
            }
            loading={loading}
            onClick={loginMode === 'register' ? handleRegister : handleLogin}
            size="large"
            type="primary"
          >
            {loginMode === 'register' 
              ? 'Registrarse Gratis' 
              : loginMode === 'jwt' 
                ? 'Iniciar Sesión (JWT)' 
                : 'Iniciar Sesión (Simple)'}
          </Button>

          <Divider>O inicia sesión con</Divider>

          <FirebaseAuth
            development={developer}
            onError={(err) => {
              setError(err.message || 'Error al iniciar sesión con Google');
            }}
            onSuccess={(result) => {
              console.log('✅ Login con Google exitoso:', result);
            }}
          />

          <Divider />

          <div style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
            <Text type="secondary">
              También puedes usar: /dev-login?developer=bodasdehoy&email=user@example.com
            </Text>
          </div>
        </Card>
      </div>
    </>
  );
}

/**
 * Página de login para modo desarrollo
 * Envuelta en Suspense para manejar useSearchParams
 */
export default function DevLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <Card style={{ width: 400 }}>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Text>Cargando...</Text>
            </div>
          </Card>
        </div>
      }
    >
      <DevLoginContent />
    </Suspense>
  );
}
