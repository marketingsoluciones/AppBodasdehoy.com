import { DescripcionComponente } from "../components/ConfirmarAsistencia/Descripcion"
import { FormComponent } from "../components/Forms/FormAcompañantes"
/* import {  LogoOrganizador } from "../components/icons" */


const ConfirmaAsistencia = () => {
    return (
        <>
            <div className="grid md:grid-cols-2 md:px-10 px-5 py-10 bg-base h-full">
                <div className="flex flex-col mb-7 md:mb-0   ">
                    <DescripcionComponente />
                    <div className="text-gray-400 mt-10 md:block hidden">
                        {/* <LogoOrganizador /> */}
                    </div>
                </div>
                <div className="">
                    <FormComponent />
                </div>
            </div>
        </>
    )
}

export default ConfirmaAsistencia