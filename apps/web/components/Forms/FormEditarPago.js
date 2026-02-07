import { Formik } from "formik";
import { useEffect, useState } from "react";
import { GoFileDiff } from "react-icons/go";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { CheckIcon } from "../icons";
import InputField from "./InputField";
import { useToast } from "../../hooks/useToast";
import { getCurrency } from "../../utils/Funciones";
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, queries } from "../../utils/Fetching";



const validacion = (values) => {
  let errors = {}
  if (!values.importe) {
    errors.importe = "Importe requerido"
  }
  if (!values.fechaPago) {
    errors.fechaPago = "Selecciona una fecha"
  }
  if (!values.pagado_por) {
    errors.pagado_por = "Favor indicar quien paga"
  }
  if (!values.medio_pago) {
    errors.medio_pago = "Modo de pago requerido"
  }
  return errors
}


const FormEditarPago = ({ ListaPagos, IDPagoAModificar, IDs, set, state, categorias, getId, }) => {
  const { event, setEvent } = EventContextProvider()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pago, setPago] = useState(ListaPagos?.find(item => item._id == IDPagoAModificar))
  const toast = useToast()
  const { t } = useTranslation()
  const [isLoadingImage, setIsLoadingImage] = useState(false); // Nuevo estado

  console.log("pego", pago)


  useEffect(() => {
    setPago(ListaPagos?.find(item => item._id == IDPagoAModificar))
  }, [IDPagoAModificar])

  useEffect(() => {
    if (IDs) {
      setPago(old => ({ ...old, ...IDs }))
    }
  }, [IDs])

  const checkbox = {
    true: "pagado",
    false: "pendiente",
    pagado: true,
    pendiente: false
  }

  const initialValues = {
    importe: pago?.importe,
    pagado: checkbox[pago?.estado],
    fechaPago: pago?.fecha_pago,
    fechaVencimiento: pago?.fecha_vencimiento,
    pagado_por: pago?.pagado_por,
    medio_pago: pago?.medio_pago,
    concepto: pago?.concepto,
    file: pago?.soporte
  }

  const saveData = async (values) => {
    try {
      await fetchApiEventos({
        query: queries.editPago,
        variables: {
          evento_id: event?._id,
          categoria_id: pago?.idCategoria,
          gasto_id: pago?.idGasto,
          pago_id: IDPagoAModificar,
          pagos_array: {
            importe: values.importe,
            estado: checkbox[values.pagado],
            fecha_pago: values.fechaPago,
            fecha_vencimiento: values.fechaVencimiento,
            pagado_por: values.pagado_por,
            medio_pago: values.medio_pago,
            concepto: values.concepto,
            soporte: values?.soporte
          }
        }
      })
      const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex(item => item._id == pago?.idCategoria)
      const f2 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array?.findIndex(item => item._id == pago?.idGasto)
      const f3 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.pagos_array?.findIndex(item => item._id == IDPagoAModificar)
      event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].pagos_array[f3] = { ...event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2].pagos_array[f3], ...values }
      toast("success", t("savedpayment"))
      setEvent({ ...event })
      set(!state)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={async (values) => {
        try {
          setIsLoadingImage(true)

          if (!isSubmitting) {
            setIsSubmitting(true)
            
            // Verificar si hay un archivo nuevo (base64 string) para subir
            if (values.file && typeof values.file === "string" && values.file.startsWith("data:")) {
              const formdata = new FormData();
              formdata.append("image", values.file.split("base64,")[1]);
              const requestOptions = {
                method: "POST",
                body: formdata,
                redirect: "follow"
              };
              
              try {
                const response = await fetch("https://api.imgbb.com/1/upload?expiration=15552000&key=c6f787e40fd29dac790a3e42d38c5078", requestOptions);
                const result = await response.text();
                const data = JSON.parse(result)?.data;
                
                values.soporte = {
                  image_url: data?.image?.url,
                  medium_url: data?.medium?.url,
                  thumb_url: data?.thumb?.url,
                  delete_url: data?.delete_url
                };
                
                saveData(values);
              } catch (uploadError) {
                console.error("Error uploading image:", uploadError);
                toast("error", "Error al subir la imagen");
                setIsLoadingImage(false);
                setIsSubmitting(false);
                return;
              }
            } else {
              // Si no hay archivo nuevo, usar el archivo existente o null
              if (values.file === "") {
                // Si se eliminó explícitamente el archivo
                values.soporte = null;
              } else if (values.file && typeof values.file === "object") {
                // Si es un archivo existente, usar sus datos
                values.soporte = values.file;
              }
              
              saveData(values);
            }
            
            setIsLoadingImage(false);
          }
        } catch (error) {
          console.log(error);
          setIsLoadingImage(false);
          setIsSubmitting(false);
        }
      }}
      validate={validacion}
    >
      {(props) => <BasicFormLogin getId={getId} categorias={categorias} isLoadingImage={isLoadingImage} pago={pago} {...props} />}
    </Formik>
  );
}

export default FormEditarPago


export const BasicFormLogin = ({
  handleChange,
  handleSubmit,
  isSubmitting,
  values,
  setValues,
  categorias,
  getId,
  isLoadingImage,
  pago
}) => {

  console.log("categoria", categorias)

  const { event } = EventContextProvider()
  const { config } = AuthContextProvider()
  const [ischecked, setCheck] = useState(values.pagado)
  const { currency } = AuthContextProvider()
  const [showProOptions, setShowProOptions] = useState(true)
  const Categoria = event?.presupuesto_objeto?.categorias_array?.find(item => item?._id == pago.idCategoria)?.nombre
  const idxCate = event?.presupuesto_objeto?.categorias_array?.findIndex(item => item?._id == pago.idCategoria)
  const Proveedor = event?.presupuesto_objeto?.categorias_array[idxCate]?.gastos_array?.find(item => item?._id == getId)
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isWeddingPlanner, setIsWeddingPlanner] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(
    values.file && typeof values.file === "string" && values.file.startsWith("data:")
      ? values.file
      : (values.file?.image_url || values.file || null)
  );

  useEffect(() => {
    values.pagado = ischecked
  }, [ischecked])

  // Efecto para manejar el checkbox del wedding planner
  useEffect(() => {
    if (isWeddingPlanner) {
      values.pagado_por = "wedding planer";
      setValues({ ...values });
    }
  }, [isWeddingPlanner]);

  // Efecto para inicializar el estado del wedding planner si el valor ya es "wedding planer"
  useEffect(() => {
    if (values.pagado_por === "wedding planer") {
      setIsWeddingPlanner(true);
    }
  }, [values.pagado_por]);

  useEffect(() => {
    if (!selectedFile) {
      if (values.file && typeof values.file === "string" && values.file.startsWith("data:")) {
        setPreviewUrl(values.file);
      } else if (values.file?.image_url) {
        setPreviewUrl(values.file.image_url);
      } else if (values.file && typeof values.file === "string") {
        setPreviewUrl(values.file);
      } else if (values.soporte?.image_url) {
        setPreviewUrl(values.soporte.image_url);
      }
    }
  }, [values.file, values.soporte, selectedFile]);

  const handleFileChange = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        values.file = reader.result;
        setValues({ ...values });
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setSelectedFile(file);
    } catch (error) {
      console.log(error)
    }
  };

  const handleWeddingPlannerChange = (checked) => {
    setIsWeddingPlanner(checked);
    if (!checked) {
      values.pagado_por = "";
      setValues({ ...values });
    }
  };



  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 pt-6 w-full " >
        <div className="col-span-2 grid grid-cols-6 border-gray-100 pl-3 w-full ">
          <div className="col-span-6  md:col-span-4">
            <div className="flex items-center space-x-1 capitalize text-gray-500">
              <h2 className="font-display text-2xl capitalize text-gray-500 font-medium">Categoria //</h2>
              <h2 className="col-sapn-5 text-xl text-primary truncate">{Categoria}</h2>
            </div>
            <div className="flex items-center space-x-1 capitalize text-gray-500">
              <h2 className="font-display text-2xl capitalize text-gray-500 font-medium">Partida //</h2>
              <h2 className="truncate text-xl text-primary">{Proveedor?.nombre}</h2>
            </div>
            <div className=" md:col-span-2 w-full flex space-x-2 ">
              <h2 className="font-display capitalize text-primary font-light">{t("add")}</h2>
              <h2 className="font-display capitalize text-gray-500 font-medium">{t("payments")}</h2>
            </div>
          </div>

          <div className="self-center col-span-6 md:col-span-2 text-azulCorporativo text-[13px] md:ml-10 mt-3 md:mt-0">
            <div className="relative flex items-center gap-2 justify-items-center mt-2">
              <input type="checkbox" className="hidden" name="pagado" checked={ischecked} onChange={() => setCheck(!ischecked)} />
              <div onClick={() => setCheck(!ischecked)} className={`w-6 h-6 rounded-md border border-gray-200 transition ${ischecked && "bg-primary border-none"} cursor-pointer`}>
                {ischecked && <CheckIcon className="text-white " />}
              </div>
              <p className="font-display text-md font-medium text-gray-500">{t("addpayments")}</p>
            </div>
            <div className="relative flex items-center gap-2 justify-items-center mt-2">
              <input type="checkbox" className="hidden" name="pendiente" onChange={() => setCheck(!ischecked)} />
              <div onClick={() => setCheck(!ischecked)} className={`w-6 h-6 rounded-md border border-gray-200 transition ${!ischecked && "bg-primary border-none"} cursor-pointer`}>
                {!ischecked && <CheckIcon className="text-white " />}
              </div>
              <p className="font-display text-md font-medium text-gray-500">{t("addexpiration")}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center space-y-1 md:space-y-0  md:space-x-7  col-span-2">
          <div className="text-azulCorporativo text-[14px] cursor-default select-none">
            <h1 className="text-primary">{t("estimatedcost")}</h1>
            <div className="border rounded-lg py-0.5  text-right px-2">
              {getCurrency(
                Proveedor?.coste_estimado,
                currency
              )}

            </div>
          </div>
          <div className="text-azulCorporativo text-[14px] cursor-default select-none">
            <h1 className="text-primary">{t("finalcost")}</h1>
            <div className="border rounded-lg py-0.5  text-right px-2">
              {getCurrency(
                Proveedor?.coste_final,
                currency
              )}
            </div>
          </div>
          <div className="text-azulCorporativo text-[14px] cursor-default select-none">
            <h1 className="text-primary">{t("paid")}</h1>
            <div className="border rounded-lg py-0.5  text-right px-2">
              {getCurrency(
                Proveedor?.pagado,
                currency
              )}
            </div>
          </div>
        </div>

        {
          ischecked && (
            <div className="col-span-2 space-y-5">
              <InputField
                name="fechaPago"
                label={`${ischecked ? t("paymentdate") : t("futurepaymentdate")}`}
                onChange={handleChange}
                value={values.fechaPago}
                type="date"
                autoComplete="off" />

              <InputField
                name="importe"
                label={t("amount")}
                onChange={handleChange}
                value={values.importe}
                type="number"
                min="0"
                step="0.10"
                autoComplete="off" />
              <InputField
                name="medio_pago"
                label={t("paymentmethod")}
                disabled={!ischecked}
                className={`${ischecked ? "" : "bg-slate-200"}`}
                onChange={handleChange}
                value={values.medio_pago}
                type="text"
                autoComplete="off" />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 text-primary">{t("paidby")}</label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="wedding-planner-checkbox-edit"
                      checked={isWeddingPlanner}
                      onChange={(e) => handleWeddingPlannerChange(e.target.checked)}
                      disabled={!ischecked}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor="wedding-planner-checkbox-edit" className="text-xs text-gray-600 cursor-pointer">
                      Wedding Planner
                    </label>
                  </div>
                </div>
                <InputField
                  name="pagado_por"
                  label=""
                  onChange={handleChange}
                  value={values.pagado_por}
                  disabled={!ischecked || isWeddingPlanner}
                  className={`${ischecked ? "" : "bg-slate-200"} ${isWeddingPlanner ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  type="text"
                  autoComplete="off" />
              </div>
              <InputField
                name="concepto"
                label={t("paymentconcept")}
                onChange={handleChange}
                value={values.concepto}
                type="text"
                autoComplete="off" />
            </div>
          )
        }
        {
          !ischecked && (
            <div className="col-span-2 space-y-5">
              <InputField
                name="fechaPago"
                label={`${ischecked ? t("paymentdate") : t("futurepaymentdate")}`}
                onChange={handleChange}
                value={values.fechaPago}
                type="date"
                autoComplete="off" />

              <InputField
                name="importe"
                label={t("amount")}
                onChange={handleChange}
                value={values.importe}
                type="number"
                min="0"
                step="0.10"
                autoComplete="off" />

              <InputField
                name="concepto"
                label={t("paymentconcept")}
                onChange={handleChange}
                value={values.concepto}
                type="text"
                autoComplete="off" />
            </div>
          )
        }

        <div className=" relative col-span-2 h-[400px]* flex flex-col space-y-2 transition-all duration-500 ">
          <div className="flex  items-center justify-between">
            <div className="flex  items-center space-x-2  decoration-azulCorporativo ">
              <h2 className="text-2xl text-azulCorporativo">{t("prooptions")}</h2>
              <div className="text-yellow-200 h-auto w-5"></div>
            </div>
          </div>
          {
            showProOptions ?
              <div className={`space-y-2 transition-all duration-200`}>
                <div className="h-[200px] flex flex-col space-y-2 ">
                  <h2 className="text-primary text-[14px]"> {t("uploaddocument")}</h2>
                  <label htmlFor="file-upload" className="cursor-pointer self-center flex items-center justify-center bg-slate-200  border-dotted border-2 border-slate-600 h-48 w-[80%] rounded-md ">
                    {(
                      isLoadingImage ? <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 opacity-100"></div> :
                        typeof previewUrl === "string" ?
                          <div className="w-full h-full">
                            <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              className="text-xs text-red-500 underline mt-1"
                              onClick={e => {
                                e.stopPropagation();
                                setPreviewUrl(null);
                                setSelectedFile(null);
                                values.file = "";
                                setValues({ ...values });
                              }}
                            >
                              {t("removeimage") || "Eliminar imagen"}
                            </button>
                          </div>
                          : <GoFileDiff className="h-14 w-14 text-gray-400" />
                    )}
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    id="file-upload"
                    name="file"
                    className="hidden"
                  />
                </div>
              </div> :
              null
          }
        </div>
        <button disabled={isSubmitting} type="submit" className={`col-span-2 font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"
          }`} >{t("save")}</button>
      </form>

      <style jsx>
        {`
                    .loader {
                        border-top-color:  ${config?.theme?.primaryColor};
                        -webkit-animation: spinner 1.5s linear infinite;
                        animation: spinner 1.5s linear infinite;
                    }

                    @-webkit-keyframes spinner {
                        0% {
                        -webkit-transform: rotate(0deg);
                        }
                        100% {
                        -webkit-transform: rotate(360deg);
                        }
                    }

                    @keyframes spinner {
                        0% {
                        transform: rotate(0deg);
                        }
                        100% {
                        transform: rotate(360deg);
                        }
                    }
                `}
      </style>
    </>
  )
}
