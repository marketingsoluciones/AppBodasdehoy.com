// importaciones librerias
import { Formik } from "formik";
import { useEffect, useState } from "react";
import { api } from "../../api";
import { EventContextProvider } from "../../context/";
import { CheckIcon } from "../icons";
import InputField from "./InputField";


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
  const [ischecked, setCheck] = useState(false)

  const checkbox = {
    true: "pagado",
    false: "pendiente"
  }

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
      {(props) => <BasicFormLogin ischecked={ischecked} setCheck={setCheck} props {...props} />}
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
}) => {

  useEffect(() => {
    values.pagado = ischecked
  }, [ischecked])


  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 py-6 w-full h-ful " >

        <div className=" grid grid-cols-2 col-span-2 border-gray-100 pl-3 w-full ">
          <div className="col-span-1 border-l-2 border-gray-100 pl-3 w-full  ">
            <h2 className="font-display text-3xl capitalize text-primary font-light">Añadir</h2>
            <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">Pago</h2>
          </div>
          <div className="self-center text-center text-azulCorporativo text-[13px]">
            Marcar la factira como Pagada definira si fue un pago realizado o quieres agendar el pago a futuro
          </div>
        </div>

        <InputField
          name="importe"
          label="Importe"
          onChange={handleChange}
          value={values.importe}
          type="number"
          min="0"
          step="0.10"
          autoComplete="off" />

        <div className="relative flex items-center gap-2 justify-self-center">
          <input type="checkbox" className="hidden" name="pagado" checked={ischecked} onChange={() => setCheck(!ischecked)} />
          <div onClick={() => setCheck(!ischecked)} className={`w-6 h-6 rounded-md border border-gray-200 transition ${ischecked && "bg-primary border-none"} cursor-pointer`}>
            {ischecked && <CheckIcon className="text-white " />}
          </div>
          <p className="font-display text-md font-medium text-gray-500">¿Pagado?</p>
        </div>

        <InputField
          name="fechaPago"
          label={`${ischecked?"Fecha de pago":"Fecha de futuro pago"}`}
          onChange={handleChange}
          value={values.fechaPago}
          type="date"
          autoComplete="off" />

        <InputField
          name="medio_pago"
          label="Modo de pago"
          disabled={!ischecked}
          className={`${ischecked ? "" : "bg-slate-200"}`}
          onChange={handleChange}
          value={values.medio_pago}
          type="text"
          autoComplete="off" />

        <InputField
          name="pagado_por"
          label="Pagado por"
          onChange={handleChange}
          value={values.pagado_por}
          disabled={!ischecked}
          className={`${ischecked ? "" : "bg-slate-200"}`}
          type="text"
          autoComplete="off" />


        <div className="col-span-2">
          <InputField
            name="concepto"
            label="concepto del pago"
            onChange={handleChange}
            value={values.concepto}
            type="text"
            autoComplete="off" />
        </div>





        <button disabled={isSubmitting} type="submit" className={`col-span-2 font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"
          }`} >Añadir pago</button>
      </form>
    </>
  )
}
