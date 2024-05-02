import { router, useRouter } from "next/router";
import { ButtonClose } from "../components/Forms/ButtonClose";
import { Login, Register, ResetPass } from "../components/Forms/Login/Forms";
import { useEffect, useState } from "react";
import { useMounted } from "../hooks/useMounted";
import { AuthContextProvider, LoadingContextProvider } from "../context";
import { ArrowLeft } from "../components/icons";

const PageLogin = () => {
  const { config, user, linkMedia, preregister } = AuthContextProvider()
  const { setLoading } = LoadingContextProvider()
  const { query } = useRouter()
  const [stage, setStage] = useState((["tiktok"].includes(linkMedia) ? "register" : null) || query?.q || "login");
  const [stageRegister, setStageRegister] = useState(0)
  const [whoYouAre, setWhoYouAre] = useState("");
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      setTimeout(() => {
        setLoading(false)
      }, 800);
    }
    return () => {
      if (isMounted) {
        setIsMounted(false)
        setLoading(true)
      }
    }
  }, [isMounted])

  useEffect(() => {
    console.log(10000492, linkMedia)
  }, [])

  useEffect(() => {
    setStageRegister(!preregister ? 0 : 1)
  }, [])
  const Stages = {
    login: <Login setStage={setStage} whoYouAre={whoYouAre} setWhoYouAre={setWhoYouAre} />,
    register: <Register setStage={setStage} stageRegister={stageRegister} setStageRegister={setStageRegister} whoYouAre={whoYouAre} setWhoYouAre={setWhoYouAre} />,
    resetPassword: <ResetPass setStage={setStage} whoYouAre={whoYouAre} />,
  };

  const handleClose = () => {
    setTimeout(() => {
      router.push(!query?.d ? "/" : query?.d)
    }, 100);
  }
  if (user && user?.displayName !== "guest") {
    router.push("/")
  } else {
    return (
      config?.development !== "bodasdehoy" && (
        <>
          <div className="w-screen fixed h-full top-0 left-0 md:grid z-30 grid-cols-5 font-display">
            <ArrowLeft className={`${(["vivetuboda"].includes(config?.development) && (stage === "login" || (stage === "register" && stageRegister === 0))) && "hidden"} absolute w-6 h-6 z-[10] text-gray-500 cursor-pointer translate-x-5 translate-y-5`} onClick={() => {
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
              {!["vivetuboda"].includes(config?.development) && < ButtonClose onClick={handleClose} />}
              <div className="flex flex-col items-center gap-4 w-full h-[85%]  md:h-[60,l%] px-10 md:px-0 sm:w-3/4 md:w-2/3">
                <div className="flex w-full md:w-2/3 h-[calc(100%-100px)] flex-col">
                  <div className={`flex flex-col items-center justify-center transform ${config?.name == "vivetuboda" ? "scale-[110%]" : "scale-[150%]"}`}>
                    {config?.logoDirectory}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
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