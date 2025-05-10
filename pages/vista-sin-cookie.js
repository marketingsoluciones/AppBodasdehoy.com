import Link from "next/link";
import { AuthContextProvider, LoadingContextProvider } from "../context";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

const VistaSinCookie = () => {
  const { t } = useTranslation();
  const router = useRouter()
  const { config } = AuthContextProvider()
  const { setLoading } = LoadingContextProvider()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      if (isMounted) {
        setIsMounted(false)
      }
    }
  }, [isMounted])
  if (isMounted) {
    // if (config?.development !== "bodasdehoy") {
    if (router.route == "/servicios") {
      router?.push(`/public-card${router?.asPath}`)
    } else (
      router?.push(`/login${router.asPath !== "/" ? `?d=${router.asPath}` : ""}`)
    )


    setLoading(false)
    // } else {
    return (
      <>
        {/* <div className="float-right text-gray-500 font-display section flex items-center justify-center">
          <Link href={`${process.env.NEXT_PUBLIC_DIRECTORY}/login?d=app` ?? "/"} passHref >
            <div className="flex items-center justify-center h-[calc(100vh-300px)] w-[calc(100vw-10px)] cursor-pointer">
              <div className="md:pb-6 md:w-1/2 mx-auto ">
                <h2 className="w-full text-2xl font-bold font-display text-center pb-3">{t("iinviteyoutologinto")}</h2>
                <span className="flex justify-center">
                  {config?.logoDirectory}
                </span>
                <p className="px-20 md:px-0 pt-3 md:text-sm  text-center">
                  {t("Tobeableyourdreams")}
                </p>
              </div>
            </div>
          </Link>
        </div> */}
      </>
    );
    // }
  }
}

export default VistaSinCookie