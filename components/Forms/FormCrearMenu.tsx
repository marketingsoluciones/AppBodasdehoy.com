import { Form, Formik } from "formik";
import { EventContextProvider } from "../../context";
import InputField from "./InputField";
import * as yup from "yup";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { useState } from "react";

const validationSchema = yup.object().shape({
  nombre: yup.string().required(),
});

const initialValues = {
  nombre: "",
};


const FormCrearMenu = ({ set, state,guardarMenu,setGuardarMenu ,menu  }) => {
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();

  const handleSubmit = async (values, actions) => {
    try {
      const { grupos_array }: any = await fetchApiEventos({
        query: queries.createGroup,
        variables: {
          eventID: event._id,
          name: values.nombre,
        },
      });
      setEvent((old) => ({
        ...old,
        grupos_array,
      }));
      toast("success", "Grupo creado con exito");
    } catch (error) {
      console.log(error);
      toast("error", "Ha ocurrido un error al crear el grupo");
    } finally {
      set(!state);
      actions.setSubmitting(false);
    }
  };

  const selectMenu = (e) => {
    setGuardarMenu(e.target.value)
  }
  
  return (
    <>
      <div className="border-l-2 border-gray-100 pl-3 w-full ">
        <h2 className="font-display text-3xl capitalize text-primary font-light">
          Crea tu <br />{" "}
          <span className="font-display text-5xl capitalize text-gray-500 font-medium">
            Menu
          </span>{" "}
        </h2>
      </div>
      <div className="flex flex-col gap-5 py-6 w-full">
        <div className="grid grid-cols-1 gap-4 ">
          <div className="flex items-center box-content w-full">
            <img
              src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
              alt="imagen-invitados"
              className="w-12 h-12 rounded-full mr-6 "
            />

            <input
              onChange={selectMenu}
              className={`font-display text-sm text-gray-500 border border-gray-100 focus:border-primary transition w-full py-2 px-4 rounded-xl focus:outline-none transition `}
              type="text"
              name="menuu"
            />

            {/* <select onChange={selectMenu} value={seletMenu} className="font-display text-sm text-gray-500 border border-gray-100 focus:border-primary transition w-full py-2 pr-7 rounded-xl focus:outline-none transition cursor-pointer" >
             
              {menu?.map((item, idx) => (
                <option key={idx} value={item.nombre}>{item.nombre}</option>
              ))}
            </select>*/}
          </div>
        </div>
        <button

          onClick={(e) => menu.push(guardarMenu)}
          className={` bg-primary font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 `}
        >
          Guardar menu
        </button>
      </div>
      <div>
        {/*  <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
        >
          {({ isSubmitting }) => (
            <Form className="w-full">
              <div className="border-l-2 border-gray-100 pl-3 w-full ">
                <h2 className="font-display text-3xl capitalize text-primary font-light">
                  Crear <br />{" "}
                  <span className="font-display text-5xl capitalize text-gray-500 font-medium">
                    Menu
                  </span>{" "}
                </h2>
              </div>
              <div className="flex flex-col gap-5 py-6 w-full">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center box-content">
                    <img
                      src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                      alt="imagen-invitados"
                      className="w-12 h-12 rounded-full mr-6 "
                    />
                    <InputField
                      name="nombre"
                      label="Nombre del grupo"
                      type="text"
                    />
                  </div>
                </div>
                <button
                  className={`font-display rounded-full mt-4 py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"
                    }`}
                  disabled={isSubmitting}
                  type="submit"
                >
                  Crear grupo
                </button>
              </div>
            </Form>
          )}
        </Formik> */}
      </div>
    </>

  );
};

export default FormCrearMenu;
