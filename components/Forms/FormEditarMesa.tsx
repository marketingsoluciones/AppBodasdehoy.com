import React, { useState, useMemo } from 'react'
import Select from 'react-select'
import * as yup from 'yup'
import InputField from "./InputField";
import { Form, Formik, FormikValues } from "formik";
import { EventContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Dispatch, FC, SetStateAction } from "react";
import { ArrowDown, BorrarIcon, MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, XpersonIcon } from "../icons";
import { guests } from "../../utils/Interfaces"
import { ImageProfile } from "../../utils/Funciones";
import ClickAwayListener from "react-click-away-listener"






interface propsFormEditarMesa {
  modelo: string | null,
  set: Dispatch<SetStateAction<boolean>>
  state: any
  InvitadoNoSentado: guests[]
}

type initialValues = {
  nombre_mesa: string
  cantidad_sillas: string
}

const FormEditarMesa: FC<propsFormEditarMesa> = ({ modelo, set, state, InvitadoNoSentado }) => {
  console.log(100000111111, "modelo", modelo, state)
  const { event, setEvent } = EventContextProvider();
  const [selectInvitado, setSelectedInvitado] = useState(false);
  const toast = useToast()
  const arryInvitados = event.invitados_array
  console.log(event.mesas_array)


  const validationSchema = yup.object().shape({
    nombre_mesa: yup.string().required().test("Unico", "El nombre debe ser unico", values => {
      if (values == state.table.title) {
        return true
      }
      return !event.mesas_array.map(item => item.nombre_mesa).includes(values)
    }),
  });

  const initialValues: initialValues = {
    nombre_mesa: state.table.title,
    cantidad_sillas: state.table.numberChair
  }

  const dicc = {
    cuadrada: {
      icon: <MesaCuadrada />,
      min: 4,
      max: 4,
    },
    podio: {
      icon: <MesaPodio />,
      min: 4,
      max: 40
    },
    redonda: {
      icon: <MesaRedonda />,
      min: 2,
      max: 10
    },
    imperial: {
      icon: <MesaImperial />,
      min: 10,
      max: 16
    },
  };


  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      const resp: any = await fetchApiEventos({
        query: queries.editNameTable,
        variables: {
          eventID: event._id,
          tableID: state.mesa._id,
          variable: "nombre_mesa",
          valor_reemplazar: values.nombre_mesa,
        }
      })
      await fetchApiEventos({
        query: queries.editNameTable,
        variables: {
          eventID: event._id,
          tableID: state.mesa._id,
          variable: "cantidad_sillas",
          valor_reemplazar: values.cantidad_sillas.toString(),
        }
      })
      const mesas_array = event.mesas_array.map(item => {
        if (item._id == resp._id) {
          return resp
        }
        return item
      })
      setEvent((old) => ({ ...old, mesas_array }));
      toast("success", "La mesa fue actualizada")
    } catch (err) {
      toast("error", "Ha ocurrido un error al actualizar la mesa")
      console.log(err);
    } finally {
      actions.setSubmitting(false);
      set(!state)
    }
  }

  const InvitadosSentados = arryInvitados.filter(table => table.nombre_mesa == state.table.title)
  console.log()

  return (
    <>
      <div className=' mb-2'>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, isSubmitting }) => (
            <>
              <Form className="text-gray-900 grid gap-4  ">
                <div className="grid-cols-3 grid gap-2 w-full">
                  <span className="w-max col-span-1 m-auto inset-0">{dicc[state.table.tipo]?.icon}</span>
                  <div className="font-display text-gray-500 hover:text-gray-300 transition text-lg absolute top-3 right-5 cursor-pointer hover:scale-125" onClick={() => set(!state)}>X</div>
                  <div className="col-span-2 flex flex-col gap-4">
                    <InputField
                      name="nombre_mesa"
                      label="Nuevo nombre de mesa"
                      type="text"
                    />
                    <InputField
                      name="cantidad_sillas"
                      label="N° de sillas"
                      type="number"
                      min={dicc[modelo]?.min}
                      max={dicc[modelo]?.max}
                      autoComplete="off"
                      className="bg-tertiary text-white font-semibold"
                      disabled={values.tipo == "cuadrada" ? true : false}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-4 relative ">
                  <p className='font-body text-primary '>Invitados asignados a esta mesa</p>
                  <button type='button' onClick={() => { InvitadoNoSentado.length != 0 ? setSelectedInvitado(!selectInvitado) : toast("error", "No hay invitados disponibles para sentar") }} className='border rounded-lg w-[100%] py-1 flex items-center justify-between px-2 font-body text-sm focus:outline-none'>
                    Agregar invitado
                    <ArrowDown className="text-gray-500" />
                  </button>
                  {selectInvitado ? (
                    <ClickAwayListener onClickAway={() => selectInvitado && setSelectedInvitado(!selectInvitado)}>
                      <div className={`${selectInvitado ? "block " : "hidden"} overflow-auto space-y-1 bg-white w-[70%] h-36 py-1 absolute -bottom-16  rounded-lg drop-shadow-md`}>
                        {InvitadoNoSentado.map((item, idx) => {
                          return (
                            <div key={idx} className='flex items-center hover:bg-gray-200 p-2 cursor-pointer rounded-md  '>
                              <img
                                className="w-7 h-7 rounded-full mr-2 text-gray-700 border-gray-300  "
                                src={ImageProfile[item.sexo].image}
                                alt={ImageProfile[item.sexo].alt}
                              />
                              <div className='font-body text-sm'>
                                {item.nombre}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ClickAwayListener>
                  ) : null}
                  <div className={`${InvitadosSentados?.length > 2 ? " h-32" : ""}  w-[100%] flex flex-col overflow-auto divide-y  `}>
                    {(() => {
                      if (InvitadosSentados.length != 0) {
                        return (
                          <>
                            {
                              InvitadosSentados.map((item, idx) => {
                                return (
                                  <div key={idx} className='flex items-center justify-between  '>
                                    <div className='flex  items-center p-2 cursor-default '>
                                      <img
                                        className="w-7 h-7 rounded-full mr-2 text-gray-700 border-gray-300  "
                                        src={ImageProfile[item.sexo].image}
                                        alt={ImageProfile[item.sexo].alt}
                                      />
                                      <p className='font-body text-sm'>
                                        {item.nombre}
                                      </p>
                                    </div>
                                    <div onClick={() => { toast("success", "El invitado fue levantado de la mesa") }} className='hover:bg-gray-200 p-2 mr-1 rounded-lg cursor-pointer'>
                                      <BorrarIcon className="text-gray-400" />
                                    </div>
                                  </div>
                                )
                              })
                            }
                          </>
                        )
                      } else {
                        return (<>
                          <div className='flex h-full items-center justify-center space-x-4'>
                            <XpersonIcon className="text-gray-600 " />
                            <p className='w-[40%] text-center font-body text-sm'>No hay invitados en esta mesa </p>
                          </div>
                        </>)
                      }
                    })()}
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-4 px-4 pt-4">
                  <button
                    type="submit"
                    className=" bg-primary w-full text-white  mx-auto inset-x-0 rounded-xl py-1 font-body focus:outline-none"
                  >
                    Guardar
                  </button>
                  <button
                    className=" bg-gray-400 transition w-full text-white font-body mx-auto inset-x-0 rounded-xl py-1 focus:outline-none"
                    onClick={() => set(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </Form>
            </>
          )}
        </Formik>
      </div>
    </>
  );
};

export default FormEditarMesa;