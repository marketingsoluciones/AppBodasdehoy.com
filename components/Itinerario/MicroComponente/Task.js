import { Form, Formik } from "formik";
import { Description, Duration, Responsable, SelectIcon, Tips } from ".";
import { InputTime } from "../../Forms/inputs/InputTime";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { AuthContextProvider } from "../../../context";
import { useToast } from "../../../hooks/useToast";



export const Task = ({ itinerario, task, title }) => {
  const { domain } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const toast = useToast()
  
  const initialValues = {
    icon: !task?.icon ? "" : task?.icon,
    time: !task?.hora ? "" : task?.hora,
    duration: !task?.duracion ? "" : task?.duracion,
    description: !task?.descripcion ? "" : task?.descripcion,
    responsable: !task?.responsable ? "" : task?.responsable,
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
        {({ values, }) => {
          return (
            <Form>
              <div className=" md:grid lg:grid-cols-12 items-center justify-center md:px-10 lg:px-10 2xl:px-36 py-1" >
                <div className="md:flex lg:col-span-8 md:justify-end ">
                  
                  <SelectIcon name="icon" handleChange={handleBlurData} />

                  <div className=" py-4 md:py-0 flex md:flex-col justify-center items-center ">

                    <InputTime name="time" onBlur={() => { handleBlurData("hora", values.time) }} />

                    <Duration name="duration" onBlur={() => { handleBlurData("duracion", values.duration.toString()) }} />

                  </div>

                  <Description name="description" onBlur={() => { handleBlurData("descripcion", values.description) }} />

                  <Responsable name="responsable" handleChange={handleBlurData} itinerario={itinerario} task={task} title={title} />

                </div>

                <div className="flex lg:col-span-4 items-center ">
                  <Tips name="tips" onBlur={() => { handleBlurData("tips", values.tips) }} />
                  <div className="md:-ml-3" >
                    <MdOutlineDeleteOutline className="w-7 h-auto cursor-pointer text-gray-500 hover:text-gray-700" onClick={() => deleteTask()} />
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
