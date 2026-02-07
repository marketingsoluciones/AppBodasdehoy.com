import Link from "next/link";
import { AuthContextProvider, LoadingContextProvider, EventContextProvider, EventsGroupContextProvider } from "../context";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

const VistaSinCookie = () => {
  const { t } = useTranslation();
  const router = useRouter()
  const pathname = router.pathname
  const { config } = AuthContextProvider()
  const { setLoading } = LoadingContextProvider()
  const { event } = EventContextProvider()
  const { eventsGroup } = EventsGroupContextProvider()
  const [redirected, setRedirected] = useState(false)

  // ✅ OPTIMIZACIÓN CRÍTICA: Redirigir inmediatamente sin esperar config ni datos
  useEffect(() => {
    // Evitar redirecciones múltiples
    if (redirected) {
      console.log('[VistaSinCookie] Ya redirigido, ignorando');
      return;
    }
    
    console.log('[VistaSinCookie] Ejecutando redirección:', { pathname, hasConfig: !!config, configDev: config?.development, hasEvent: !!event, hasEventsGroup: !!eventsGroup });
    
    // Si estamos en /servicios, intentar redirigir con evento (si está disponible)
    if (pathname === "/servicios") {
      const currentEvent = event || (eventsGroup && eventsGroup.length > 0 ? eventsGroup[0] : null)
      
      if (currentEvent && currentEvent._id) {
        const firstItinerary = currentEvent.itinerarios_array && currentEvent.itinerarios_array.length > 0 
          ? currentEvent.itinerarios_array[0] 
          : null
        
        if (firstItinerary && firstItinerary._id) {
          console.log('[VistaSinCookie] Redirigiendo a servicios con evento e itinerario');
          setRedirected(true);
          router?.push(`/public-card/servicios-event-${currentEvent._id}-${firstItinerary._id}`)
          setLoading(false);
          return;
        } else if (currentEvent._id) {
          console.log('[VistaSinCookie] Redirigiendo a servicios con evento');
          setRedirected(true);
          router?.push(`/public-card/servicios?event=${currentEvent._id}`)
          setLoading(false);
          return;
        }
      }
      
      // Si no hay evento disponible, redirigir a login inmediatamente
      console.log('[VistaSinCookie] No hay evento, redirigiendo a login');
      setRedirected(true);
      router?.push(`/login${pathname !== "/" ? `?d=${pathname}` : ""}`)
      setLoading(false);
      return;
    }
    
    // ✅ CORRECCIÓN CRÍTICA: SIEMPRE redirigir a login si no hay usuario
    // No importa si es bodasdehoy o no, si no hay usuario debe ir a login
    console.log('[VistaSinCookie] Redirigiendo a login (usuario no logueado)');
    setRedirected(true);
    router?.push(`/login${pathname !== "/" ? `?d=${pathname}` : ""}`)
    setLoading(false);
  }, [pathname, event, eventsGroup, config, router, setLoading, redirected])
  
  // ✅ CORRECCIÓN: SIEMPRE retornar contenido válido para evitar 404
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

export default VistaSinCookie