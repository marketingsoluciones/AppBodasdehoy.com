import { Form, Formik, FormikValues, useField } from "formik";
import { FC, HtmlHTMLAttributes } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { WarningIcon } from "../icons";
import InputField from "./InputField";
import SelectField from "./SelectField";
import * as yup from "yup";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { ImageProfile } from "../../utils/Funciones";
import useHover from "../../hooks/useHover";
import { phoneUtil } from "../../utils/Authentication";
import { useTranslation } from 'react-i18next';

interface propsFormAcompañante {
  state: any;
  set: any;
  guestFather: string;
}
const FormAcompañante: FC<propsFormAcompañante> = ({ state, set, guestFather }) => {
  const { t } = useTranslation();
  const { geoInfo } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();

  const validationSchema = yup.object().shape({
    nombre: yup.string().required("Nombre requerido"),
  });

  const initialValues = {
    nombre: "",
    telefono: `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`,
    correo: "",
    sexo: "hombre",
    grupo_edad: "adulto",
    nombre_menu: "adultos",
    asistencia: "confirmado",

  };

  const handleSubmit = async (values: FormikValues) => {
    try {
      const fatherGuest = event.invitados_array.find(guest => guest._id === guestFather);
      const sendValues = [
        {
          _id: guestFather,
          nombre: fatherGuest?.nombre || "",
          telefono: fatherGuest?.telefono || "",
          correo: fatherGuest?.correo || "",
          sexo: fatherGuest?.sexo || "",
          grupo_edad: fatherGuest?.grupo_edad || "",
          nombre_menu: fatherGuest?.nombre_menu || "",
          asistencia: fatherGuest?.asistencia || ""
        },
        {
          _id: null,
          father: guestFather,
          nombre: values.nombre,
          telefono: values.telefono,
          correo: values.correo,
          sexo: values.sexo,
          grupo_edad: values.grupo_edad,
          nombre_menu: values.nombre_menu,
          asistencia: values.asistencia
        }
      ];
      const result = await fetchApiEventos({
        query: queries.createGuests,
        variables: {
          eventID: event._id,
          invitados_array: sendValues
        },
      });
      if (result) {
        setEvent({
          ...event,
          invitados_array: (result as any)?.invitados_array || event.invitados_array
        });
        set(!state);
      }
    } catch (error) {
      console.log(error)
    }
  };


  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting, values }) => {

        return (
          <Form className="w-full flex flex-col">
            <div className="border-l-2 border-gray-100 pl-3 my-2 w-full ">
              <h2 className="font-display text-3xl capitalize text-primary font-light">
                {t("create")}
              </h2>
              <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
                {t("guest")}
              </h2>
            </div>
            <div className="text-gray-500 font-body flex flex-col gap-4 w-full">
              <div className="input-name w-full flex items-center justify-center relative pt-4">
                <img
                  src={ImageProfile[values.sexo]?.image ?? "/placeholder/user.png"}
                  alt={ImageProfile[values.sexo]?.alt}
                  className="w-14 h-14 rounded-full mr-6 "
                />
                <InputField
                  name="telefono"
                  label={t("phone")}
                  type="telefono"
                />
              </div>
              <div className="w-full md:grid md:grid-cols-4 items-center justify-center space-x-3">
                <div className="col-span-3">
                  <InputField
                    name="nombre"
                    label={t("name")}
                    type="text"
                  />
                </div>
              </div>
              <div className=" w-full h-full flex gap-6">
                <div className="w-1/2 flex-col flex gap-2 relative">
                  <BooleanSwitch
                    label={t("sex")}
                    lista={["hombre", "mujer"]}
                    name="sexo"
                  />
                </div>
                <div className="w-1/2 flex-col flex gap-2 relative">
                  <BooleanSwitch
                    label={t("age")}
                    lista={["adulto", "niño"]}
                    name="grupo_edad"
                  />
                </div>
              </div>
              <div className="w-full flex items-center justify-center">
                <InputField
                  name="correo"
                  label={t("email")}
                  type="email"
                />
              </div>

              <div className="w-full h-full flex gap-6">
                <div className="w-1/2   ">
                  <SelectField
                    name={"nombre_menu"}
                    label={t("menu")}
                    options={[...event?.menus_array?.map(elem => elem.nombre_menu), "sin menú"]}
                  />
                </div>
                <div className="w-1/2">
                  <SelectField
                    nullable
                    options={["Confirmado", "Cancelado"]}
                    name="asistencia"
                    label={t("confirmacion")}
                    labelClass={false}
                  />
                </div>
              </div>
              <button
                className={`font-display rounded-full py-2 px-6 text-white font-medium transition w-full hover:opacity-70  ${isSubmitting ? "bg-secondary" : "bg-primary"
                  }`}
                disabled={isSubmitting}
                type="submit"
              >
                {t("createguest")}
              </button>
            </div>
          </Form>
        )
      }}
    </Formik>
  );
};

export default FormAcompañante;


interface propsBooleanSwitch extends HtmlHTMLAttributes<HTMLInputElement> {
  lista: string[];
  label: string;
  name: string;
  disabled?: boolean;
}

export const BooleanSwitch: FC<propsBooleanSwitch> = ({ lista, label, disabled, ...props }) => {
  const { t } = useTranslation();
  const [field, meta, { setValue }] = useField({ name: props.name });
  const [hoverRef, isHovered] = useHover();

  return (
    <div className=" relative w-full">
      <label className="font-display text-sm text-primary w-full capitalize">
        {label}
      </label>
      <div className="flex h-8 items-center justify-center relative">
        <div
          value={lista[0]}
          onClick={() => !disabled && setValue(lista[0])}
          {...props}
          {...field}
          className={`font-display text-center w-1/2 h-8 border text-gray-500 border-gray-100 py-1 text-sm rounded-l-lg focus:outline-none ${!disabled && "hover:bg-secondary hover:text-white"} capitalize cursor-pointer transition ${meta.value == lista[0] ? "bg-secondary text-white" : "bg-white"
            }`}
        >
          {lista[0]}
        </div>
        <div
          value={lista[1]}
          onClick={() => !disabled && setValue(lista[1])}
          {...props}
          {...field}
          className={`w-1/2 h-8 font-display text-center text-gray-500 border border-gray-100 py-1 text-sm rounded-r-lg focus:outline-none ${!disabled && "hover:bg-primary hover:text-white"} capitalize cursor-pointer transition ${meta.value == lista[1] ? "bg-primary text-white" : "bg-white"
            }`}
        >
          {lista[1]}
        </div>
        {disabled && <div ref={hoverRef} className="w-full h-full z-10 absolute"></div>}
      </div>
      {isHovered && (
        <div className="transform translate-y-1 bg-gray-700 absolute z-10 top-14 rounded-lg text-white px-3 py-1 text-xs">
          {t("lockedfield")}
        </div>
      )}
      {meta.touched && meta.error && (
        <p className="font-display absolute rounded-xl text-xs left-0 bottom-0 transform translate-y-full text-red flex gap-1">
          <WarningIcon className="w-4 h-4" />
          {meta.error}
        </p>
      )}
    </div>

  );
};
