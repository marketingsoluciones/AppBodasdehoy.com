import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { Itinerary, Task } from "../../../utils/Interfaces";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { ViewItinerary } from "../../../pages/invitados";
import { useAllowed } from "../../../hooks/useAllowed";


interface props {
  itinerario: Itinerary
  view: ViewItinerary
  selectTask: string
}

export const ItineraryDetails: FC<props> = ({ itinerario, selectTask, view }) => {
  const { t } = useTranslation();
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const [task, setTask] = useState<Task>()
  const [tasks, setTasks] = useState<Task[]>()
  const [isAllowed, ht] = useAllowed()
  const [editUsers, setEditUsers] = useState<any[]>()
  const [viewUsers, setViewUsers] = useState<any[]>([])

  useEffect(() => {
    if (itinerario?.tasks?.length > 0) {
      const tasks = [...itinerario?.tasks?.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())].filter(elem => {
        return (
          view === "schema"
          || ["/itinerario"].includes(window?.location?.pathname)
          || elem.spectatorView
          || event.usuario_id === user.uid
          || isAllowed()
        ) &&
          true
      })
      setTasks(tasks)
    } else {
      setTasks([])
    }
  }, [itinerario, event])

  useEffect(() => {
    setTask(tasks?.find(elem => elem._id === selectTask))
    let editUsers = []
    event?.usuario_id === user?.uid && editUsers.push(user)
    event?.usuario_id !== user?.uid && editUsers.push(event.detalles_usuario_id)
    event?.permissions?.find(elem => elem.title === window?.location?.pathname.slice(1))?.value === "edit" && editUsers.push(user)
    editUsers = [...editUsers, ...event.detalles_compartidos_array.filter(elem => elem.permissions.find(el => el.title === window?.location?.pathname.slice(1)).value === "edit")]
    setEditUsers(editUsers)
    let viewUsers = []
    event?.usuario_id !== user?.uid && event?.permissions?.find(elem => elem.title === window?.location?.pathname.slice(1))?.value === "view" && viewUsers.push(user)
    setViewUsers(viewUsers)

  }, [selectTask, tasks, event.detalles_compartidos_array])

  return (
    <div className="pt-9 pl-6 p-2">
      <div className="flex flex-col text-xs space-y-4 h-[430px] overflow-auto">
        <div className="flex flex-col space-y-2">
          <span className="text-[13px]">Servicio seleccionado: {itinerario?.title}</span>
          <span className="text-[13px]">Total de Tasks: {itinerario?.tasks.length}</span>
          <span className="text-[13px]">Total de Tasks Visibles: {itinerario?.tasks.filter(elem => elem.spectatorView).length}</span>
          <div className="flex flex-col space-y-0.5 pl-2 border-b-[1px] border-l-[1px] border-primary pb-2">
            <span>Quienes pueden VER Y EDITAR {itinerario?.title}, y VER, EDITAR Y COMENTAR en todos los taks aunque no estén visibles:    </span>
            {editUsers?.map((elem, idx) => {
              return <span key={idx} className="inline-flex items-center space-x-1 pl-2">
                <div className="w-6 h-6 rounded-full border-[1px] border-gray-300">
                  <ImageAvatar user={elem} disabledTooltip />
                </div>
                <span className={`flex-1 ${!elem && "line-through"} text-[11px]`}>
                  {!!elem?.displayName ? elem.displayName : elem.email}
                </span>
              </span>
            })}
          </div>
        </div>
        {!!task && <div className="flex flex-col space-y-2">
          <span className="text-[13px]">Task seleccionado: {task?.descripcion}</span>
          <div className="flex flex-col space-y-0.5 pl-2">
            <span>Pueden VER Y COMENTAR este task:</span>
            {task?.spectatorView
              ? event?.detalles_compartidos_array.filter(elem => elem?.permissions?.find(el => el.title === window?.location?.pathname.slice(1)).value === "view")?.length
                ? [...viewUsers, ...event?.detalles_compartidos_array?.filter(elem => itinerario?.viewers?.includes(elem.uid) && elem?.permissions?.find(el => el.title === window?.location?.pathname.slice(1)).value === "view")].map((elem, idx) => {
                  return <span key={idx} className="inline-flex items-center space-x-1 pl-2">
                    <div className="w-6 h-6 rounded-full border-[1px] border-gray-300">
                      <ImageAvatar user={elem} disabledTooltip />
                    </div>
                    <span className={`flex-1 ${!elem && "line-through"} text-[11px]`}>
                      {!!elem?.displayName ? elem.displayName : elem.email}
                    </span>
                  </span>
                })
                : <div className="flex space-x-1 items-center">
                  <span className="pl-2">Aun no ha asignado permiso de ver a ningún usuario</span>
                </div>
              : <div className="flex space-x-1 items-center">
                <span className="pl-2">No esta activa la opción ver en este task</span>
              </div>
            }
          </div>
        </div>}
      </div>
    </div>
  )
}

