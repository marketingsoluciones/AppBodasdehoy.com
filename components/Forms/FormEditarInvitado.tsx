import { Formik, FormikValues, Form } from 'formik';
import { useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { BorrarInvitado } from "../../hooks/EditarInvitado";
import InputField from "./InputField";
import { ImageProfile } from '../../utils/Funciones'
import { guests, table } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useToast } from '../../hooks/useToast';
import { capitalize } from '../../utils/Capitalize';
import SelectField from './SelectField';
import { BooleanSwitch } from './FormInvitado';
import * as yup from 'yup'
import useHover from "../../hooks/useHover";
import { handleMoveGuest } from '../Invitados/GrupoTablas';
import { useTranslation } from 'react-i18next';

interface InitialValues extends Partial<guests> {
  tableNameCeremonia: Partial<table>
  tableNameRecepcion: Partial<table>
}

const validationSchema = yup.object().shape({
  nombre: yup.string().required(({ path }) => `${capitalize(path)} requerido`),
  tableNameRecepcion: yup.object().test("Unico", `Acompañantes es requerido`, (value) => {
    return true
  }),
  telefono: yup.string().required(({ path }) => `${capitalize(path)} requerido`),
})

const FormEditarInvitado = ({ state, set, invitado, setInvitadoSelected }) => {
  const { t } = useTranslation();
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
    const val = { ...values }
    delete val?.tableNameCeremonia
    delete val?.tableNameRecepcion
    let valirChange = false
    Object.entries(val).forEach(([key, value]) => {
      if (values[key] !== initialValues[key]) {
        valirChange = true
      }
    });

    const result: any = await fetchApiEventos({
      query: queries.createGuests,
      variables: {
        eventID: event._id,
        invitados_array: [val],
      },
    });
    const f1 = event?.invitados_array?.findIndex(elem => elem._id === values._id)
    event.invitados_array[f1] = { ...invitado, ...values }
    if (initialValues?.tableNameRecepcion?._id === values?.tableNameRecepcion?._id && initialValues?.tableNameCeremonia?._id === values?.tableNameCeremonia?._id) {
      if (valirChange) {
        setEvent({ ...event })
      }
    } else {
      if (initialValues?.tableNameRecepcion?._id !== values?.tableNameRecepcion?._id) {
        const f1 = event?.planSpace.findIndex(elem => elem?.title === "recepción")
        const table = event.planSpace[f1]?.tables.find(el => el._id === values?.tableNameRecepcion?._id)
        const sendValues = { t, invitadoID: values?._id, previousTable: initialValues?.tableNameRecepcion, lastTable: table, f1, event, setEvent, toast }
        handleMoveGuest(sendValues)
      }
      if (initialValues?.tableNameCeremonia?._id !== values?.tableNameCeremonia?._id) {
        const f1 = event?.planSpace.findIndex(elem => elem?.title === "ceremonia")
        const table = event.planSpace[f1]?.tables.find(el => el._id === values?.tableNameCeremonia?._id)
        const sendValues = { t, invitadoID: values?._id, previousTable: initialValues?.tableNameCeremonia, lastTable: table, f1, event, setEvent, toast }
        handleMoveGuest(sendValues)
      }
    }
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

  return (
    <Formik
      initialValues={initialValues}
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
                    label={t("name")}
                    type="text"
                  />
                </div>
                {/* INPUT ASISTENCIA */}
                <div className='col-span-2'>
                  <SelectField
                    options={["pendiente", "confirmado", "cancelado"]}
                    name="asistencia"
                    label={t("attendance")}
                  />
                </div>
              </div>
              {!invitado?.father && <div className="w-full h-full gap-2 flex-col flex">
                <div className="grid md:grid-cols-6 w-full gap-6 relative md:pl-20">
                  <div className='col-span-2'>
                    <InputField
                      name="passesQuantity"
                      label={t("companions")}
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
                    label={t("roleguestgroup")}
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
                    label={t("receptiontable")}
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
                    label={t("ceremonytable")}
                  />
                  <SelectField
                    colSpan={2}
                    options={[...event?.menus_array?.map((item) => item?.nombre_menu), "sin menú"]}
                    name="nombre_menu"
                    label={t("menu")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 w-full gap-6 relative">
                <BooleanSwitch
                  label={t("sex")}
                  lista={["hombre", "mujer"]}
                  name="sexo"
                />
                <BooleanSwitch
                  label={t("age")}
                  lista={["adulto", "niño"]}
                  name="grupo_edad"
                />
              </div>
              <div className="grid md:grid-cols-3 w-full gap-6 relative">
                <div ref={hoverRef} className='md:col-span-6'>
                  <InputField
                    name="correo"
                    label={t("email")}
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
                  label={t("phone")}
                  type="telefono"
                />
                <InputField
                  name="población"
                  label={t("poblacion")}
                  type="text"
                />
                <InputField
                  name="pais"
                  label={t("country")}
                  type="text"
                />
              </div>
              <div className="flex justify-end items-center text-gray-500 pt-2">
                <button
                  className={`font-display float-right relative rounded-lg py-2 px-6 text-white font-medium transition w-max hover:opacity-70  ${isSubmitting ? "bg-secondary" : "bg-primary"
                    }`}
                  disabled={isSubmitting}
                  type="submit"
                >
                  {t("save")}
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
    // console.log(11145000004)
  }, [values])
  return (<></>)
}

export default FormEditarInvitado;

