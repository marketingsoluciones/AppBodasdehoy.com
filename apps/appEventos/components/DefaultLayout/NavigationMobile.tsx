import { useRouter } from "next/navigation";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';
import ChatToggleButton from "../ChatSidebar/ChatToggleButton";
import MobileBottomNav from "./MobileBottomNav";

/**
 * Menú inferior móvil GLOBAL (todas las pantallas salvo "/").
 * Renderiza el MISMO menú que "Mis eventos" (MobileBottomNav), pero aquí la
 * navegación pasa por una guarda: los módulos que requieren un evento
 * seleccionado redirigen a "/" con aviso si aún no hay evento elegido.
 */
const NavigationMobile = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const { event } = EventContextProvider() as any;
  const { user, config } = AuthContextProvider() as any;
  const { eventsGroup, eventsGroupDone } = EventsGroupContextProvider() as any;

  const canSeeCopilot =
    config?.copilotEnabled !== false ||
    (Array.isArray(user?.role) ? user.role.includes('admin') : user?.role === 'admin');
  const isGuest = user?.displayName === 'guest';

  // Guarda de "evento seleccionado". "Mis eventos" ("/") siempre pasa.
  const handleNav = (route: string) => {
    if (route === "/") {
      router.push("/");
      return;
    }
    if (!eventsGroupDone) {
      toast("warning", t("waitEventsListToast"));
      router.push("/");
      return;
    }
    if (event?._id) {
      router.push(route);
      return;
    }
    // No hay evento seleccionado.
    // BUG-CW-N20 (informe QA 23-jun 5ª ronda): el usuario tocaba un módulo
    // sin evento seleccionado y el handler hacía router.push("/") + toast.
    // Si ya estaba en "/", router.push("/") no hace nada visible y el toast
    // se podía perder. Mejora: scroll al top + flag query param para que el
    // home muestre banner persistente "Elige un evento primero".
    const hasEvents = Array.isArray(eventsGroup) && eventsGroup.length > 0;
    toast("error", t(hasEvents ? "selectEventFromHomeToast" : "youmustcreateevent"));
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/?needsEvent=1");
      }
    } else {
      router.push("/");
    }
  };

  return (
    <>
      {canSeeCopilot && (
        <div className="fixed bottom-[92px] right-4 z-[80] md:hidden">
          <ChatToggleButton studio className="shadow-lg" />
        </div>
      )}
      <MobileBottomNav onNavigate={handleNav} hideItinerario={isGuest} />
    </>
  );
};

export default NavigationMobile;
