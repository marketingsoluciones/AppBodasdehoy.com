import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AuthContextProvider, LoadingContextProvider, useChatSidebar } from "../../context";
import { EventsGroupContextProvider } from "../../context";
import NavigationMobile from "./NavigationMobile";
import Navigation from "./Navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CHAT_SIDEBAR_MIN_WIDTH, CHAT_SIDEBAR_MAX_WIDTH, CHAT_SIDEBAR_DEFAULT_WIDTH } from "../../context/ChatSidebarContext";

import CopilotFilterBar from "../Utils/CopilotFilterBar";

/** Breakpoint: a partir de este ancho el Copilot usa 20% del espacio (20vw) */
const COPILOT_WIDE_BREAKPOINT = 1024;
/** Por debajo de este ancho se considera móvil: Copilot flotante, contenido sin margen */
const MOBILE_BREAKPOINT = 768;
/** No aplastar el contenido: si no queda al menos este ancho, Copilot pasa a overlay. */
const MIN_CONTENT_WHEN_DOCKED = 900;
// Copilot sidebar: lazy import para no bloquear el bundle principal
const DISABLE_COPILOT_IN_DEV = false;
import dynamic from 'next/dynamic';
const ChatSidebarDirect = dynamic(() => import('../ChatSidebar/ChatSidebarDirect'), { ssr: false });

const Container = (props) => {
  const { children } = props;
  const { forCms } = AuthContextProvider();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Header rediseñado (studio) = ON por defecto (rollback ?studio=legacy). Mide más alto que el
  // clásico (78px + 74px = 152px vs 144px), así que reservamos ese espacio en desktop para que
  // la cabecera quede fija arriba y no la arrastre el scroll del contenido.
  const studioHeader = searchParams?.get("studio") !== "legacy";
  const { setLoading } = LoadingContextProvider();
  const chatSidebar = useChatSidebar();

  const [isWideScreen, setIsWideScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

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
      setViewportWidth(window.innerWidth);
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

  const shouldShowChatSidebar =
    !DISABLE_COPILOT_IN_DEV &&
    chatSidebar &&
    !excludeChatSidebar.includes(pathname?.split("/")[1] || "");
  const shouldMountChatSidebar = shouldShowChatSidebar && !!chatSidebar?.isOpen;
  const showNavigation = !["RelacionesPublicas", "event", "public-card", "public-itinerary", "asistente", "login", "signout", "vista-sin-cookie", "registro"].includes(pathname?.split("/")[1]);
  // Mobile bottom nav oculto en login/registro (el top nav con logo sí se muestra)
  const showMobileNav = showNavigation && !["login", "registro"].includes(pathname?.split("/")[1] || "");

  // En desktop, cuando el Copilot está abierto, reservar su ancho en el layout para que el contenido
  // (tarjetas de eventos, etc.) ceda espacio y no quede tapado por superposición.
  const desiredCopilotWidth = Math.max(
    CHAT_SIDEBAR_MIN_WIDTH,
    Math.min(CHAT_SIDEBAR_MAX_WIDTH, chatSidebar?.width ?? CHAT_SIDEBAR_DEFAULT_WIDTH),
  );
  const canDockCopilot =
    shouldMountChatSidebar &&
    !isMobile &&
    isWideScreen &&
    viewportWidth > 0 &&
    viewportWidth - MIN_CONTENT_WHEN_DOCKED >= CHAT_SIDEBAR_MIN_WIDTH;
  const dockedCopilotWidth = canDockCopilot
    ? Math.max(CHAT_SIDEBAR_MIN_WIDTH, Math.min(desiredCopilotWidth, viewportWidth - MIN_CONTENT_WHEN_DOCKED))
    : 0;
  const copilotDocked = canDockCopilot && dockedCopilotWidth > 0;
  const copilotOverlay = shouldMountChatSidebar && !copilotDocked;
  const copilotSlotWidth = copilotDocked ? dockedCopilotWidth + 4 : 0; // +4 px = asa de resize dentro del panel

  // /login = pantalla full-screen propia (LoginStudio/SplitLoginPage gestionan su
  // layout split a 100vh). Sin nav, sin barra de filtro, sin altura reservada de
  // header (la de 152px) ni padding → elimina la "barra blanca" superior y el
  // scroll; toda la info entra en una sola pantalla.
  const isLoginScreen = (pathname?.split("/")[1] || "") === "login";
  if (isLoginScreen) {
    return <div className="w-screen h-screen overflow-hidden bg-base">{children}</div>;
  }

  return (
    <>
      {showNavigation && <>
        {showMobileNav && !(studioHeader && pathname === "/") && <NavigationMobile />}
        {!forCms && <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.28, delay: 0.08 } }}
          className="md:block relative z-[46]"
          style={{ isolation: "isolate" }}
        >
          <Navigation />
        </motion.div>
        }
      </>
      }

      <div
        className={`w-full max-w-full min-w-0 ${pathname === "/" ? (studioHeader ? "bg-base" : "") : "bg-base"} ${isFullHeight ? "h-[100vh]" : urls.includes(pathname) ? "" : forCms ? "h-[100vh]" : studioHeader ? "h-[calc(100vh-144px)] md:h-[calc(100vh-152px)]" : "h-[calc(100vh-144px)]"}`}
        style={{
          display: "grid",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          // Modo Trae: Copilot a la izquierda + resultados/app a la derecha.
          // Copilot overlay: 1 columna (no aplasta contenido).
          gridTemplateColumns: copilotDocked ? `${copilotSlotWidth}px minmax(0, 1fr)` : "1fr",
          transition: "grid-template-columns 0.2s ease",
        }}
      >
        {copilotDocked && (
          /* Columna Copilot: dock a la izquierda, con separación visual */
          <div
            className="flex flex-row h-full overflow-hidden shrink-0 bg-white text-gray-900 [color-scheme:light] border-r border-gray-200"
            style={{
              minWidth: 0,
              width: copilotSlotWidth,
              maxWidth: copilotSlotWidth,
            }}
          >
            <ChatSidebarDirect overlayBreakpoint={MOBILE_BREAKPOINT} />
          </div>
        )}

        {/* Scroll invisible (rueda/táctil/teclado siguen funcionando) en Mis eventos "/". */}
        <style dangerouslySetInnerHTML={{ __html: `.app-scroll-hide{scrollbar-width:none;-ms-overflow-style:none;} .app-scroll-hide::-webkit-scrollbar{width:0;height:0;display:none;}` }} />
        {/* En "/" ocultamos también la barra de la ventana (html/body), por si el contenido desborda el viewport. */}
        {pathname === "/" && <style dangerouslySetInnerHTML={{ __html: `html,body{scrollbar-width:none!important;-ms-overflow-style:none!important;} html::-webkit-scrollbar,body::-webkit-scrollbar{width:0!important;height:0!important;display:none!important;}` }} />}

        {/* Columna de resultados/app (banner "Organiza tus eventos", tarjetas, etc.): siempre a la derecha del Copilot */}
        <div
          className={`min-w-0 overflow-auto overflow-y-scroll transition-all duration-300 relative z-[45] flex flex-col ${pathname === "/" ? "app-scroll-hide" : ""}`}
          style={{ isolation: "isolate" }}
        >
          {/* Barra de filtro global: visible cuando el Copilot aplicó un filtro (mesa X, tarea X, etc.) */}
          <CopilotFilterBar
            entity={["events", "guests", "tables", "services", "moments", "budget_items"]}
            className="shrink-0 mx-2 mt-2 md:mx-4 md:mt-3"
          />
          <main id="rootElementMain" className="w-full h-full flex-1 min-h-0 pt-3 md:pt-4 pb-3 md:pb-4">
            {children}
          </main>
        </div>
      </div>

      {copilotOverlay && (
        <ChatSidebarDirect forceOverlay={!isMobile} overlayBreakpoint={MOBILE_BREAKPOINT} />
      )}
    </>
  );
};

export default Container;
