import { Form, Formik, FormikValues } from "formik";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { MesaCuadrada, MesaImperial, MesaPodio, MesaRedonda, LineaBancos, Banco, MesaMilitar } from "../icons";
import InputField from "./InputField";
import * as yup from 'yup'
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Dispatch, FC, SetStateAction } from "react";
import { table } from "../../utils/Interfaces";
import { useTranslation } from 'react-i18next';


interface propsFormCrearMesa {
  values: any,
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

export const dicc = {
  cuadrada: {
    icon: <MesaCuadrada />,
    min: 1,
    max: 24,
  },
  podio: {
    icon: <MesaPodio />,
    min: 1,
    max: 40
  },
  redonda: {
    icon: <MesaRedonda />,
    min: 3,
    max: 20
  },
  imperial: {
    icon: <MesaImperial />,
    min: 1,
    max: 40
  },
  militar: {
    icon: <MesaMilitar />,
    min: 1,
    max: 42
  },
  bancos: {
    icon: <LineaBancos />,
    min: 1,
    max: 24
  },
  banco: {
    icon: <Banco />,
    min: 1,
    max: 1
  },
};

const FormCrearMesa: FC<propsFormCrearMesa> = ({ values, set, state }) => {
  const { t } = useTranslation();
  const { modelo, offsetX, offsetY } = values

  const { event, setEvent, planSpaceActive, setPlanSpaceActive } = EventContextProvider();
  const toast = useToast()

  const validationSchema = yup.object().shape({
    nombre_mesa: yup.string().required().test("Unico", t("nameused"), values => {
      return !event.mesas_array.map(item => item.nombre_mesa).includes(values)
    }).required(t("requiredname")),
    cantidad_sillas: yup.number().required(t("requiredquantity")),
  });


  const initialValues: initialValues = {
    nombre_mesa: "",
    cantidad_sillas: undefined,
    defPosicion: {
      x: Math.round(offsetX),
      y: Math.round(offsetY),
    },
    tipo: modelo,
  }



  const handleSubmit = async (values: FormikValues, actions: any) => {
    try {
      const result: any = await fetchApiEventos({
        query: queries.createTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          values: JSON.stringify({
            title: values.nombre_mesa,
            numberChair: values.cantidad_sillas,
            position: values.defPosicion,
            rotation: 0,
            size: { width: 100, height: 80 },
            tipo: values.tipo
          })
        },
      })
      planSpaceActive.tables.push({ ...result })
      setPlanSpaceActive({ ...planSpaceActive })
      event.planSpace[event.planSpaceSelect] = planSpaceActive
      setEvent({ ...event })
      toast("success", t("Mesa creada con exito"))
    } catch (err) {
      toast("error", t("Ha ocurrido un error al crear la mesa"))
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
      {({ values, isSubmitting }) => {
        return (
          <Form className="text-gray-900 grid gap-4 pt-2">
            <div className="grid-cols-3 grid gap-2 w-full">
              <span className="w-max col-span-1 m-auto inset-0">{dicc[modelo].icon}</span>
              <div className="col-span-2 flex flex-col gap-4 ">
                <InputField
                  name="nombre_mesa"
                  label={t("nametable")}
                  type="text"
                  autoFocus
                  className="font-semibold"
                />
                <InputField
                  name="cantidad_sillas"
                  label={t("numberchairs")}
                  type="number"
                  min={dicc[modelo].min}
                  max={dicc[modelo].max}
                  autoComplete="off"
                  className="font-semibold"
                // disabled={values.tipo == "cuadrada" ? true : false}
                />
              </div>
            </div>


            <div className="w-full grid grid-cols-2 gap-4 px-4 pt-4">
              <button
                disabled={isSubmitting}
                type="submit"
                className=" bg-primary w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1  focus:outline-none"
              >
                {t("createtable")}
              </button>

              <button
                className=" bg-gray-200 transition w-full text-white font-semibold mx-auto inset-x-0 rounded-xl py-1 focus:outline-none hover:opacity-80 "
                onClick={() => set(false)}
              >
                {t("cancel")}
              </button>
            </div>
          </Form>
        )
      }}
    </Formik>
  );
};

export default FormCrearMesa;