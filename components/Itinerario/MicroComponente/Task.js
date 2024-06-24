import { Form, Formik } from "formik";
import { Description, Duration, Responsable, SelectIcon, Tips } from ".";
import { InputTime } from "../../Forms/inputs/InputTime";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { AuthContextProvider } from "../../../context";
import { useToast } from "../../../hooks/useToast";
import { EstatusItinerario } from "./EstatusItinerario";
import { WorkFlowItinerario } from "./WorkFlowItinerario";

export const Task = ({ itinerario, task, title, disable, ht, setModalStatus, modalStatus, setModalWorkFlow, modalWorkFlow }) => {
  const { domain } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const toast = useToast()

  const initialValues = {
    icon: !task?.icon ? "" : task?.icon,
    time: !task?.hora ? "" : task?.hora,
    duration: !task?.duracion ? "" : task?.duracion,
    description: !task?.descripcion ? "" : task?.descripcion,
    responsable: !task?.responsable ? [] : task?.responsable,
    tips: !task?.tips ? "" : task?.tips,
  }

  const handleBlurData = async (variable, valor) => {
    try {
      const result = await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          variable,
          valor: variable == "responsable" ? JSON.stringify(valor) : valor
        },
        domain
      })
      setEvent((old) => {
        const f1 = old.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
        const f2 = old.itinerarios_array[f1].tasks.findIndex(elem => elem._id === task._id)
        old.itinerarios_array[f1].tasks[f2][`${variable}`] = valor
        return { ...old }
      })
    } catch (error) {
      console.log(error)
    }
  }

  const deleteTask = async () => {
    try {
      await fetchApiEventos({
        query: queries.deleteTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
        },
        domain
      })
      setEvent((old) => {
        const f1 = old.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
        const f2 = old.itinerarios_array[f1].tasks.findIndex(elem => elem._id === task._id)
        old.itinerarios_array[f1].tasks.splice(f2, 1)
        return { ...old }
      })
      toast("success", "La actividad fue borrada");

    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>

      <Formik enableReinitialize initialValues={initialValues} >
        {({ values }) => {
          return (
            <Form className="">
              <div className=" md:grid grid-cols-12 items-center justify-center 2xl:px-36 py-1  " >

                <div className=" grid grid-cols-2 md:grid-cols-3 col-span-3 py-5 md:py-0 ">
                  <SelectIcon name="icon" handleChange={handleBlurData} disable={disable} ht={ht} />
                  <div className="  flex flex-col justify-center md:items-center md:col-span-2 ">
                    <InputTime name="time" onBlur={() => { handleBlurData("hora", values.time) }} disable={disable} ht={ht} />
                    <Duration name="duration" onBlur={() => { handleBlurData("duracion", values.duration.toString()) }} disable={disable} ht={ht} />
                  </div>
                </div>

                <div className="col-span-3 px-8 md:px-0">
                  <Description name="description" onBlur={() => { handleBlurData("descripcion", values.description) }} disable={disable} ht={ht} />
                </div>

                <div className="col-span-1 py-3 md:py-0">
                  <Responsable name="responsable" handleChange={handleBlurData} itinerario={itinerario} task={task} title={title} disable={disable} ht={ht} />
                </div>

                <div className="col-span-4 md:-mr-3* mr-6 px-8 md:px-0 ">
                  <Tips name="tips" onBlur={() => { handleBlurData("tips", values.tips) }} disable={disable} ht={ht} />
                </div>

                <div className="flex items-center justify-center py-3 md:py-0 space-x-2">
                  <EstatusItinerario setModalStatus={setModalStatus} modalStatus={modalStatus} />
                  <WorkFlowItinerario setModalWorkFlow={setModalWorkFlow} modalWorkFlow={modalWorkFlow} />
                  <div>
                    <MdOutlineDeleteOutline className="w-7 h-auto cursor-pointer text-gray-500 hover:text-gray-700" onClick={() => disable ? ht() : deleteTask()} />
                  </div>
                </div>
              </div>
            </Form>
          )
        }}
      </Formik>
    </>
  )
}
