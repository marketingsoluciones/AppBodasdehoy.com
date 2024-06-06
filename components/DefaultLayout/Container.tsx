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
    setLoading(false)
  }, [])

  const urls = ["/info-app", "/confirmar-asistencia", "/RelacionesPublicas", "/RelacionesPublicas/VentasEntradas", "/RelacionesPublicas/EntradasGratis", "/RelacionesPublicas/ReservaDatos", "/RelacionesPublicas/ReservaCantidad", "/RelacionesPublicas/RegistroEntradasUser", "/RelacionesPublicas/RecuperarCompra", "/RelacionesPublicas/ReciboEntradas", "/RelacionesPublicas/CancelarReserva", "/RelacionesPublicas/ComprasComp", "/RelacionesPublicas/PrincipalDE"]

  return (
    <>
      {(!["RelacionesPublicas"].includes(router?.route.split("/")[1])) && <>
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

      <div className={`w-[100%]  overflow-auto ${urls.includes(router?.pathname) ? "" : forCms ? "h-[100vh]" : "h-[calc(100vh-144px)]"}`}>
        <main>
          {children}
        </main>
      </div>
    </>
  );
};

export default Container;
