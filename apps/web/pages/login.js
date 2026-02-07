import { useRouter } from "next/router";
import { ButtonClose } from "../components/Forms/ButtonClose";
import { Login, Register, ResetPass } from "../components/Forms/Login/Forms";
import { useEffect, useState } from "react";
import { AuthContextProvider, LoadingContextProvider } from "../context";
import { ArrowLeft } from "../components/icons";

const PageLogin = () => {
  const { config, user, linkMedia, preregister } = AuthContextProvider()
  const { setLoading } = LoadingContextProvider()
  const router = useRouter()

  // Query params usando router.query (Pages Router)
  const queryQ = typeof router.query.q === 'string' ? router.query.q : null
  const queryD = typeof router.query.d === 'string' ? router.query.d : null

  const [stage, setStage] = useState((linkMedia != null ? "register" : null) ?? queryQ ?? "login");
  const [stageRegister, setStageRegister] = useState(0)
  const [whoYouAre, setWhoYouAre] = useState("");
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      if (typeof setLoading === "function") {
        setTimeout(() => {
          setLoading(false)
        }, 500); // Reducido de 1000ms a 500ms
      }
    }
    // ✅ CORRECCIÓN: NO activar loading al desmontar
    // Esto causaba que el overlay bloqueara durante redirects
    return () => {
      if (isMounted) {
        setIsMounted(false)
        // setLoading(true) ← REMOVIDO - No activar loading al salir
      }
    }
  }, [isMounted, setLoading])

  useEffect(() => {
    if (preregister) {
      setStage("register")
      setStageRegister(1)
    }
  }, [preregister])

  const Stages = {
    login: <Login setStage={setStage} whoYouAre={whoYouAre} setWhoYouAre={setWhoYouAre} />,
    register: <Register setStage={setStage} stageRegister={stageRegister} setStageRegister={setStageRegister} whoYouAre={whoYouAre} setWhoYouAre={setWhoYouAre} />,
    resetPassword: <ResetPass setStage={setStage} whoYouAre={whoYouAre} />,
  };

  const handleClose = () => {
    setTimeout(() => {
      // ✅ CORRECCIÓN: No redirigir a "/111" que no existe, usar "/" o queryD
      router.push(queryD || "/")
    }, 100);
  }
  
  // ✅ CORRECCIÓN: Redirigir correctamente después del login
  // DESACTIVADO TEMPORALMENTE - El auto-redirect era demasiado rápido (100ms)
  // Esto causaba que la página se cerrara antes de que el usuario pudiera ver nada
  /*
  useEffect(() => {
    if (user && user?.displayName !== "guest") {
      // Validar que queryD sea una ruta válida antes de redirigir
      let redirectPath = "/"

      if (queryD) {
        // Validar que queryD sea una ruta válida (no vacía, no solo espacios, empiece con /)
        const cleanPath = queryD.trim()
        if (cleanPath && cleanPath.startsWith("/") && cleanPath.length > 1) {
          redirectPath = cleanPath
        } else {
          console.warn('[Login] queryD inválido, usando "/" por defecto:', queryD)
        }
      }

      // ✅ CORRECCIÓN: Usar setTimeout para asegurar que el router esté listo
      // y forzar redirección incluso si estamos en la misma ruta (para recargar)
      const timer = setTimeout(() => {
        console.log('[Login] Redirigiendo después del login a:', redirectPath, 'pathname actual:', router.pathname)
        // Usar replace en lugar de push para evitar que el usuario pueda volver atrás al login
        if (router.pathname !== redirectPath) {
          router.replace(redirectPath)
        } else {
          // Si ya estamos en la ruta correcta, forzar recarga para actualizar el estado
          window.location.href = redirectPath
        }
      }, 100) // Pequeño delay para asegurar que el estado esté actualizado

      return () => clearTimeout(timer)
    }
  }, [user, queryD, router])
  */
  
  // DESACTIVADO: No redirigir automáticamente, dejar que el usuario cierre manualmente
  // if (user && user?.displayName !== "guest") {
  //   // Mientras redirige, mostrar loading
  //   return (
  //     <div className="flex items-center justify-center h-screen w-full">
  //       <div className="flex flex-col items-center gap-4">
  //         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
  //         <p className="text-sm text-gray-500">Redirigiendo...</p>
  //       </div>
  //     </div>
  //   )
  // } else {

  // Siempre mostrar el formulario de login, incluso si el usuario ya está logueado
  // Esto permite al usuario cerrar manualmente el modal
  {
    return (
      (
        <>
          <div className="w-screen fixed h-full top-0 left-0 md:grid z-30 grid-cols-5 font-display overflow-auto">
            <ArrowLeft className={`${(!["bodasdehoy"].includes(config?.development) && (stage === "login" || (stage === "register" && stageRegister === 0) || preregister)) && "hidden"} absolute w-6 h-6 z-[10] text-gray-500 cursor-pointer translate-x-5 translate-y-5`} onClick={() => {
              if (stage === "resetPassword") {
                setStage("login")
                return
              }
              if (stageRegister > 0) {
                setStageRegister(stageRegister - 1)
                return
              }
              handleClose()
            }} />
            <div className="flex flex-col items-center justify-center gap-4 w-full h-[85%] md:h-[60%] px-10 md:px-0 sm:w-3/4 md:w-2/3 relative md:col-span-3 md:col-start-1 md:row-start-1 z-10">
              <div className="flex w-full md:w-2/3 h-[calc(100%-100px)] flex-col items-center">
                <div className={`flex flex-col items-center justify-center transform w-full max-h-[124px] px-4`}>
                  {config?.logoDirectory}
                </div>
                <div className="flex flex-col items-center justify-center">
                  {Stages[stage]}
                </div>
              </div>
            </div>
            <div className="bg-white w-full h-full md:col-span-3 md:col-start-1 md:row-start-1 relative flex items-center justify-center z-0">
              {["bodasdehoy"].includes(config?.development) && (
                <div className="relative z-20">
                  <ButtonClose onClick={handleClose} />
                </div>
              )}
            </div>
            <div className="hidden md:block banner w-full h-full md:col-span-2 md:col-start-4 md:row-start-1" />
          </div>
          <style jsx>
            {`
            .banner {
              background-image: url("/banner-login.webp");
              background-size: cover;
              background-position: top;
            }
          `}
          </style>
        </>
      )

    );
  }
}

export default PageLogin