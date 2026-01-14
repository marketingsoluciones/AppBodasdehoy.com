import { useRouter, useSearchParams } from "next/navigation";
import { ButtonClose } from "../components/Forms/ButtonClose";
import { Login, Register, ResetPass } from "../components/Forms/Login/Forms";
import { useEffect, useState } from "react";
import { useMounted } from "../hooks/useMounted";
import { AuthContextProvider, LoadingContextProvider } from "../context";
import { ArrowLeft } from "../components/icons";

const PageLogin = () => {
  const { config, user, linkMedia, preregister } = AuthContextProvider()
  const { setLoading } = LoadingContextProvider()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Query params usando useSearchParams (Next.js 15)
  const queryQ = searchParams.get("q")
  const queryD = searchParams.get("d")

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
        }, 1000);
      }
    }
    return () => {
      if (isMounted) {
        setIsMounted(false)
        setLoading(true)
      }
    }
  }, [isMounted])

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
      router.push(!queryD ? "/111" : queryD)
    }, 100);
  }
  if (user && user?.displayName !== "guest") {
    router.push(!queryD ? "/" : queryD)
  } else {
    return (
      config?.development !== "bodasdehoy" && (
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
            <div className="bg-white w-full h-full col-span-3 relative flex items-center justify-center  ">
              {["bodasdehoy"].includes(config?.development) && < ButtonClose onClick={handleClose} />}
              <div className="flex flex-col items-center justify-center gap-4 w-full h-[85%]  md:h-[60,l%] px-10 md:px-0 sm:w-3/4 md:w-2/3 relative">
                <div className="flex w-full md:w-2/3 h-[calc(100%-100px)] flex-col items-center">
                  <div className={`flex flex-col items-center justify-center transform w-full max-h-[124px] px-4`}>
                    {config?.logoDirectory}
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    {Stages[stage]}
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:block banner w-full h-full col-span-2 " />
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