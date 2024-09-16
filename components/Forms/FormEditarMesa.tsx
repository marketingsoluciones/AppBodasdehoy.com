import React, { useState, useMemo, useEffect } from 'react'
import Select from 'react-select'
import * as yup from 'yup'
import InputField from "./InputField";
import { Form, Formik, FormikValues } from "formik";
import { EventContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Dispatch, FC, SetStateAction } from "react";
import { ArrowDown, BorrarIcon, MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, PlusIcon, XpersonIcon } from "../icons";
import { guest, guests } from "../../utils/Interfaces"
import { ImageProfile } from "../../utils/Funciones";
import ClickAwayListener from "react-click-away-listener"
import { moveGuest } from '../Mesas/FuntionsDragable';
import { BsBoxArrowInDown, BsBoxArrowUp } from 'react-icons/bs'
import { dicc } from './FormCrearMesa';
import { useTranslation } from 'react-i18next';






interface propsFormEditarMesa {
  set: Dispatch<SetStateAction<boolean>>
  state: any
}

type initialValues = {
  nombre_mesa: string
  cantidad_sillas: string
}

const FormEditarMesa: FC<propsFormEditarMesa> = ({ set, state }) => {
  const { t } = useTranslation();
  // console.log(10041, state)
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, setEditDefault, filterGuests } = EventContextProvider();
  const [selectInvitado, setSelectedInvitado] = useState(false);
  const [sentadosTable, setSentadosTable] = useState([]);
  const [showGuest, setShowGuest] = useState([]);
  const [active, setActive] = useState(false);

  const toast = useToast()
  const arryInvitados = event.invitados_array


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

  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      await fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive?._id,
          tableID: state.table._id,
          variable: "title",
          valor: JSON.stringify(values.nombre_mesa)
        }
      })
      const table: any = await fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive?._id,
          tableID: state.table._id,
          variable: "numberChair",
          valor: JSON.stringify(values.cantidad_sillas)
        }
      })
      const f1 = planSpaceActive.tables.findIndex(elem => elem._id === state.table._id)
      planSpaceActive.tables.splice(f1, 1, table)
      setPlanSpaceActive({ ...planSpaceActive })
      setEvent((old) => {
        const f1 = old.planSpace.findIndex(elem => elem._id === old.planSpaceSelect)
        old.planSpace[f1] = planSpaceActive
        return { ...old }
      })
      setEditDefault(old => {
        return { ...old, item: table }
      })
      toast("success", "La mesa fue actualizada")
    } catch (err) {
      toast("error", "Ha ocurrido un error al actualizar la mesa")
      console.log(err);
    } finally {
      actions.setSubmitting(false);
      set(!state)
    }
  }

  useEffect(() => {
    setShowGuest(active ? sentadosTable : filterGuests.noSentados)
  }, [active, filterGuests, sentadosTable])


  useEffect(() => {
    setSentadosTable(filterGuests?.sentados?.filter(elem => elem.tableID === state?.table?._id))
  }, [filterGuests])

  const handleMoveGuest = (item) => {
    try {
      if (active) {
        moveGuest({ event, chair: NaN, invitadoID: item._id, tableID: state?.table?._id, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests, prefijo: "dragS" })
        toast("success", "El invitado fue levantado de la mesa")
        return
      }
      if (state?.table?.guests?.length === state?.table?.numberChair) {
        toast("error", "La mesa tiene todos los puestos ocupados")
      }
      for (let i = 0; i < state?.table?.numberChair; i++) {
        if (!state?.table?.guests?.map(el => el.chair).includes(i)) {
          moveGuest({ event, chair: i, invitadoID: item._id, tableID: state?.table?._id, setEvent, planSpaceActive, setPlanSpaceActive })
          toast("success", "El invitado fue sentado en la mesa")
          break
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <div className='mb-2 h-[400px]'>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, isSubmitting }) => (
            <>
              <Form className="text-gray-900 grid gap-1">
                <div className="grid-cols-3 grid w-full">
                  <span className="w-max col-span-1 m-auto inset-0">{dicc[state.table.tipo]?.icon}</span>
                  <div className="font-display hover:text-gray-300 transition text-lg absolute top-3 right-5 cursor-pointer hover:scale-125" onClick={() => set(!state)}>X</div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <InputField name="nombre_mesa" label="Nombre de la mesa" type="text" className='font-semibold' />
                    <InputField name="cantidad_sillas" label="N° de sillas" type="number"
                      autoComplete="off"
                      className="font-semibold"
                      disabled={values.tipo == "cuadrada" ? true : false}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center relative ">
                  {/* <label className="font-display text-primary text-sm w-full">Invitados</label> */}
                  <div className="pt-2">
                    <div className="w-80 mx-auto inset-x-0 flex my-2 mt-2 rounded-2xl border-[1px] overflow-hidden">
                      <div
                        onClick={() => setActive(false)}
                        className={`w-1/2 py-1 ${!active ? "bg-primary text-white" : "bg-white text-primary"
                          } h-full grid place-items-center font-display font-medium text-sm cursor-pointer hover:opacity-90`}
                      >
                        <p>{t("nonseatedguests")}</p>
                      </div>
                      <div
                        onClick={() => setActive(true)}
                        className={`w-1/2 py-1 ${active ? "bg-primary text-white" : "bg-white text-primary"
                          } h-full grid place-items-center font-display font-medium text-sm cursor-pointer hover:opacity-90`}
                      >
                        <p>{t("seatedguests")}</p>
                      </div>
                    </div>
                  </div>
                  {/* <p className='font-body text-primary '>Invitados asignados a esta mesa</p>
                  <button type='button' onClick={() => { true ? setSelectedInvitado(!selectInvitado) : toast("error", "No hay invitados disponibles para sentar") }} className='border rounded-lg w-[100%] h-10 py-1 flex items-center justify-between px-2 font-body text-sm focus:outline-none'>
                    Agregar invitado
                    <ArrowDown className="text-gray-500" />
                  </button> */}

                  {selectInvitado ? (
                    <ClickAwayListener onClickAway={() => selectInvitado && setSelectedInvitado(!selectInvitado)}>
                      <div className={`${selectInvitado ? "block " : "hidden"} overflow-y-scroll bg-white w-[100%] h-[190px] top-[64px] absolute rounded-lg drop-shadow-md`}>
                        {filterGuests?.noSentados.map((item, idx) => {
                          return (
                            <div
                              onClick={() => {
                                for (let i = 0; i < state?.table?.numberChair; i++) {
                                  if (!state?.table?.guest?.find((elem: guest) => elem?.chair == 0)) {
                                    moveGuest({ event, chair: i, invitadoID: item._id, tableID: state?.table?._id, setEvent, planSpaceActive, setPlanSpaceActive })
                                    break
                                  }
                                }
                              }}
                              key={idx}
                              className='flex items-center hover:bg-gray-200 p-2 cursor-pointer'>
                              <img
                                className="w-7 h-7 rounded-full mr-2 text-gray-700 border-gray-300  "
                                src={ImageProfile[item.sexo].image}
                                alt={ImageProfile[item.sexo].alt}
                              />
                              <div className='font-body text-sm leading-3'>
                                {item.nombre}
                              </div>
                            </div>
                          )
                        })}
                        <div className='flex items-center hover:bg-gray-200 p-2 cursor-pointer'>
                          <PlusIcon className="w-4 h-7 text-primary mx-2" />
                          <div className='font-body text-sm ml-1'>
                            {t("addguestevent")}
                          </div>
                        </div>
                      </div>
                    </ClickAwayListener>
                  ) : null}

                  <div className={`h-[190px]  w-[100%] flex flex-col overflow-y-scroll`}>
                    {
                      showGuest?.length != 0
                        ? showGuest.map((item, idx) => {
                          return (
                            <div key={idx} onClick={() => { handleMoveGuest(item) }} className='flex hover:bg-gray-200 w-[312px] justify-between items-center cursor-pointer'>
                              <div className='flex items-center p-2'>
                                <img
                                  className="w-7 h-7 rounded-full mr-2 text-gray-700 border-gray-300  "
                                  src={ImageProfile[item.sexo].image}
                                  alt={ImageProfile[item.sexo].alt}
                                />
                                <p className='font-body text-sm leading-3'>
                                  {item.nombre}
                                </p>
                              </div>
                              <div className='hover:bg-gray-200 rounded-lg pr-2 items-center'>
                                {!active ? <BsBoxArrowInDown className={`w-5 h-5 text-gray-600 `} /> : <BsBoxArrowUp className={`w-5 h-5 text-gray-600 `} />}
                              </div>
                            </div>
                          )
                        })
                        : <div className='flex items-center justify-center space-x-4'>
                          <XpersonIcon className="text-gray-600 " />
                          <p className='text-center font-body text-sm w-40'>{!active ? t("allguestsseated") : t("noguestsseatedtable")}</p>
                        </div>
                    }
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-4 px-4 pt-1">
                  <button
                    type="submit"
                    className=" bg-primary w-full text-white  mx-auto inset-x-0 rounded-xl py-1 font-body focus:outline-none"
                  >
                    {t("save")}
                  </button>
                  <button
                    className=" bg-gray-400 transition w-full text-white font-body mx-auto inset-x-0 rounded-xl py-1 focus:outline-none"
                    onClick={() => set(false)}
                  >
                    {t("cancel")}
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