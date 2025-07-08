import { t } from "i18next";
import { Form, Formik } from "formik";
import InputField from "../Forms/InputField";
import { useRouter } from "next/router";
import { PiXBold } from "react-icons/pi";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import * as Yup from "yup";

export const ModalTaskList = ({ setModal, event, categoria, gasto, setEvent }) => {
    const toast = useToast()
    const router = useRouter();
    
    const initialValues = {
        url: "",
    };
    
    const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex((item) => item._id == categoria);
    const f2 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == gasto);
    const arrayTask = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.linkTask || [];
    
    // Obtener el nombre del gasto para mostrar en el header
    const gastoNombre = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.nombre || "Gasto";
    
    const validationSchema = Yup.object({
        url: Yup.string()
            .url("Por favor, ingresa una URL válida")
            .matches(/^https?:\/\/.+\..+/, "La URL debe comenzar con http:// o https:// y contener un dominio")
            .required("Requerido"),
    });
    
    const handleSubmit = async (values, { resetForm, setSubmitting }) => {
        try {
            setSubmitting(true);
            
            if (!event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.linkTask) {
                event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].linkTask = []
            }
            
            event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2].linkTask.push(values.url)
            
            await fetchApiEventos({
                query: queries.editGasto,
                variables: {
                    evento_id: event?._id,
                    categoria_id: categoria,
                    gasto_id: gasto,
                    variable_reemplazar: "linkTask",
                    valor_reemplazar: JSON.stringify(event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.linkTask)
                }
            })
            
            setEvent({ ...event })
            toast("success", t("successful"))
            resetForm()
        } catch (error) {
            console.error("Error al agregar enlace:", error)
            toast("error", "Error al agregar el enlace")
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLink = async (index) => {
        try {
            if (!event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.linkTask) {
                return;
            }
            
            const updatedLinks = [...event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].linkTask];
            updatedLinks.splice(index, 1);
            
            event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].linkTask = updatedLinks;

            await fetchApiEventos({
                query: queries.editGasto,
                variables: {
                    evento_id: event?._id,
                    categoria_id: categoria,
                    gasto_id: gasto,
                    variable_reemplazar: "linkTask",
                    valor_reemplazar: JSON.stringify(updatedLinks)
                }
            })
            
            setEvent({ ...event })
            toast("success", "Enlace eliminado correctamente")
        } catch (error) {
            console.error("Error al eliminar enlace:", error)
            toast("error", "Error al eliminar el enlace")
        }
    };

    return (
        <div className="w-[320px] bg-white rounded-lg shadow-xl border border-gray-200 absolute z-50 left-5 top-16">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 bg-gray-50 rounded-t-lg">
                <div>
                    <h2 className="text-sm font-semibold text-gray-700">Enlaces de Servicio</h2>
                    <p className="text-xs text-gray-500 truncate max-w-[240px]" title={gastoNombre}>
                        {gastoNombre}
                    </p>
                </div>
                <button 
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-200 flex-shrink-0" 
                    onClick={() => setModal({ crear: false })}
                >
                    <PiXBold className="w-3 h-3" />
                </button>
            </div>

            {/* Form Section */}
            <div className="px-3 py-2 border-b border-gray-100">
                <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={validationSchema}>
                    {({ isSubmitting }) => (
                        <Form className="space-y-2">
                            <div className="space-y-1 pb-2">
                                <label className="text-xs font-medium text-gray-700 block">
                                    Link del servicio
                                </label>
                                <InputField
                                    name="url"
                                    type="url"
                                    placeholder="https://ejemplo.com"
                                    className="text-xs h-8 border-gray-300 focus:border-gray-400 focus:ring-none"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-xs py-1.5 px-3 transition-colors font-medium"
                            >
                                {isSubmitting ? "Agregando..." : "Agregar Enlace"}
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>

            {/* Links List Section */}
            <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-700">Enlaces Guardados</h3>
                    {arrayTask?.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {arrayTask.length}
                        </span>
                    )}
                </div>
                
                <div className="bg-gray-50 rounded border max-h-24 overflow-y-auto">
                    {arrayTask && arrayTask.length > 0 ? (
                        <div className="space-y-1 p-2">
                            {arrayTask.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded border border-gray-200 p-2 group hover:bg-gray-50 transition-colors">
                                    <div 
                                        onClick={() => router.push(item)} 
                                        className="flex-1 hover:underline cursor-pointer text-blue-600 text-xs truncate mr-2"
                                        title={item}
                                    >
                                        {item.length > 35 ? `${item.substring(0, 35)}...` : item}
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteLink(idx)} 
                                        className="opacity-0 group-hover:opacity-100 cursor-pointer hover:bg-red-100 p-1 rounded transition-all text-red-500 hover:text-red-700"
                                        title="Eliminar enlace"
                                    >
                                        <PiXBold className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 text-center">
                            <p className="text-xs text-gray-500 italic">No hay enlaces guardados</p>
                            <p className="text-xs text-gray-400 mt-1">Agrega el primer enlace arriba</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-3 py-2 bg-gray-50 rounded-b-lg">
                <button 
                    onClick={() => setModal({ crear: false })} 
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-3 py-1 transition-colors"
                >
                    {t("cancel")}
                </button>
            </div>
        </div>
    )
}