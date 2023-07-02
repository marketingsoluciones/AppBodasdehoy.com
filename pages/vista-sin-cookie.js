import FormLogin from "../components/Forms/FormLogin";
import { LogoNuevoBodasBlanco } from "../components/icons";
import Link from "next/link";
import { AuthContextProvider } from "../context";

const VistaSinCookie = () => {
  const { config } = AuthContextProvider()
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
      <style jsx>
        {`
              .section {
                width: 100vw;
                height: calc(100vh - 144px - 32px);
              }
            `}
      </style>
    </>
  );
}

export default VistaSinCookie