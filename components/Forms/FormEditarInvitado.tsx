//@ts-check
import { ErrorMessage, Formik, useField, FormikValues, Form } from 'formik';
import { useContext, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { BorrarInvitado, EditarInvitado } from "../../hooks/EditarInvitado";
import { BorrarIcon } from "../icons";
import InputField from "./InputField";
import { ImageProfile } from '../../utils/Funciones'
import { guests } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useToast } from '../../hooks/useToast';
import { capitalize } from '../../utils/Capitalize';
import SelectField from './SelectField';
import { BooleanSwitch } from './FormInvitado';
import * as yup from 'yup'
import useHover from "../../hooks/useHover";

const msgAuto = ({ path }) => `${capitalize(path)} requerido`

const validationSchema = yup.object().shape({
  nombre: yup.string().required(msgAuto),
  sexo: yup.string().required(msgAuto),
  grupo_edad: yup.string().required(msgAuto),
  telefono: yup.string().required(msgAuto),
  rol: yup.string().required(msgAuto),
})

const FormEditarInvitado = ({
  state,
  set,
  ListaGrupos,
  invitado,
  setInvitadoSelected,
}) => {
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()
  const [hoverRef, isHovered] = useHover();


  type MyValues = {
    nombre: string
    sexo: string
    grupo_edad: string
    correo: string
    telefono: string
    rol: string
  }

  const initialValues: MyValues = {
    nombre: "",
    sexo: "",
    grupo_edad: "",
    correo: "",
    telefono: "",
    rol: "",
  }

  const handleSubmit = async (values: FormikValues, actions: any) => {
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
        console.log(result)
        console.log(invitado._id)
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
      initialValues={invitado ?? initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ values, isSubmitting }) => (
        <>
          <Form
            className="text-gray-500 font-body lg:overflow-auto flex flex-col gap-8 w-full my-4 px-2"
          >
            <div className="grid md:grid-cols-2 w-full gap-6">
              {/* INPUT NOMBRE */}
              <div className="w-full flex items-center justify-center">
                <img
                  src={ImageProfile[invitado?.sexo]?.image}
                  alt="imagen-invitados"
                  className="w-14 h-14 rounded-full mx-3 "

                />
                <InputField
                  name="nombre"
                  label="Nombre"
                  onBlur={() => handleBlurData("nombre", values.nombre)}
                  type="text"
                />
              </div>
              {/* INPUT ASISTENCIA */}
              <SelectField
                options={["pendiente", "confirmado", "cancelado"]}
                name="asistencia"
                label="Asistencia"
                onChangeCapture={(e: any) => handleBlurData("asistencia", e?.target?.value)}
              />
            </div>

            <div className="w-full h-full gap-2 flex-col flex">
              <div className="grid md:grid-cols-3 w-full gap-6 relative border-b  border-base ">
                <SelectField
                  options={event?.grupos_array}
                  name="rol"
                  label="Grupo"
                  onChangeCapture={(e: any) => handleBlurData("rol", e?.target?.value)}
                />

                <SelectField
                  options={event?.mesas_array?.map((item) => item?.nombre_mesa)}
                  name="nombre_mesa"
                  label="Mesa"
                  onChangeCapture={(e: any) => handleBlurData("nombre_mesa", e.target.value)}
                />
                <SelectField
                  options={[]}
                  name="nombre_menu"
                  label="Menú"
                  onChangeCapture={(e: any) => handleBlurData("nombre_menu", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 w-full gap-6 relative">
              <BooleanSwitch
                label="Sexo"
                lista={["hombre", "mujer"]}
                name="sexo"
                onChangeCapture={(e: any) => handleBlurData("sexo", e.target.value)}

              />
              <BooleanSwitch
                label="Edad"
                lista={["adulto", "niño"]}
                name="grupo_edad"
                onChangeCapture={(e: any) => handleBlurData("grupo_edad", e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-3 w-full gap-6 relative hover:{<p>algo<p/>}">
              <div ref={hoverRef}>
                <InputField
                  placeholder="Ej. jhon@doe.com"
                  name="correo"
                  label="Correo"
                  onBlur={(e: any) => handleBlurData("correo", e.target.value)}
                  type="email"
                  disabled={true /*invitado.invitacion ? true : false*/}
                />
                {isHovered && (
                  <div className="transform bg-white w-2/3 shadow absolute top-0 left-20 md:top-14 md:left-4 rounded-lg text-red-500 text-xs">
                    Para cambiar el correo elmine el invitado y créelo nuevamente.
                  </div>
                )}
              </div>
              <InputField
                placeholder="960 66 66 66"
                name="telefono"
                label="Telefono"
                onBlur={(e: any) => handleBlurData("telefono", e.target.value)}
                type="tel"
              />
              <InputField
                name="movil"
                label="Movil"
                onBlur={(e: any) => handleBlurData("movil", e.target.value)}
                type="tel"
              />
              <InputField
                name="direccion"
                label="Dirección"
                onBlur={(e: any) => handleBlurData("direccion", e.target.value)}
                type="text"
              />
              <InputField
                name="poblacion"
                label="Población"
                onBlur={(e: any) => handleBlurData("poblacion", e.target.value)}
                type="text"
              />
              <InputField
                name="pais"
                label="País"
                onBlur={(e: any) => handleBlurData("pais", e.target.value)}
                type="text"
              />
            </div>

          </Form>
          <div className="flex justify-between items-center text-gray-500 pt-2">
            <div
              className="flex gap-1 items-center justify-center hover:text-red transform transition duration-200 cursor-pointer"
              onClick={handleRemove}
            >
              <BorrarIcon className="w-4 h-4 " />
              <span className="font-display font-medium text-sm">
                Eliminar Invitado
              </span>
            </div>
            <button
              className={`font-display float-right relative rounded-lg py-2 px-6 text-white font-medium transition w-max hover:opacity-70  ${isSubmitting ? "bg-secondary" : "bg-primary"
                }`}
              disabled={isSubmitting}
              type="submit"
            >
              Guardar
            </button>
          </div>
        </>
      )}
    </Formik>
  );
};

export default FormEditarInvitado;


// const Dropdown = ({ label, lista, onClick, functionData, ...props }) => {
//   const [field, meta, { setValue }] = useField(props);
//   const [state, setState] = useState();
//   return (
//     <>
//       <label className="font-display text-sm text-primary w-full">
//         {label}
//       </label>

//       <p
//         className={`font-display text-sm text-gray-500 border border-gray-100 focus:border-primary transition w-full py-1 px-4 rounded-xl focus:outline-none bg-white cursor-pointer capitalize`}
//         onClick={() => setState(!state)}
//       >
//         {meta.value == "" ? "Seleccionar" : meta.value}
//       </p>

//       {state ? (
//         <div
//           className={`block absolute right-0 bottom-0 transform translate-y-full w-full bg-white rounded-xl overflow-auto shadow-xl z-10 border border-gray-100 h-max`}
//           onClick={() => setState(!state)}
//         >
//           <ul>
//             {lista.map((item, i) => (
//               <li
//                 key={i}
//                 onClick={() => {
//                   setValue(item)
//                   functionData(item)}}
//                 {...props}
//                 {...field}
//                 className="font-display transition border-b border-gray-100 cursor-pointer block px-4 py-1 text-sm text-gray-500 hover:bg-secondary hover:text-white capitalize"
//               >
//                 {item}
//               </li>
//             ))}
//           </ul>
//         </div>
//       ) : null}
//       {meta.touched && meta.error && (
//         <p className="font-display absolute bottom-0 transform translate-y-full	 text-xs text-red-500 mt-1">
//           {meta.error}
//         </p>
//       )}
//     </>
//   );
// };

// const BooleanSwitch = ({ lista, label, functionData, ...props }) => {
//   const [field, meta, { setValue }] = useField(props);
//   return (
//     <>
//       <label className="font-display text-sm text-primary w-full capitalize pb-1">
//         {label}
//       </label>
//       <span className="flex flex h-6 items-center justify-center w-full">
//         <button
//           value={lista[0]}
//           onClick={() => {
//             setValue(lista[0])
//             functionData(lista[0])
//           }}
//           type="button"
//           {...props}
//           {...field}
//           className={`w-1/2 font-body h-8 border border-gray-100 py-1 text-sm rounded-l-lg focus:outline-none hover:bg-secondary hover:text-gray-500 capitalize font-medium transition ${
//             meta.value == lista[0] ? "bg-secondary text-gray-500" : "bg-white"
//           }`}
//         >
//           {lista[0]}
//         </button>
//         <button
//           value={lista[1]}
//           onClick={() => {
//             setValue(lista[1])
//             functionData(lista[1])
//           }}
//           type="button"
//           {...props}
//           {...field}
//           className={`w-1/2 h-8  font-body border border-gray-100 py-1 text-sm rounded-r-lg focus:outline-none hover:bg-primary hover:text-white capitalize transition ${
//             meta.value == lista[1] ? "bg-primary text-white" : "bg-white"
//           }`}
//         >
//           {lista[1]}
//         </button>
//       </span>
//       {meta.touched && meta.error && (
//         <p className="font-display absolute rounded-xl text-white text-xs bg-red px-4 py-1 right-0 top-1/2 transform translate-x-full">
//           {meta.error}
//         </p>
//       )}
//     </>
//   );
// };
