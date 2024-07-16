//@ts-check
import { ErrorMessage, Formik, useField, FormikValues, Form } from 'formik';
import { FC, useContext, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { BorrarInvitado, EditarInvitado } from "../../hooks/EditarInvitado";
import { BorrarIcon } from "../icons";
import InputField from "./InputField";
import { ImageProfile } from '../../utils/Funciones'
import { guest, guests, table } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useToast } from '../../hooks/useToast';
import { capitalize } from '../../utils/Capitalize';
import SelectField from './SelectField';
import { BooleanSwitch } from './FormInvitado';
import * as yup from 'yup'
import useHover from "../../hooks/useHover";

interface InitialValues extends Partial<guests> {
  tableNameCeremonia: Partial<table>
  tableNameRecepcion: Partial<table>
}

const msgAuto = ({ path }) => `${capitalize(path)} requerido`

const validationSchema = yup.object().shape({
  nombre: yup.string().required(({ path }) => `${capitalize(path)} requerido`),
  tableNameRecepcion: yup.object().test("Unico", `Acompañantes es requerido`, (value) => {
    return true
  }),
  telefono: yup.string().required(({ path }) => `${capitalize(path)} requerido`),
})

const FormEditarInvitado = ({ state, set, invitado, setInvitadoSelected }) => {
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()
  const [hoverRef, isHovered] = useHover();
  const [mesasDisponibles, setMesasDiosponibles] = useState({ ceremonia: [], recepcion: [] })

  const initialValues: InitialValues = {
    _id: invitado?._id,
    nombre: invitado?.nombre,
    asistencia: invitado?.asistencia,
    sexo: invitado?.sexo,
    poblacion: invitado?.poblacion,
    pais: invitado?.pais,
    grupo_edad: invitado?.grupo_edad,
    correo: invitado?.correo,
    telefono: invitado?.telefono,
    rol: invitado?.rol,
    nombre_menu: invitado?.nombre_menu,
    passesQuantity: invitado?.passesQuantity,
    tableNameCeremonia: invitado?.tableNameCeremonia,
    tableNameRecepcion: invitado?.tableNameRecepcion,
  }
  const handleSubmit = async (values: FormikValues, actions: any) => {
    const val = values
    delete val?.tableNameCeremonia
    delete val?.tableNameRecepcion
    const result: any = await fetchApiEventos({
      query: queries.createGuests,
      variables: {
        eventID: event._id,
        invitados_array: [values],
      },
    });
    // falta setear el cambio en las mesas queries.editTable
    // falta setear el estado
    set(!state)
  }

  const handleRemove = async () => {
    try {
      await BorrarInvitado(event?._id, invitado?._id);
    } catch (error) {
      console.log(error);
    } finally {
      setEvent((old) => ({
        ...old,
        invitados_array: old?.invitados_array?.filter(
          (item) => item?._id !== invitado?._id
        ),
      }));
      setInvitadoSelected("");
    }
  };

  const handleBlurData = async (variable: string, value: string) => {
    if (invitado[variable] !== value) {
      try {
        const result = await fetchApiEventos({
          query: queries.editGuests,
          variables: {
            eventID: event._id,
            guestID: invitado._id,
            variable,
            value
          }
        })
        setEvent((old: any) => {
          const newGuests = old.invitados_array.map(guest => {
            if (guest._id === invitado._id) {
              return result
            }
            return guest
          })
          return {
            ...old,
            invitados_array: newGuests
          }
        })
        toast("success", `${capitalize(variable)} actualizado con exito`)
      } catch (error) {
        console.log(error)
        toast("error", `Ha ocurrido un error al actualizar el ${capitalize(variable)} `)
      }
    }

  };
  return (
    <Formik
      initialValues={initialValues}
      // enableReinitialize
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ values, setValues, isSubmitting }) => {

        return (
          <>
            <Asd values={values} setValues={setValues} />
            <Form
              className="text-gray-500 font-body lg:overflow-auto flex flex-col gap-8 w-full my-4 px-2"
            >
              <div className="grid md:grid-cols-6 w-full gap-6">
                <div className="w-full flex items-center md:col-span-4 justify-center">
                  <img
                    src={ImageProfile[invitado?.sexo]?.image}
                    alt="imagen-invitados"
                    className="w-14 h-14 rounded-full mx-3 "

                  />
                  <InputField
                    name="nombre"
                    label="Nombre"
                    // onBlur={() => handleBlurData("nombre", values.nombre)}
                    type="text"
                  />
                </div>
                {/* INPUT ASISTENCIA */}
                <div className='col-span-2'>
                  <SelectField
                    options={["pendiente", "confirmado", "cancelado"]}
                    name="asistencia"
                    label="Asistencia"
                  //onChangeCapture={(e: any) => handleBlurData("asistencia", e?.target?.value)}
                  />
                </div>
              </div>
              {!invitado?.father && <div className="w-full h-full gap-2 flex-col flex">
                <div className="grid md:grid-cols-6 w-full gap-6 relative md:pl-20">
                  <div className='col-span-2'>
                    <InputField
                      name="passesQuantity"
                      label="Acompañantes"
                      // onBlur={(e: any) => handleBlurData("passesQuantity", e.target.value)}
                      type="number"
                    />
                  </div>
                </div>
              </div>}
              <div className="w-full h-full gap-2 flex-col flex">
                <div className="md:grid md:grid-cols-9 w-full gap-6 relative  ">
                  <SelectField
                    colSpan={3}
                    options={event?.grupos_array}
                    name="rol"
                    label="Rol o Grupo de invitados"
                  // onChangeCapture={(e: any) => handleBlurData("rol", e?.target?.value)}
                  />
                  <SelectField
                    colSpan={2}
                    options={[
                      { _id: null, title: "No Asignado" },
                      ...event?.planSpace.find(elem => elem?.title === "recepción")?.tables?.reduce((acc, elem) => {
                        if (elem?.guests.length < elem?.numberChair || values?.tableNameRecepcion?._id === elem?._id) {
                          acc.push({ _id: elem._id, title: elem.title })
                        }
                        return acc
                      }, [])
                    ]}
                    name="tableNameRecepcion"
                    label="Mesa Recepción"
                  // onChangeCapture={(e: any) => handleBlurData("nombre_mesa", e.target.value)}
                  />
                  <SelectField
                    colSpan={2}
                    options={[
                      { _id: null, title: "No Asignado" },
                      ...event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables?.reduce((acc, elem) => {
                        if (elem?.guests.length < elem?.numberChair || values?.tableNameRecepcion?._id === elem?._id) {
                          acc.push({ _id: elem._id, title: elem.title })
                        }
                        return acc
                      }, [])
                    ]}
                    name="tableNameCeremonia"
                    label="Mesa Ceremonia"
                  // onChangeCapture={(e: any) => handleBlurData("nombre_mesa", e.target.value)}
                  />
                  <SelectField
                    colSpan={2}
                    options={[...event?.menus_array?.map((item) => item?.nombre_menu), "sin menú"]}
                    name="nombre_menu"
                    label="Menú"
                  // onChangeCapture={(e: any) => handleBlurData("nombre_menu", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 w-full gap-6 relative">
                <BooleanSwitch
                  // disabled={true}
                  label="Sexo"
                  lista={["hombre", "mujer"]}
                  name="sexo"
                // onChangeCapture={(e: any) => handleBlurData("sexo", e.target.value)}
                />
                <BooleanSwitch
                  // disabled={true}
                  label="Edad"
                  lista={["adulto", "niño"]}
                  name="grupo_edad"
                // onChangeCapture={(e: any) => handleBlurData("grupo_edad", e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-3 w-full gap-6 relative">
                <div ref={hoverRef} className='md:col-span-6'>
                  <InputField
                    name="correo"
                    label="Correo"
                    // onBlur={(e: any) => handleBlurData("correo", e.target.value)}
                    type="email"
                    disabled={true}
                  />
                  {isHovered && (
                    <div className="transform w-[80%] md:w-[400px] pr-10 pt-2 md:pt-1 translate-y-2 bg-gray-700 absolute z-10 top-14 rounded-lg text-white px-3 py-1 text-xs">
                      El correo no se puede modificar, si el correo no corresponde al invitado debes eliminar el invitado y crearlo nuevamente.
                    </div>
                  )}
                </div>
                <InputField
                  name="telefono"
                  label="Telefono"
                  // onBlur={(e: any) => handleBlurData("telefono", e.target.value)}
                  type="telefono"
                />
                <InputField
                  name="poblacion"
                  label="Población"
                  // onBlur={(e: any) => handleBlurData("poblacion", e.target.value)}
                  type="text"
                />
                <InputField
                  name="pais"
                  label="País"
                  // onBlur={(e: any) => handleBlurData("pais", e.target.value)}
                  type="text"
                />
              </div>
              <div className="flex justify-end items-center text-gray-500 pt-2">
                <button
                  className={`font-display float-right relative rounded-lg py-2 px-6 text-white font-medium transition w-max hover:opacity-70  ${isSubmitting ? "bg-secondary" : "bg-primary"
                    }`}
                  disabled={isSubmitting}
                  type="submit"
                // onClick={() => set(!state)}
                >
                  Guardar
                </button>
              </div>
            </Form>
          </>
        )
      }}
    </Formik>
  );
};

const Asd = ({ values, setValues }) => {
  useEffect(() => {
    console.log(111454, values.passesQuantity)
  }, [values])
  return (<></>)
}

export default FormEditarInvitado;

