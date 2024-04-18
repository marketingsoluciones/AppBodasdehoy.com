// importaciones librerias
import { Formik } from "formik";
import { useContext, useEffect, useState } from "react";

// importacion funciones fetching
import { api } from "../../api";

// importaciones contextos
import { EventContextProvider } from "../../context";
import { CheckIcon } from "../icons";
import InputField from "./InputField";

// importaciones componentes


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

const FormEditarPago = ({ ListaPagos, IDPagoAModificar, IDs, set, state }) => {
  const { event, setEvent } = EventContextProvider()
  const [pago, setPago] = useState(ListaPagos?.find(item => item._id == IDPagoAModificar))


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

  return (
    <Formik
      initialValues={{
        importe: pago?.importe,
        pagado: checkbox[pago?.estado],
        fechaPago: pago?.fecha_pago,
        fechaVencimiento: pago?.fecha_vencimiento,
        pagado_por: pago?.pagado_por,
        medio_pago: pago?.medio_pago,
        concepto: pago?.concepto
      }}

      onSubmit={async (values, actions) => {
        const params = {
          query: `mutation{
                editPago(evento_id:"${event?._id}", categoria_id:"${pago?.idCategoria}", gasto_id:"${pago?.idGasto}", pago_id:"${IDPagoAModificar}", pagos_array:{
                  importe: ${values.importe},
                  estado: "${checkbox[values.pagado]}",
                  fecha_pago: "${values.fechaPago}",
                  fecha_vencimiento: "${values.fechaVencimiento}",
                  pagado_por: "${values.pagado_por}"
                  medio_pago: "${values.medio_pago}",
                  concepto:"${values.concepto}"
                }
              ){
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

        let res
        try {
          actions.setSubmitting(true)
          const { data } = await api.ApiApp(params)
          res = data?.data?.editPago
        } catch (error) {
          console.log(error)
        } finally {
          setEvent(old => {
            const idxCategoria = old?.presupuesto_objeto?.categorias_array?.findIndex(item => item._id == pago?.idCategoria)
            const idxGasto = old?.presupuesto_objeto?.categorias_array[idxCategoria]?.gastos_array?.findIndex(item => item._id == pago?.idGasto)
            const idxPago = old?.presupuesto_objeto?.categorias_array[idxCategoria]?.gastos_array[idxGasto].pagos_array?.findIndex(item => item._id == IDPagoAModificar)
            old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[idxGasto].pagos_array[idxPago] = {
              ...old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[idxGasto].pagos_array[idxPago],
              ...values
            }
            if (values.importe !== pago.importe) {

              //Actualizar pagado en categoria
              old.presupuesto_objeto.categorias_array[idxCategoria].pagado = res?.categorias_array[0]?.pagado
              //Actualizar pagado en gasto
              old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[idxGasto].pagado = res?.categorias_array[0]?.gastos_array[0].pagado
            }
            if (values.pagado !== checkbox[pago?.estado]) {
              //Actualizar estado en gasto
              old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[idxGasto].pagado = res?.categorias_array[0]?.gastos_array[0].pagado
              old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[idxGasto].pagos_array[idxPago].estado = res?.categorias_array[0]?.gastos_array[0].pagos_array[0].estado
              old.presupuesto_objeto.categorias_array[idxCategoria].pagado = res?.categorias_array[0]?.pagado
            }
            return { ...old }
          })
          set(!state)
          actions.setSubmitting(false)
        }
      }}
      validate={validacion}
    >
      {(props) => <BasicFormLogin {...props} />}
    </Formik>
  );
}

export default FormEditarPago


export const BasicFormLogin = ({
  handleChange,
  handleSubmit,
  isSubmitting,
  values,
}) => {

  const [ischecked, setCheck] = useState(values.pagado)

  useEffect(() => {
    values.pagado = ischecked
  }, [ischecked])


  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 pt-6 w-full " >
        <div className=" grid grid-cols-2 col-span-2 border-gray-100 pl-3 w-full ">
          <div className="col-span-1 border-l-2 border-gray-100 pl-3 w-full  ">
            <h2 className="font-display text-3xl capitalize text-primary font-light">Editar</h2>
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
          label="Fecha de pago"
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
          }`} >Confirmar edición</button>
      </form>
    </>
  )
}
