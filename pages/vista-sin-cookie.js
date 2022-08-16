import FormLogin from "../components/Forms/FormLogin";
import { LogoNuevoBodasBlanco } from "../components/icons";
import Link from "next/link";

const VistaSinCookie = () => {
  return (
    <>
      <div className="h-screen w-screen float-right text-gray-500 font-display">
        <div className="mx-auto w-1/2 mt-40">
          <div className="pb-6 w-1/2 mx-auto ">
            <h2 className="w-full text-2xl font-bold font-display text-center pb-3">Te invito a iniciar sesion en </h2>
            <samp className="flex justify-center">
              <Link href={`${process.env.NEXT_PUBLIC_DIRECTORY}/login?d=app` ?? ""} passHref>
                <LogoNuevoBodasBlanco className="text-primary cursor-pointer" />
              </Link>
            </samp>
            <p className=" pt-3 text-sm  text-center">
              Para poder utilizar la aplicación y organizar el evento de tus sueños
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default VistaSinCookie