import { useRouter } from "next/router";
import { ButtonClose } from "../components/Forms/ButtonClose";
import { Login, Register, ResetPass } from "../components/Forms/Login/Forms";
import { useEffect, useState } from "react";
import { AuthContextProvider, LoadingContextProvider } from "../context";
import { ArrowLeft } from "../components/icons";

const PageLogin = () => {
  const { config, user, verificationDone, linkMedia, preregister } = AuthContextProvider()
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
        setTimeout(() => setLoading(false), 500)
      }
    }
    return () => {
      if (isMounted) setIsMounted(false)
    }
  }, [isMounted, setLoading])

  useEffect(() => {
    if (preregister) {
      setStage("register")
      setStageRegister(1)
    }
  }, [preregister])

  // Auto-redirect tras login exitoso (700ms para dejar que el estado se estabilice)
  useEffect(() => {
    if (user && verificationDone && user?.displayName !== "guest") {
      const redirectPath = queryD?.trim()?.startsWith("/") ? queryD.trim() : "/"
      const timer = setTimeout(() => router.replace(redirectPath), 700)
      return () => clearTimeout(timer)
    }
  }, [user, verificationDone, queryD, router])

  const Stages = {
    login: <Login setStage={setStage} whoYouAre={whoYouAre} setWhoYouAre={setWhoYouAre} />,
    register: <Register setStage={setStage} stageRegister={stageRegister} setStageRegister={setStageRegister} whoYouAre={whoYouAre} setWhoYouAre={setWhoYouAre} />,
    resetPassword: <ResetPass setStage={setStage} whoYouAre={whoYouAre} />,
  };

  const handleClose = () => {
    setTimeout(() => router.push(queryD || "/"), 100)
  }

  return (
    <>
      <div className="w-screen fixed h-full top-0 left-0 md:grid z-30 grid-cols-5 font-display overflow-auto">
        <ArrowLeft
          className={`${(!["bodasdehoy"].includes(config?.development) && (stage === "login" || (stage === "register" && stageRegister === 0) || preregister)) && "hidden"} absolute w-6 h-6 z-[10] text-gray-500 cursor-pointer translate-x-5 translate-y-5`}
          onClick={() => {
            if (stage === "resetPassword") { setStage("login"); return }
            if (stageRegister > 0) { setStageRegister(stageRegister - 1); return }
            handleClose()
          }}
        />
        <div className="flex flex-col items-center justify-center gap-4 w-full h-[85%] md:h-[60%] px-10 md:px-0 sm:w-3/4 md:w-2/3 relative md:col-span-3 md:col-start-1 md:row-start-1 z-10">
          <div className="flex w-full md:w-2/3 h-[calc(100%-100px)] flex-col items-center">
            <div className="flex flex-col items-center justify-center transform w-full max-h-[124px] px-4">
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
}

export default PageLogin
