import { t } from "i18next";
import { useEffect, useState } from "react";
import { Form, Formik } from "formik";
import InputField from "../Forms/InputField";
import { useRouter } from "next/router";
import { PiXBold } from "react-icons/pi";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { estimate } from "../../utils/Interfaces";
import { useToast } from "../../hooks/useToast";


export const ModalTaskList = ({ setModal, event, categoria, gasto, setEvent }) => {
    const toast = useToast()
    const router = useRouter();
    const initialValues = {
        url: "",
    };
    const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex((item) => item._id == categoria?._id);
    const f2 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == gasto?._id);
    const arrayTask = event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].linkTask
    const handleSubmit = async (values) => {
        try {
            const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex((item) => item._id == categoria?._id);
            const f2 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == gasto?._id);
            event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2].linkTask.push(values.url)

            await fetchApiEventos({
                query: queries.editGasto,
                variables: {
                    evento_id: event?._id,
                    categoria_id: categoria?._id,
                    gasto_id: gasto?._id,
                    variable_reemplazar: "linkTask",
                    valor_reemplazar: JSON.stringify(arrayTask)
                }
            })
            setEvent({ ...event })
            toast("success", t("success"))
        } catch (error) {
            console.log(error)
        }
    };

    const handleDeleteLink = async (values) => {
        try {
            const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex((item) => item._id == categoria?._id);
            const f2 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == gasto?._id);
            event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2].linkTask.splice(values, 1)

            await fetchApiEventos({
                query: queries.editGasto,
                variables: {
                    evento_id: event?._id,
                    categoria_id: categoria?._id,
                    gasto_id: gasto?._id,
                    variable_reemplazar: "linkTask",
                    valor_reemplazar: JSON.stringify(arrayTask)
                }
            })
                setEvent({ ...event })
                toast("success", t("success"))
        } catch (error) {
            console.log(error)
        }
        
       /*  .then((result: estimate) => {
            const f1 = result?.categorias_array.findIndex((item) => item._id == categoria?._id);
            const f2 = result?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == gasto?._id);
            const dataRelult = result?.categorias_array[f1]?.gastos_array[f2]
            setEvent((old) => {
                const f1 = old?.presupuesto_objeto?.categorias_array.findIndex((item) => item._id == categoria?._id);
                const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == gasto?._id);
                old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].linkTask = dataRelult?.linkTask
                return { ...old, }
            })
          
        }).catch((error) => {
            console.log(error);
        }) */
    };

console.log("arraytask", arrayTask)


return (
    <div className="w-[400px] bg-white rounded-xl shadow-md absolute z-50 right-6 ">
        <div className="flex items-center justify-between border-b border-gray-300 pb-2 p-4">
            <h2 className="text-lg font-semibold capitalize text-gray-700">Enlazar Servicios</h2>
            <button className="text-gray-500" onClick={() => { setModal(false) }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 3.293a1 1 0 0 1 1.414 0L10 8.586l5.293-5.293a1 1 0 1 1 1.414 1.414L11.414 10l5.293 5.293a1 1 0 1 1-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L8.586 10 3.293 4.707a1 1 0 0 1 0-1.414z" />
                </svg>
            </button>
        </div>
        <div className=" px-3 py-2">
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                <Form className="text-gray-200 flex  items-center justify-center gap-4 w-full ">
                    <span className="w-full text-black  ">
                        <InputField
                            label="Link del servicio"
                            name="url"
                            type="string"
                        />
                    </span>
                    <button className="bg-primary text-white rounded-md py-2 px-2 mt-[20px]">
                        Agregar
                    </button>
                </Form>
            </Formik>
        </div>
        <div className=" mx-2 ">
            Lista de Links
            <div className="bg-gray-100 mx-3 my-2 p-2 rounded-md h-20 md:h-36 overflow-y-auto flex flex-col items-center ">

                {
                    arrayTask?.map((item, idx) => {
                        return (
                            <div key={idx} className="flex items-center justify-between w-full py-2">
                                <div onClick={() => router.push(item)} className=" hover:underline cursor-pointer text-azulCorporativo w-[270px] truncate">
                                    {item}
                                </div>
                                <div onClick={() => handleDeleteLink(idx)} className=" cursor-pointer hover:scale-125 transition-all mr-1">
                                    <PiXBold className="w-4 h-4" />
                                </div>
                            </div>
                        )
                    })
                }
                {/* {
                        (gasto?.linkTask != null) ?
                            <>
                                <div onClick={() => router.push(gasto?.linkTask)} className=" hover:underline cursor-pointer text-azulCorporativo w-[270px] truncate">
                                    {gasto?.linkTask}
                                </div>
                                <div onClick={() => handleDeleteLink(null)} className=" cursor-pointer hover:scale-125 transition-all mr-1">
                                    <PiXBold className="w-4 h-4" />
                                </div>
                            </> : null
                    } */}
            </div>
        </div>
        <div className=" text-xs flex justify-end gap-4 border-t border-gray-300 px-4 pb-4 bg-gray-100">
            <button onClick={() => { setModal(false) }} className="bg-gray-400 text-white rounded-md py-2 px-4 mt-4">{t("cancel")}</button>
        </div>
    </div >
)
}
