import { useRouter, usePathname } from "next/navigation";
import { AuthContextProvider, LoadingContextProvider, ChatSidebarContextProvider } from "../../context";
import NavigationMobile from "./NavigationMobile";
import Navigation from "./Navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChatSidebar } from "../ChatSidebar";

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
  const chatSidebar = ChatSidebarContextProvider();

  const [isWideScreen, setIsWideScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    "login"
  ];

  const shouldShowChatSidebar = chatSidebar && !excludeChatSidebar.includes(pathname?.split("/")[1] || "");
  const showNavigation = !["RelacionesPublicas", "event", "public-card", "public-itinerary"].includes(pathname?.split("/")[1]);

  // ChatSidebarDirect en desktop está en el flujo (no fixed): ocupa su ancho y el contenido sigue a la derecha sin margen.
  // En móvil el Copilot es flotante (fixed), tampoco aplicamos margen.
  const copilotWidth = 0;

  return (
    <>
      {showNavigation && <>
        <NavigationMobile />
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

      <div className={`flex w-full min-w-0 ${pathname === "/" ? "" : "bg-base"} ${urls.includes(pathname) ? "" : forCms ? "h-[100vh]" : "h-[calc(100vh-144px)]"}`}>
        {/* Copilot: panel a la izquierda (20% en pantallas grandes) */}
        {shouldShowChatSidebar && <ChatSidebar />}

        {/* Contenido principal: siempre el contenido real de la app (eventos, etc.), sin iframe extra */}
        <div
          className="flex-1 min-w-0 overflow-auto overflow-y-scroll transition-all duration-300"
          style={{
            marginLeft: copilotWidth,
          }}
        >
          <main id="rootElementMain" className="w-full h-full">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

export default Container;
