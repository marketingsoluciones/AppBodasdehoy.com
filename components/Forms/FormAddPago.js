import { Formik } from "formik";
import { useEffect, useState } from "react";
import { EventContextProvider } from "../../context/";
import { CheckIcon, DiamanteIcon } from "../icons";
import InputField from "./InputField";
import { GoFileDiff } from "react-icons/go";
import { useToast } from "../../hooks/useToast";
import { getCurrency } from "../../utils/Funciones";
import { GoChevronDown } from "react-icons/go";
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

const validacion2 = (values) => {
  let errors = {}
  if (!values.importe) {
    errors.importe = "Importe requerido"
  }
  if (!values.fechaPago) {
    errors.fechaPago = "Selecciona una fecha"
  }
  return errors
}

const FormAddPago = ({ GastoID, cate, setGastoID }) => {
  const { event, setEvent } = EventContextProvider()
  const [ischecked, setCheck] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()
  const { t } = useTranslation();

  const checkbox = {
    true: "pagado",
    false: "pendiente"
  }

  const Categoria = event?.presupuesto_objeto?.categorias_array?.find(item => item?._id == cate).nombre
  const idxCate = event?.presupuesto_objeto?.categorias_array?.findIndex(item => item?._id == cate)
  const Proveedor = event?.presupuesto_objeto?.categorias_array[idxCate]?.gastos_array?.find(item => item?._id == GastoID)

  const initialValues = {
    importe: "",
    pagado: "",
    fechaPago: "",
    fechaVencimiento: "",
    pagado_por: "",
    medio_pago: "",
    concepto: "",
    file: "",
    soporte: null
  }

  const saveData = async (values) => {
    try {
      const result = await fetchApiEventos({
        query: queries.nuevoPago,
        variables: {
          evento_id: event?._id,
          categoria_id: cate,
          gasto_id: GastoID,
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
      toast("success", t("savedpayment"))
      setEvent(old => {
        const f1 = old?.presupuesto_objeto?.categorias_array?.findIndex(item => item?._id == cate)
        const f2 = old?.presupuesto_objeto?.categorias_array[f1]?.gastos_array?.findIndex(item => item?._id == GastoID)
        old.presupuesto_objeto.pagado = result?.pagado
        old.presupuesto_objeto.categorias_array[f1].pagado = result?.categorias_array[0]?.pagado
        old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].pagado = result?.categorias_array[0]?.gastos_array[0]?.pagado
        old.presupuesto_objeto.categorias_array[f1].gastos_array[f2].pagos_array?.push(result?.categorias_array[0]?.gastos_array[0]?.pagos_array[0])
        setIsSubmitting(false)
        return { ...old }
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={async (values) => {
        try {
          if (!isSubmitting) {
            setIsSubmitting(true)
            if (values.file !== initialValues.file) {
              const formdata = new FormData();
              formdata.append("image", values.file.split("base64,")[1]);
              const requestOptions = {
                method: "POST",
                body: formdata,
                redirect: "follow"
              };
              fetch("https://api.imgbb.com/1/upload?expiration=15552000&key=c6f787e40fd29dac790a3e42d38c5078", requestOptions)
                .then((response) => response.text())
                .then((result) => {
                  const data = JSON.parse(result)?.data
                  values.soporte = {
                    image_url: data?.image?.url,
                    medium_url: data?.medium?.url,
                    thumb_url: data?.thumb?.url,
                    delete_url: data?.delete_url
                  }
                  saveData(values)
                })
                .catch((error) => console.error(error));
              return
            }
            saveData(values)
             setGastoID("")
          }
        } catch (error) {
          console.log(error)
        }
      }}
      validate={ischecked ? validacion : validacion2}
    >
      {(props) => <BasicFormLogin ischecked={ischecked} setCheck={setCheck} Categoria={Categoria} isSubmitting={isSubmitting} Proveedor={Proveedor} props {...props} />}
    </Formik>
  );
}

export default FormAddPago

export const BasicFormLogin = ({ ischecked, setCheck, handleChange, handleSubmit, isSubmitting, values, setValues, Proveedor, Categoria }) => {
  const { event } = EventContextProvider()
  const [showProOptions, setShowProOptions] = useState(true)
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isWeddingPlanner, setIsWeddingPlanner] = useState(false);

  useEffect(() => {
    values.pagado = ischecked
  }, [ischecked])
  useEffect(() => {
    values.pagado = ischecked
  }, [isSubmitting])

  // Efecto para manejar el checkbox del wedding planner
  useEffect(() => {
    if (isWeddingPlanner) {
      values.pagado_por = "wedding planer";
      setValues({ ...values });
    }
  }, [isWeddingPlanner]);

  const handleFileChange = (event) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        values.file = reader.result
        setValues({ ...values })
      };
      reader.readAsDataURL(event.target.files[0]);
      setSelectedFile(event.target.files[0]);
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
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4 w-full bg-white" >
      {/* Header Section - Reducido */}
      <div className="col-span-2 grid grid-cols-6 border-gray-100 pl-2 w-full ">
        <div className="col-span-6 md:col-span-4">
          <div className="flex items-center space-x-1 capitalize text-lg text-gray-500">
            <h2 className="col-span-5 text-xl text-primary truncate">{Categoria}</h2>
            <h2 className="text-sm"> {"//"}</h2>
            <h2 className="truncate text-base">{Proveedor?.nombre}</h2>
          </div>
          <div className="md:col-span-2 w-full flex space-x-2">
            <h2 className="font-display text-lg capitalize text-primary font-light">{t("Add")}</h2>
            <h2 className="font-display text-lg capitalize text-gray-500 font-medium">{t("Payment")}</h2>
          </div>
        </div>
        
        {/* Checkbox Section - Reducido */}
        <div className="self-center col-span-6 md:col-span-2 text-azulCorporativo text-xs md:ml-6 mt-2 md:mt-0">
          <div className="relative flex items-center gap-2 justify-items-center mt-1">
            <input type="checkbox" className="hidden" name="pagado" checked={ischecked} onChange={() => setCheck(!ischecked)} />
            <div onClick={() => setCheck(!ischecked)} className={`w-5 h-5 rounded-md border border-gray-200 transition ${ischecked && "bg-primary border-none"} cursor-pointer`}>
              {ischecked && <CheckIcon className="text-white w-3 h-3" />}
            </div>
            <p className="font-display text-sm font-medium text-gray-500">{t("addpayments")}</p>
          </div>
          <div className="relative flex items-center gap-2 justify-items-center mt-1">
            <input type="checkbox" className="hidden" name="pendiente" onChange={() => setCheck(!ischecked)} />
            <div onClick={() => setCheck(!ischecked)} className={`w-5 h-5 rounded-md border border-gray-200 transition ${!ischecked && "bg-primary border-none"} cursor-pointer`}>
              {!ischecked && <CheckIcon className="text-white w-3 h-3" />}
            </div>
            <p className="font-display text-sm font-medium text-gray-500">{t("addnextpayments")}</p>
          </div>
        </div>
      </div>
      
      {/* Cost Summary Section - Reducido */}
      <div className="flex flex-col md:flex-row justify-center space-y-1 md:space-y-0 md:space-x-4 col-span-2">
        {event?.presupuesto_objeto?.viewEstimates && (
          <div className="text-azulCorporativo text-xs cursor-default select-none">
            <h1 className="text-primary text-sm">{t("estimatedcost")}</h1>
            <div className="border rounded py-1 text-right px-2 text-sm">
              {getCurrency(Proveedor?.coste_estimado)}
            </div>
          </div>
        )}
        <div className="text-azulCorporativo text-xs cursor-default select-none">
          <h1 className="text-primary text-sm">{t("finalcost")}</h1>
          <div className="border rounded py-1 text-right px-2 text-sm">
            {getCurrency(Proveedor?.coste_final)}
          </div>
        </div>
        <div className="text-azulCorporativo text-xs cursor-default select-none">
          <h1 className="text-primary text-sm">{t("paid")}</h1>
          <div className="border rounded py-1 text-right px-2 text-sm">
            {getCurrency(Proveedor?.pagado)}
          </div>
        </div>
      </div>
      
      {/* Form Fields Section - Reducido */}
      {ischecked && (
        <div className="col-span-2 space-y-3">
          <InputField
            name="fechaPago"
            label={`${ischecked ? t("paymentdate") : t("futurepaymentdate")}`}
            onChange={handleChange}
            value={values.fechaPago}
            type="date"
            autoComplete="off" 
            className="text-sm h-9"
          />
          <InputField
            name="importe"
            label={t("amount")}
            onChange={handleChange}
            value={values.importe}
            type="number"
            min="0"
            step="0.10"
            autoComplete="off" 
            className="text-sm h-9"
          />
          <InputField
            name="medio_pago"
            label={t("paymentmethod")}
            disabled={!ischecked}
            className={`text-sm h-9 ${ischecked ? "" : "bg-slate-200"}`}
            onChange={handleChange}
            value={values.medio_pago}
            type="text"
            autoComplete="off" 
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 text-primary">{t("paidby")}</label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wedding-planner-checkbox"
                  checked={isWeddingPlanner}
                  onChange={(e) => handleWeddingPlannerChange(e.target.checked)}
                  disabled={!ischecked}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="wedding-planner-checkbox" className="text-xs text-gray-600 cursor-pointer">
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
              className={`text-sm h-9 ${ischecked ? "" : "bg-slate-200"} ${isWeddingPlanner ? "bg-gray-100 cursor-not-allowed" : ""}`}
              type="text"
              autoComplete="off" 
            />
          </div>
          <InputField
            name="concepto"
            label={t("paymentconcept")}
            onChange={handleChange}
            value={values.concepto}
            type="text"
            autoComplete="off" 
            className="text-sm h-9"
          />
        </div>
      )}
      
      {!ischecked && (
        <div className="col-span-2 space-y-3">
          <InputField
            name="fechaPago"
            label={`${ischecked ? t("paymentdate") : t("futurepaymentdate")}`}
            onChange={handleChange}
            value={values.fechaPago}
            type="date"
            autoComplete="off" 
            className="text-sm h-9"
          />
          <InputField
            name="importe"
            label={t("amount")}
            onChange={handleChange}
            value={values.importe}
            type="number"
            min="0"
            step="0.10"
            autoComplete="off" 
            className="text-sm h-9"
          />
          <InputField
            name="concepto"
            label={t("paymentconcept")}
            onChange={handleChange}
            value={values.concepto}
            type="text"
            autoComplete="off" 
            className="text-sm h-9"
          />
        </div>
      )}
      
      {/* File Upload Section - Reducido */}
      <div className="col-span-2 flex flex-col space-y-2 transition-all duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg text-azulCorporativo">{t("prooptions")}</h2>
          </div>
        </div>
        
        {showProOptions && (
          <div className="space-y-2 transition-all duration-200">
            <div className="h-[140px] flex flex-col space-y-2">
              <h2 className="text-primary text-sm">{t("uploaddocument")}</h2>
              <label htmlFor="file-upload" className="cursor-pointer self-center flex items-center justify-center bg-slate-200 border-dotted border-2 border-slate-600 h-full w-[80%] rounded-md">
                {selectedFile ? (
                  <div className="w-full h-full p-2">
                    {selectedFile.type.startsWith('image/') && (
                      <img src={URL.createObjectURL(selectedFile)} alt="Vista previa" className="w-full h-full object-contain" />
                    )}
                    <p className="text-gray-600 pt-1 text-xs truncate">Archivo: {selectedFile.name}</p>
                  </div>
                ) : (
                  <GoFileDiff className="h-10 w-10 text-gray-400" />
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
          </div>
        )}
      </div>
      
      {/* Submit Button - Reducido */}
      <button 
        disabled={isSubmitting} 
        type="submit" 
        className={`col-span-2 font-display rounded-full mt-4 py-2 px-4 text-white font-medium transition w-full hover:opacity-70 text-sm ${
          isSubmitting ? "bg-secondary" : "bg-primary"
        }`} 
      >
        {isSubmitting ? t("processing") || "Procesando..." : t("addpayment")}
      </button>
    </form>
  )
}