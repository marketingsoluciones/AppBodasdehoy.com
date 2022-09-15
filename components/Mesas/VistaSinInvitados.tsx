
import { LogoNuevoBodasBlanco } from "../icons";
import Link from "next/link";

const VistaSinInvitados = () => {
  return (
    <>
      <div className=" relative text-gray-500 font-display">
        <div className="  absolute md:pl-60 ">
          <div className="  ">            
            {/* <Link href={`${process.env.NEXT_PUBLIC_DIRECTORY}/login?d=app` ?? ""} passHref > */}
              <samp className="">

                <LogoNuevoBodasBlanco className="text-primary pl-28 md:pl-0 mr-0" />

              </samp>
           {/*  </Link> */}
            <p className="px-20 md:px-0 pt-3 md:text-sm  text-center">
              Para poder utilizar el organizador de mezas
            </p>
            <p className="px-20 md:px-0 pt-3 md:text-sm  text-center">
                debes tener invitados 
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default VistaSinInvitados