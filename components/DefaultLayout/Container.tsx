import { useRouter } from "next/router";
import { AuthContextProvider, LoadingContextProvider } from "../../context";
import NavigationMobile from "./NavigationMobile";
import Navigation from "./Navigation";
import { motion } from "framer-motion";
import { useEffect } from "react";

const Container = (props) => {
  const { children } = props;
  const { forCms } = AuthContextProvider();
  const router = useRouter();
  const { setLoading } = LoadingContextProvider()
  useEffect(() => {
    if (setLoading)
      setLoading(false)
  }, [])

  const urls = ["/info-app", "/confirmar-asistencia", "/RelacionesPublicas", "/RelacionesPublicas/VentasEntradas", "/RelacionesPublicas/EntradasGratis", "/RelacionesPublicas/ReservaDatos", "/RelacionesPublicas/ReservaCantidad", "/RelacionesPublicas/RegistroEntradasUser", "/RelacionesPublicas/RecuperarCompra", "/RelacionesPublicas/ReciboEntradas", "/RelacionesPublicas/CancelarReserva", "/RelacionesPublicas/ComprasComp", "/RelacionesPublicas/PrincipalDE", "/event/[...slug]", "/services/[...slug]"]

  return (
    <>
      {(!["RelacionesPublicas", "event"].includes(router?.route.split("/")[1])) && <>
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

      <div className={`w-[100%] ${router.pathname === "/" ? "" : "bg-base"} overflow-auto overflow-y-scroll ${urls.includes(router?.pathname) ? "" : forCms ? "h-[100vh]" : "h-[calc(100vh-144px)]"}`}>
        <main className="w-full h-full">
          {children}
        </main>
      </div>
    </>
  );
};

export default Container;
