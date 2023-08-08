import { Form, Formik, FormikValues } from "formik";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda } from "../icons";
import InputField from "./InputField";
import * as yup from 'yup'
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Dispatch, FC, SetStateAction } from "react";


interface propsFormCrearMesa {
  modelo: string | null,
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
}

type initialValues = {
  nombre_mesa: string
  cantidad_sillas: number
  defPosicion: {
    x: number
    y: number
  }
  tipo: string
}

const FormCrearMesa: FC <propsFormCrearMesa> = ({modelo, set, state }) => {
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()
  
  const validationSchema = yup.object().shape({
    nombre_mesa: yup.string().required().test("Unico", "El nombre ya esta en uso", values => {
      return !event.mesas_array.map(item => item.nombre_mesa).includes(values)
  }).required("El nombre es requerido"),
    cantidad_sillas: yup.number().required("El Nº de sillas es requerido"),
  });

  
  const dicChair = {
    cuadrada: 4,
  }

  const initialValues : initialValues = {
    nombre_mesa: "",
    cantidad_sillas: dicChair[modelo],
    defPosicion: {
      x: 100,
      y: 0,
    },
    tipo: modelo,
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
      max: 12
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
      const {mesas_array} : any = await fetchApiEventos({
        query: queries.createTable,
        variables: {
          eventID: event._id,
          tableName: values.nombre_mesa,
          numberChairs: values.cantidad_sillas,
          position: values.defPosicion,
          tableType: values.tipo
        }
      })
      setEvent((old) => ({ ...old, mesas_array }));
      toast("success", "Mesa creada con exito")
    } catch (err) {
      toast("error", "Ha ocurrido un error al crear la mesa")
      console.log(err);
    } finally {
      actions.setSubmitting(false);
      set(!state)
    }
  }
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({values, isSubmitting}) => (
        <Form className="text-gray-900 grid gap-4 pt-2">
        <div className="grid-cols-3 grid gap-2 w-full">
          <span className="w-max col-span-1 m-auto inset-0">{dicc[modelo].icon}</span>
          <div className="col-span-2 flex flex-col gap-4 ">
            <InputField
              name="nombre_mesa"
              label="Nombre de mesa"
              type="text"
            />
            <InputField
          name="cantidad_sillas"
          label="N° de sillas"
          type="number"
          min={dicc[modelo].min}
          max={dicc[modelo].max}
          autoComplete="off"
          className="bg-tertiary text-primary font-semibold"
          disabled={values.tipo == "cuadrada" ? true : false}
        />
          </div>
        </div>


      <div className="w-full grid grid-cols-2 gap-4 px-4 pt-4">
        <button
          disabled={isSubmitting}
          type="submit"
          className=" bg-primary w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1  focus:outline-none"
        >
          Crear mesa
        </button>

        <button
          className=" bg-gray-200 transition w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1 focus:outline-none hover:opacity-80 "
          onClick={() => set(false)}
        >
          Cancelar
        </button>
        </div>
      </Form>
      )}
    </Formik>
  );
};

export default FormCrearMesa;