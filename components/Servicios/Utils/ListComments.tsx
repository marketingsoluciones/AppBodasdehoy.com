import { ComponentType, FC, HTMLAttributes, useEffect, useState } from "react"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { MdOutlineDeleteOutline } from "react-icons/md"
import { Comment, Itinerary, Task } from "../../../utils/Interfaces"
import { ImageAvatar } from "../../Utils/ImageAvatar"
import { Interweave } from "interweave"
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink"
import Link from "next/link"
import { detalle_compartidos_array } from "../../../utils/Interfaces"
import { useRouter } from "next/router"
import { TempPastedAndDropFile } from "../../Itinerario/MicroComponente/ItineraryPanel"
import { FileIconComponent } from "../../Itinerario/MicroComponente/FileIconComponent"
import { CgSoftwareDownload } from "react-icons/cg"
import { deleteObject, getStorage, listAll, ref } from "firebase/storage"
import { downloadFile } from "../../Utils/storages"
import { useTranslation } from "react-i18next"
import { useToast } from "../../../hooks/useToast"
import { useAllowed } from "../../../hooks/useAllowed"

interface props extends HTMLAttributes<HTMLDivElement> {
  itinerario: Itinerary
  task: Task
  item: Comment
  identifierDisabled?: boolean
  tempPastedAndDropFiles?: TempPastedAndDropFile[]
  nicknameUnregistered?: string
  onCommentDeleted?: (commentId: string) => void // Nueva prop para notificar eliminación
  showDeleteButton?: boolean // Nueva prop para controlar si mostrar el botón de eliminar
}

export const ListComments: FC<props> = ({ 
  itinerario, 
  task, 
  item, 
  identifierDisabled, 
  tempPastedAndDropFiles, 
  nicknameUnregistered, 
  onCommentDeleted,
  showDeleteButton = false, // Por defecto no mostrar el botón (se maneja desde el padre)
  ...props 
}) => {
  const { user, config } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()
  const router = useRouter()
  const userAsd = event?.detalles_compartidos_array
    ? [...event?.detalles_compartidos_array, event?.detalles_usuario_id, user]?.find(elem => elem?.uid === item?.uid) as detalle_compartidos_array
    : undefined
  const temp = tempPastedAndDropFiles?.find(elem => elem?.commentID === item?._id)?.files
  const storage = getStorage();
  const { t } = useTranslation();
  const toast = useToast()

  useEffect(() => {
    if (router.query?.task) {
      document.getElementById(`${router.query.task}`)?.scrollIntoView({ behavior: 'smooth' });
    }
    if (router.query?.comment) {
      router.push(`${window.location.origin}${window.location.pathname}`)
    }
  }, [router])

  // Función mejorada para eliminar comentarios que puede ser reutilizada
  const handleDelete = async () => {
    if (!isAllowed()) {
      ht();
      return;
    }

    try {
      // Eliminar archivos del storage
      const storageRef = ref(storage, `event-${event?._id}//itinerary-${itinerario?._id}//task-${task._id}//comment-${item?._id}`)
      
      try {
        const res = await listAll(storageRef);
        await Promise.all(res.items.map(itemRef => deleteObject(itemRef)));
      } catch (storageError) {
        console.error(`Error al eliminar archivos del storage:`, storageError);
        // Continuar aunque falle la eliminación de archivos
      }

      // Eliminar comentario de la API
      await fetchApiEventos({
        query: queries.deleteComment,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          commentID: item?._id
        },
        domain: config.domain
      });

      // Actualizar estado global
      setEvent((prevEvent) => {
        const newEvent = { ...prevEvent };
        const f1 = newEvent.itinerarios_array.findIndex(elm => elm._id === itinerario._id);
        
        if (f1 !== -1) {
          const f2 = newEvent.itinerarios_array[f1].tasks.findIndex(elm => elm._id === task._id);
          
          if (f2 !== -1) {
            const f3 = newEvent.itinerarios_array[f1].tasks[f2].comments.findIndex(elm => elm._id === item?._id);
            
            if (f3 !== -1) {
              newEvent.itinerarios_array[f1].tasks[f2].comments.splice(f3, 1);
            }
          }
        }
        
        return newEvent;
      });

      // Notificar al componente padre si se proporciona el callback
      if (onCommentDeleted && typeof onCommentDeleted === 'function') {
        onCommentDeleted(item._id);
      }

      toast('success', t('Comentario eliminado'));
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      toast('error', t('Error al eliminar comentario'));
    }
  }

  const replacesLink: ComponentType<UrlProps> = (props) => {
    return (
      <Link href={props?.url}>
        <a className="text-xs break-all underline" target="_blank"  >{props?.children}</a>
      </Link>
    )
  };

  // Verificar si el usuario puede eliminar este comentario
  const canDeleteComment = () => {
    // El usuario puede eliminar si:
    // 1. Tiene permisos generales (isAllowed)
    // 2. Es el autor del comentario y está autenticado
    // 3. Es el autor del comentario con nickname y han pasado menos de 5 minutos
    
    if (isAllowed()) {
      return true;
    }
    
    if (user && user.uid === item?.uid && user?.displayName !== "anonymous") {
      return true;
    }
    
    if (item?.nicknameUnregistered === nicknameUnregistered && 
        (new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 < 300 && 
        user?.displayName === "anonymous") {
      return true;
    }
    
    return false;
  };

  return (
    <div className={`flex flex-col w-full px-2 py-1 border-t-[1px] hover:bg-gray-100 relative`} {...props}>
      <div className='flex flex-1 items-start w-full'>
        <div className="w-8 h-8">
          {!identifierDisabled
            ? <div
              className='bg-gray-300 w-8 h-8 rounded-full mt-1 flex items-center justify-center cursor-pointer'>
              <ImageAvatar user={userAsd} disabledTooltip />
            </div>
            : <div className="w-8 h-8" />}
        </div>
        <div className="flex flex-col flex-1 px-1.5 w-[85%]">
          <span className="text-[11px] mt-2.5 font-semibold my-emoji">{userAsd?.displayName ? userAsd.displayName : item?.nicknameUnregistered}</span>
          <div className="grid grid-cols-2 gap-3 max-w-[280px] ">
            {(temp ? temp : item?.attachments)?.map((elem: any, idx: number) => {
              return <div key={idx} className="bg-gray-300 col-span-1 flex flex-col items-center w-[130px] h-[80px] rounded-lg overflow-hidden" >
                <div className="flex-1 w-full flex justify-center items-center relative">
                  {!elem?.loading && <div className="absolute z-20 right-3 top-2 text-gray-600 hover:text-gray-800 cursor-pointer"
                    onClick={() => {
                      downloadFile(storage, `event-${event._id}//itinerary-${itinerario._id}//task-${task._id}//comment-${item._id}//${elem?.name ?? elem?.file?.name}`)
                        .catch((error) => toast("error", `${t("Ha ocurrido un error")}`))
                    }} >
                    <CgSoftwareDownload className="w-6 h-6" />
                  </div>}
                  {elem?.loading &&
                    <>
                      <div className="bg-white absolute w-full h-full opacity-25 flex justify-center items-center" />
                      <div className="absolute loader ease-linear rounded-full border-[3px] border-black border-opacity-35 w-4 h-4" />
                    </>
                  }
                  <div className="w-full h-[54px] flex flex-col items-center justify-center">
                    <FileIconComponent extension={(elem?.name ?? elem?.file?.name)?.split(".")?.slice(-1)[0]} className="w-10 h-10 mb-2 border-[1px] border-gray-300 rounded-[5px]" />
                  </div>
                </div>
                <div className="w-full flex flex-col items-center px-2 cursor-default">
                  <span className="w-full text-[10px] truncate text-center">{elem?.name ?? elem?.file?.name}</span>
                  <span className="text-gray-800 text-[9px] select-none">{Math.trunc((elem?.size ?? elem?.file?.size) / 1024)} K</span>
                </div>
              </div>
            }
            )}
          </div>
          <div className="w-[65vw] md:w-full overflow-hidden text-ellipsis whitespace-nowrap" >
            <Interweave
              className="text-xs transition-all my-emoji"
              content={item?.comment}
              matchers={[
                new UrlMatcher('url', {}, replacesLink),
                new HashtagMatcher('hashtag')
              ]}
            />
          </div>
        </div>
        
        {/* Botón de eliminar - Solo mostrar si showDeleteButton es true O si canDeleteComment */}
{/*         <div className="w-5">
          {(showDeleteButton || canDeleteComment()) && (
            <MdOutlineDeleteOutline 
              onClick={handleDelete} 
              className="absolute w-5 h-5 cursor-pointer right-2 bottom-5 text-gray-600 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" 
              title={t('Eliminar comentario')}
            />
          )}
        </div> */}
      </div>
      <span className='cursor-default justify-end text-[9px] font-medium flex-1 flex right-0'>
        {new Date(item?.createdAt).toLocaleString()}
      </span>
      <style jsx>{`
      .whitespace-pre {
        white-space: pre-wrap;
      }
      `}</style>
      <style jsx>
        {`
                .loader {
                    border-top-color:  ${config?.theme?.primaryColor};
                    -webkit-animation: spinner 1.5s linear infinite;
                    animation: spinner 1.5s linear infinite;
                }
                @-webkit-keyframes spinner {
                    0% {
                    -webkit-transform: rotate(0deg);
                    }
                    100% {
                    -webkit-transform: rotate(360deg);
                    }
                }
                @keyframes spinner {
                    0% {
                    transform: rotate(0deg);
                    }
                    100% {
                    transform: rotate(360deg);
                    }
                }
                `}
      </style>
    </div>
  )
}

// Función de utilidad exportada que puede ser usada por otros componentes
export const deleteCommentFromStorage = async (
  storage: any,
  eventId: string,
  itinerarioId: string,
  taskId: string,
  commentId: string
) => {
  try {
    const storageRef = ref(storage, `event-${eventId}//itinerary-${itinerarioId}//task-${taskId}//comment-${commentId}`);
    const res = await listAll(storageRef);
    await Promise.all(res.items.map(itemRef => deleteObject(itemRef)));
  } catch (error) {
    console.error('Error al eliminar archivos del storage:', error);
    throw error;
  }
};

// Función de utilidad exportada para eliminar comentario de la API
export const deleteCommentFromAPI = async (
  eventId: string,
  itinerarioId: string,
  taskId: string,
  commentId: string,
  domain: string
) => {
  try {
    await fetchApiEventos({
      query: queries.deleteComment,
      variables: {
        eventID: eventId,
        itinerarioID: itinerarioId,
        taskID: taskId,
        commentID: commentId
      },
      domain
    });
  } catch (error) {
    console.error('Error al eliminar comentario de la API:', error);
    throw error;
  }
};