import { useRouter, usePathname } from "next/navigation";
import { AuthContextProvider, LoadingContextProvider, useChatSidebar } from "../../context";
import { EventsGroupContextProvider } from "../../context";
import NavigationMobile from "./NavigationMobile";
import Navigation from "./Navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChatSidebarDirect } from "../ChatSidebar";
import { CHAT_SIDEBAR_MIN_WIDTH, CHAT_SIDEBAR_MAX_WIDTH, CHAT_SIDEBAR_DEFAULT_WIDTH } from "../../context/ChatSidebarContext";
import CopilotFilterBar from "../Utils/CopilotFilterBar";

/** Breakpoint: a partir de este ancho el Copilot usa 20% del espacio (20vw) */
const COPILOT_WIDE_BREAKPOINT = 1024;
/** Por debajo de este ancho se considera móvil: Copilot flotante, contenido sin margen */
const MOBILE_BREAKPOINT = 768;

const Container = (props) => {
  const { children } = props;
  const { forCms } = AuthContextProvider();
  const router = useRouter();
  const pathname = usePathname();
  const { setLoading } = LoadingContextProvider();
  const chatSidebar = useChatSidebar();

  const [isWideScreen, setIsWideScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { setCopilotFilter, clearCopilotFilter } = EventsGroupContextProvider();

  // Listener global FILTER_VIEW / CLEAR_FILTER.
  // Procesa postMessages de chat-ia independientemente de si CopilotEmbed o CopilotIframe está montado.
  // CopilotIframe tiene su propio listener pero solo cuando está en el DOM (rutas /asistente, /diseno-espacios).
  // Para CopilotEmbed (sidebar nativo), este listener es el único punto de entrada para postMessage externo.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: MessageEvent) => {
      const { type, payload, source } = event.data || {};
      if (source === "copilot-parent") return; // ignorar mensajes propios
      if (type === "FILTER_VIEW") {
        const { entity, ids, query } = payload || {};
        if (entity) setCopilotFilter({ entity, ids, query });
      } else if (type === "CLEAR_FILTER") {
        clearCopilotFilter();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setCopilotFilter, clearCopilotFilter]);

  // Quitar overlay "Un momento, por favor" al montar y en cada cambio de ruta.
  // El Sidebar y otras partes ponen setLoading(true) al navegar; si la página destino no llama setLoading(false), el overlay se quedaba fijo.
  useEffect(() => {
    if (!setLoading) return;
    setLoading(false);
    const fallback = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(fallback);
  }, [setLoading, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      setIsWideScreen(window.innerWidth >= COPILOT_WIDE_BREAKPOINT);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const urls = ["/info-app", "/confirmar-asistencia", "/RelacionesPublicas", "/RelacionesPublicas/VentasEntradas", "/RelacionesPublicas/EntradasGratis", "/RelacionesPublicas/ReservaDatos", "/RelacionesPublicas/ReservaCantidad", "/RelacionesPublicas/RegistroEntradasUser", "/RelacionesPublicas/RecuperarCompra", "/RelacionesPublicas/ReciboEntradas", "/RelacionesPublicas/CancelarReserva", "/RelacionesPublicas/ComprasComp", "/RelacionesPublicas/PrincipalDE", "/event/[...slug]", "/services/[...slug]"]

  // Rutas donde NO se muestra el sidebar de chat
  const excludeChatSidebar = [
    "info-app",
    "confirmar-asistencia",
    "RelacionesPublicas",
    "public-card",
    "public-itinerary",
    "copilot",
    "login",
    "diseno-espacios",
    "asistente",
  ];

  // Rutas que gestionan su propia altura (full-screen con iframe interno)
  const fullHeightRoutes = ["diseno-espacios", "asistente"];
  const isFullHeight = fullHeightRoutes.some((r) => pathname?.includes(r));

  const shouldShowChatSidebar = chatSidebar && !excludeChatSidebar.includes(pathname?.split("/")[1] || "");
  const showNavigation = !["RelacionesPublicas", "event", "public-card", "public-itinerary", "asistente"].includes(pathname?.split("/")[1]);
  // Mobile bottom nav oculto en login/registro (el top nav con logo sí se muestra)
  const showMobileNav = showNavigation && !["login", "registro"].includes(pathname?.split("/")[1] || "");

  // En desktop, cuando el Copilot está abierto, reservar su ancho en el layout para que el contenido
  // (tarjetas de eventos, etc.) ceda espacio y no quede tapado por superposición.
  const copilotOpenDesktop = shouldShowChatSidebar && !isMobile && chatSidebar?.isOpen;
  const copilotSlotWidth = copilotOpenDesktop
    ? Math.max(
        CHAT_SIDEBAR_MIN_WIDTH,
        Math.min(CHAT_SIDEBAR_MAX_WIDTH, chatSidebar?.width ?? CHAT_SIDEBAR_DEFAULT_WIDTH),
      ) + 4
    : 0; // +4 px = asa de resize dentro del panel

  return (
    <>
      {showNavigation && <>
        {showMobileNav && <NavigationMobile />}
        {!forCms && <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 1, delay: 0.5 } }}
          className="md:block relative"
        >
          <Navigation />
        </motion.div>
        }
      </>
      }

      <div
        className={`w-full max-w-full min-w-0 ${pathname === "/" ? "" : "bg-base"} ${isFullHeight ? "h-[100vh]" : urls.includes(pathname) ? "" : forCms ? "h-[100vh]" : "h-[calc(100vh-144px)]"}`}
        style={{
          display: "grid",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          // Dos columnas cuando hay Copilot: primera reserva espacio (0px si cerrado), segunda 1fr = resto para banner/contenido
          gridTemplateColumns: shouldShowChatSidebar ? `${copilotSlotWidth}px minmax(0, 1fr)` : "1fr",
          transition: "grid-template-columns 0.2s ease",
        }}
      >
        {shouldShowChatSidebar && (
          /* Columna Copilot: mismo ancho que reserva el grid (sin hueco gris por 20vw vs slot). */
          <div
            className="flex flex-row h-full overflow-hidden shrink-0 bg-white text-gray-900 [color-scheme:light]"
            style={{
              minWidth: 0,
              width: copilotSlotWidth,
              maxWidth: copilotSlotWidth,
            }}
          >
            <ChatSidebarDirect />
          </div>
        )}

        {/* Columna del contenido (banner "Organiza tus eventos", tarjetas, etc.): siempre a la derecha del Copilot */}
        <div
          className="min-w-0 overflow-auto overflow-y-scroll transition-all duration-300 relative z-0 flex flex-col"
          style={{ isolation: "isolate" }}
        >
          {/* Barra de filtro global: visible cuando el Copilot aplicó un filtro (mesa X, tarea X, etc.) */}
          <CopilotFilterBar
            entity={["events", "guests", "tables", "services", "moments", "budget_items"]}
            className="shrink-0 mx-2 mt-2 md:mx-4 md:mt-3"
          />
          <main id="rootElementMain" className="w-full h-full flex-1 min-h-0">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

export default Container;
