import { Form, Formik } from "formik";
import { EventContextProvider } from "../../context";
import InputField from "./InputField";
import * as yup from "yup";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { BorrarIcon, IconLocationFood } from "../icons";
import { useTranslation } from 'react-i18next';

const validationSchema = yup.object().shape({
  nombre: yup.string().required(),
});

const initialValues = {
  nombre: "",
};


const FormCrearMenu = ({ set, state }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();

  const handleSubmit = async (values, actions) => {
    try {
      const { menus_array }: any = await fetchApiEventos({
        query: queries.createMenu,
        variables: {
          eventID: event._id,
          name: values.nombre,
        },
      });
      setEvent((old) => ({
        ...old,
        menus_array,
      }));
      toast("success", "Menú creado con exito");
    } catch (error) {
      console.log(error);
      toast("error", "Ha ocurrido un error al crear el grupo");
    } finally {
      actions.resetForm()
    }
  };

  const handleDeleteMenu = async (value: string) => {
    try {
      const { menus_array }: any = await fetchApiEventos({
        query: queries.deleteMenu,
        variables: {
          eventID: event._id,
          name: value,
        },
      });
      setEvent((old) => {
        const invitados_array = old.invitados_array.map(elem => elem.nombre_menu == value ? { ...elem, nombre_menu: null } : elem)
        return ({
          ...old,
          menus_array,
          invitados_array
        })
      });
      toast("success", "Menú borrado con exito");
    } catch (error) {
      console.log(error);
      toast("error", "Ha ocurrido un error al borrar el grupo");
    }
  };

  return (
    <>
      <div className="w-full">
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
        >
          {({ isSubmitting }) => (
            <Form className="w-full">
              <div className="border-l-2 border-gray-100 pl-3 w-full ">
                <h2 className="font-display text-3xl capitalize text-primary font-light">
                  {t("create")} <br />{" "}
                  <span className="font-display text-5xl capitalize text-gray-500 font-medium">
                    {t("menu")}
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
                      label={t("namemenu")}
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
                  {t("createmenu")}
                </button>
              </div>
            </Form>
          )}
        </Formik>
        <div className="h-[240px] overflow-auto">
          {event.menus_array.length > 0 && event?.menus_array.map((item: any, idx: any) => {
            return (
              <div key={idx} className="flex flex-cols items-center font-display justify-between w-full capitalize hover:bg-base transition py-2 px-5">
                <div className="flex items-center">
                  <IconLocationFood className="text-gray-500 w-4 h-4" />
                  <span className="ml-2">{item.nombre_menu}</span>
                </div>
                <div className="cursor-pointer" onClick={() => { handleDeleteMenu(item.nombre_menu) }}>
                  <BorrarIcon className="text-gray-500 w-4 h-4" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  );
};

export default FormCrearMenu;
