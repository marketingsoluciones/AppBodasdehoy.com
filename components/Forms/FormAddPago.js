// importaciones librerias
import { Formik } from "formik";
import { useEffect, useState } from "react";
import { api } from "../../api";
import { AuthContextProvider, EventContextProvider } from "../../context/";
import { CheckIcon, DiamanteIcon, IconLightBulb16 } from "../icons";
import InputField from "./InputField";
import { GoFileDiff } from "react-icons/go";
import { useToast } from "../../hooks/useToast";
import { getCurrency } from "../../utils/Funciones";
import { GoChevronDown } from "react-icons/go";
import { useTranslation } from 'react-i18next';


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

const FormAddPago = ({ GastoID, cate }) => {
  const { event, setEvent } = EventContextProvider()
  const [ischecked, setCheck] = useState(true)
  const toast = useToast()
  const { t } = useTranslation();

  const checkbox = {
    true: "pagado",
    false: "pendiente"
  }

  const Categoria = event?.presupuesto_objeto?.categorias_array?.find(item => item?._id == cate).nombre
  const idxCate = event?.presupuesto_objeto?.categorias_array?.findIndex(item => item?._id == cate)
  const Proveedor = event?.presupuesto_objeto?.categorias_array[idxCate]?.gastos_array?.find(item => item?._id == GastoID)


  return (
    <Formik
      initialValues={{
        importe: "",
        pagado: "",
        fechaPago: "",
        fechaVencimiento: "",
        pagado_por: "",
        medio_pago: "",
        concepto: "",

      }}

      onSubmit={async (values) => {
        let res;
        const params = {
          query: `mutation{
                nuevoPago(evento_id:"${event?._id}", categoria_id:"${cate}", gasto_id: "${GastoID}",pagos_array:{
                  importe : ${values.importe},
                  estado  : "${checkbox[values.pagado]}",
                  fecha_pago : "${values.fechaPago}" ,
                  fecha_vencimiento : "${values.fechaVencimiento}",
                  pagado_por: "${values.pagado_por}"
                  medio_pago : "${values.medio_pago}"
                  concepto:"${values.concepto}"
                }){
                  pagado
                  categorias_array{
                    pagado
                    gastos_array{
                      pagado
                      pagos_array{
                        _id
                        estado
                        fecha_creacion
                        fecha_pago
                        fecha_vencimiento
                        medio_pago
                        importe
                        pagado_por
                        concepto
                      }
                    }
                  }
                }
              }`,
          variables: {},
        }
        try {
          const { data: resp } = await api.ApiApp(params)
          res = resp.data.nuevoPago
          toast("success", t("savedpayment"))
        } catch (error) {
          console.log(error)
        } finally {
          setEvent(old => {
            const idxCate = old?.presupuesto_objeto?.categorias_array?.findIndex(item => item?._id == cate)
            const idxGasto = old?.presupuesto_objeto?.categorias_array[idxCate]?.gastos_array?.findIndex(item => item?._id == GastoID)
            old.presupuesto_objeto.pagado = res?.pagado
            old.presupuesto_objeto.categorias_array[idxCate].pagado = res?.categorias_array[0]?.pagado
            old.presupuesto_objeto.categorias_array[idxCate].gastos_array[idxGasto].pagado = res?.categorias_array[0]?.gastos_array[0]?.pagado
            old.presupuesto_objeto.categorias_array[idxCate].gastos_array[idxGasto].pagos_array?.push(res?.categorias_array[0]?.gastos_array[0]?.pagos_array[0])
            return { ...old }
          })
        }
      }}

      validate={ischecked ? validacion : validacion2}
    >
      {(props) => <BasicFormLogin ischecked={ischecked} setCheck={setCheck} Categoria={Categoria} Proveedor={Proveedor} props {...props} />}
    </Formik>
  );
}

export default FormAddPago


export const BasicFormLogin = ({
  ischecked,
  setCheck,
  handleChange,
  handleSubmit,
  isSubmitting,
  values,
  Proveedor,
  Categoria

}) => {
  const { event } = EventContextProvider()
  const [showProOptions, setShowProOptions] = useState(false)
  const { t } = useTranslation();

  useEffect(() => {
    values.pagado = ischecked
  }, [ischecked])


  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 py-6 w-full h-full* " >

        <div className="col-span-2 grid grid-cols-6 border-gray-100 pl-3 w-full ">
          <div className="col-span-6  md:col-span-4">
            <div className="flex items-center space-x-1 capitalize text-2xl text-gray-500">
              <h2 className="col-sapn-5 text-3xl text-primary truncate">{Categoria}</h2>
              <h2> {"//"}</h2>
              <h2 className="truncate">{Proveedor.nombre}</h2>
            </div>
            <div className=" md:col-span-2 w-full flex space-x-2 ">
              <h2 className="font-display text-2xl capitalize text-primary font-light">{t("Add")}</h2>
              <h2 className="font-display text-2xl capitalize text-gray-500 font-medium">{t("Payment")}</h2>
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
              <p className="font-display text-md font-medium text-gray-500">{t("addnextpayments")}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center space-y-1 md:space-y-0  md:space-x-7  col-span-2">
          <div className="text-azulCorporativo text-[14px] cursor-default select-none">
            <h1 className="text-primary">{t("estimatedcost")}</h1>
            <div className="border rounded-lg py-0.5  text-right px-2">
              {getCurrency(
                Proveedor.coste_estimado,
                event?.presupuesto_objeto?.currency
              )}

            </div>
          </div>
          <div className="text-azulCorporativo text-[14px] cursor-default select-none">
            <h1 className="text-primary">{t("finalcost")}</h1>
            <div className="border rounded-lg py-0.5  text-right px-2">
              {getCurrency(
                Proveedor.coste_final,
                event?.presupuesto_objeto?.currency
              )}
            </div>
          </div>
          <div className="text-azulCorporativo text-[14px] cursor-default select-none">
            <h1 className="text-primary">{t("paid")}</h1>
            <div className="border rounded-lg py-0.5  text-right px-2">
              {getCurrency(
                Proveedor.pagado,
                event?.presupuesto_objeto?.currency
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

              <InputField
                name="pagado_por"
                label={t("paidby")}
                onChange={handleChange}
                value={values.pagado_por}
                disabled={!ischecked}
                className={`${ischecked ? "" : "bg-slate-200"}`}
                type="text"
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

        <div className="col-span-2 h-[400px]* flex flex-col space-y-2 transition-all duration-500 ">
          <div className="flex  items-center justify-between">
            <div className="flex  items-center space-x-2 cursor-pointer hover:underline hover:decoration-1 decoration-azulCorporativo ">
              <h2 className="text-2xl text-azulCorporativo"> {t("prooptions")}</h2>
              <div className="text-yellow-200 h-auto w-5">
                <DiamanteIcon className="h-8 w-8" />
              </div>
            </div>
            <div onClick={() => setShowProOptions(!showProOptions)}>
              <GoChevronDown className={` h-8 w-8 text-azulCorporativo cursor-pointer transition-all ${showProOptions && "rotate-180"}`} />
            </div>
          </div>
          {
            showProOptions ?
              <div className={`space-y-2 transition-all duration-200`}>

                <div className="h-[200px] flex flex-col space-y-2 cursor-not-allowed">
                  <h2 className="text-gray-800 text-[14px]"> {t("uploaddocument")}</h2>
                  <div className=" self-center flex items-center justify-center bg-slate-200  border-dotted border-2 border-slate-600  h-full  w-[80%] rounded-md ">
                    <GoFileDiff className="h-14 w-14 text-gray-400" />
                  </div>
                </div>
                <div className=" flex flex-col space-y-2  ">
                  <h2 className="text-gray-800 text-[14px]">{t("documentnumber")}</h2>
                  <div className="w-[90%] self-center">
                    <InputField
                      name="a"
                      onChange={handleChange}
                      disabled={true}
                      className={`${false ? "" : "bg-slate-200"}`}
                      type="text"
                      autoComplete="off" />
                  </div>
                </div>
                <div className="flex flex-col space-y-2  ">
                  <h2 className="text-gray-800 text-[14px]">{t("contact")}</h2>
                  <div className="w-[90%] self-center">
                    <InputField
                      name="b"
                      onChange={handleChange}
                      disabled={true}
                      className={`${false ? "" : "bg-slate-200"}`}
                      type="text"
                      autoComplete="off" />
                  </div>
                </div>

              </div> :
              null
          }
        </div>

        <button disabled={isSubmitting} type="submit" className={`col-span-2 font-display rounded-full mt-2 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"
          }`} >{t("addpayment")}</button>
      </form>
    </>
  )
}
