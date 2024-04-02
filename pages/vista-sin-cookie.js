import Link from "next/link";
import { AuthContextProvider } from "../context";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const VistaSinCookie = () => {

  const router = useRouter()
  const { config } = AuthContextProvider()
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
    console.log("------------------------------>")
    if (["vivetuboda", "eventosplanificador"].includes(config?.development)) {
      router?.push(`/login`)
    } else {
      return (
        <>
          <div className="float-right text-gray-500 font-display section flex items-center justify-center">
            <Link href={`${process.env.NEXT_PUBLIC_DIRECTORY}/login?d=app` ?? "/"} passHref >
              <div className="flex items-center justify-center h-[calc(100vh-300px)] w-[calc(100vw-10px)] cursor-pointer">
                <div className="md:pb-6 md:w-1/2 mx-auto ">
                  <h2 className="w-full text-2xl font-bold font-display text-center pb-3">Te invito a iniciar sesion en </h2>
                  <samp className="flex justify-center">
                    {config?.logoDirectory}
                  </samp>
                  <p className="px-20 md:px-0 pt-3 md:text-sm  text-center">
                    Para poder utilizar la aplicación y organizar el evento de tus sueños
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </>
      );
    }
  }
}

export default VistaSinCookie