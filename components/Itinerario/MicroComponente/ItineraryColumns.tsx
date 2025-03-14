import { ComponentType, FC } from "react";
import { useMemo, useState, } from "react";
import { ConfirmationBlock } from "../../Invitaciones/ConfirmationBlock"
import { useTranslation } from 'react-i18next';
import { GruposResponsablesArry } from "./ResponsableSelector";
import { ItineraryTable } from "./ItineraryTable";
import { GoEye } from "react-icons/go";
import { EditTastk } from "./ItineraryPanel";
import { useAllowed } from "../../../hooks/useAllowed";
import { CgSoftwareDownload } from "react-icons/cg";
import { getBytes, getMetadata, getStorage, ref } from "firebase/storage";
import { Itinerary, OptionsSelect } from "../../../utils/Interfaces";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink";
import i18next from "i18next";
import Link from "next/link";
import { useToast } from "../../../hooks/useToast";
import { IniterarySelectionMenu } from "./InitinerarySelectionMenu"


interface props {
  data?: any[],
  multiSeled?: boolean,
  reenviar?: boolean,
  activeFunction?: any
  setModalStatus: any
  modalStatus: any
  setModalWorkFlow: any
  modalWorkFlow: any
  setModalCompartirTask: any
  modalCompartirTask: any
  deleteTask: any
  showEditTask: EditTastk
  setShowEditTask: any
  optionsItineraryButtonBox: OptionsSelect[]
  selectTask: string
  setSelectTask: any
  itinerario: Itinerary
}

export const ItineraryColumns: FC<props> = ({ data = [], multiSeled = true, reenviar = true, activeFunction, setModalStatus, modalStatus, setModalWorkFlow, modalWorkFlow, setModalCompartirTask, modalCompartirTask, deleteTask, showEditTask, setShowEditTask, optionsItineraryButtonBox, selectTask, setSelectTask, itinerario }) => {
  const { event } = EventContextProvider()
  const { user } = AuthContextProvider()
  const { t } = useTranslation();
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([])
  const [isAllowed, ht] = useAllowed()
  const storage = getStorage();
  const toast = useToast()

  const handleDownload = async ({ elem, task }) => {
    try {
      const storageRef = ref(storage, `${task._id}//${elem.name}`)
      const metaData = await getMetadata(storageRef)
      getBytes(storageRef).then(buffer => {
        const blob = new Blob([buffer], { type: metaData.contentType })
        const file = new File([blob], elem.name, { type: metaData.contentType })
        const url = window.URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', elem.name)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    } catch (error) {
      console.log(10003, error)
    }
  }

  const replacesLink: ComponentType<UrlProps> = (props) => {
    return (
      <Link href={props?.url}>
        <a className="text-xs break-all underline" target="_blank"  >{props?.children}</a>
      </Link>
    )
  };

  const Columna = useMemo(
    () => [
      {
        Header: t("title"),
        accessor: "descripcion",
        id: "description",
        className: 'sticky *lg:static z-10 left-0 relative',
        Cell: (data) => {
          return (
            <div className="flex w-full items-center ">
              <span key={data.cell.row.id} className="font-bold flex-1 pr-10">
                {data.cell.value}
              </span>
              <div className="absolute right-0 z-20">
                <IniterarySelectionMenu data={data} itinerario={itinerario} optionsItineraryButtonBox={optionsItineraryButtonBox} setShowEditTask={setShowEditTask} showEditTask={showEditTask} />
              </div>
              {(isAllowed() && data.cell.row.original.spectatorView) && <div className="absolute right-6">
                <GoEye className="w-4 h-4" />
              </div>}
            </div>
          )
        }
      },
      {
        Header: t("date"),
        accessor: "fecha",
        id: "date",
        Cell: (data) => (
          <div key={data.cell.row.id} className="flex w-full justify-center items-center">
            {!!data.cell.value && new Date(data.cell.value).toLocaleString()}
          </div>
        )
      },
      {
        Header: t("duracion"),
        accessor: "duracion",
        id: "duration",
        Cell: (data) => {
          return (
            <div key={data.cell.row.id} className="flex w-full justify-center items-center">
              {data.cell.value} {!!data.cell.value && "min"}
            </div>
          )
        }
      },
      {
        Header: t("responsible"),
        accessor: "responsable",
        id: "responsables",
        Cell: (data) => {
          const userSelect = GruposResponsablesArry.find(el => {
            return el.title.toLowerCase() === data.cell.value[0]?.toLowerCase()
          }) ?? [user, event?.detalles_usuario_id, ...event.detalles_compartidos_array].find(el => {
            return el?.displayName?.toLowerCase() === data.cell.value[0]?.toLowerCase()
          })

          const [showModal, setShowModal] = useState(false);

          const handleMouseOver = () => {
            setShowModal(true);
          };

          const handleMouseOut = () => {
            setShowModal(false);
          };

          if (data.cell.value.length > 0) {
            return (
              <div className="w-full relative flex flex-col items-start justify-center">
                {/*  <span onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} className="inline-flex items-center space-x-1 cursor-pointer ">
                  <div className="w-8 h-8 rounded-full border-[1px] border-gray-300 relative">
                    <ImageAvatar user={userSelect} />
                    {data.cell.value.length > 1 &&
                      <div className="absolute top-4 left-4 bg-primary rounded-full h-5 w-5 text-center text-white text-[10px] flex items-center justify-center">
                        {data.cell.value.length - 1}+
                      </div>}
                  </div>
                </span>
                {showModal && (
                  <div className="absolute bg-white p-2 rounded-md space-y-1 shadow-md top-16 transition-all delay-75 ">
                    {data?.cell?.value?.map((elem, idx) => {
                      const userSelect = GruposResponsablesArry.find(el => {
                        return el.title.toLowerCase() === elem?.toLowerCase()
                      }) ?? [user, event?.detalles_usuario_id, ...event.detalles_compartidos_array].find(el => {
                        return el?.displayName?.toLowerCase() === elem?.toLowerCase()
                      })

                      return (
                        <span key={idx} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} className="flex items-center space-x-1">
                          <div className="w-6 h-6 rounded-full border-[1px] border-gray-300">
                            <ImageAvatar user={userSelect} />
                          </div>
                          <span className={`flex-1 ${!userSelect && "line-through"}`}>
                            {elem}
                          </span>
                        </span>
                      )
                    })}
                  </div>
                )} */}

                {data?.cell?.value?.map((elem, idx) => {
                  const userSelect = GruposResponsablesArry.find(el => {
                    return el.title.toLowerCase() === elem?.toLowerCase()
                  }) ?? [user, event?.detalles_usuario_id, ...event.detalles_compartidos_array].find(el => {
                    return el?.displayName?.toLowerCase() === elem?.toLowerCase()
                  })
                  return (
                    <span key={idx} className="inline-flex items-center space-x-1">
                      <div className="w-6 h-6 rounded-full border-[1px] border-gray-300">
                        <ImageAvatar user={userSelect} />
                      </div>
                      <span className={`flex-1 ${!userSelect && "line-through"}`}>
                        {!userSelect ? elem : userSelect.displayName ? userSelect.displayName : userSelect.email}
                      </span>
                    </span>
                  )
                })}

              </div>

            )
          }
        }
      },
      {
        Header: t("tips"),
        accessor: "tips",
        id: "tips",
        Cell: (data) => {
          return (
            <div key={data.cell.row.id} className="w-full pt-3">
              <Interweave
                className="text-xs flex-1 pr-4 break-words"
                content={data?.cell?.value}
                matchers={[
                  new UrlMatcher('url', {}, replacesLink),
                  new HashtagMatcher('hashtag')
                ]}
              />
            </div>
          )
        }
      },
      {
        Header: t("attachments"),
        accessor: "attachments",
        id: "attachments",
        Cell: (data) => {
          return (
            <div key={data.cell.row.id} className="w-full space-y-2 md:space-y-1.5" >
              {data?.cell?.value?.map((elem, idx) => {
                return (
                  !!elem._id && <span key={idx} onClick={() => {
                    handleDownload({ elem, task: data.cell.row.original })
                  }} className="inline-flex items-center max-w-[90%] border-b-[1px] hover:font-bold border-gray-500 cursor-pointer mr-2">
                    <span className="flex-1 truncate">
                      {elem.name}
                    </span>
                    <CgSoftwareDownload className="w-4 h-auto" />
                  </span>
                )
              })}
            </div>
          )
        }
      },
      {
        Header: t("labels"),
        accessor: "tags",
        id: "tags",
        Cell: (data) => (
          <p key={data.cell.row.id} className="space-y-1 -mr-1 pt-1">
            {data?.cell?.value?.map((elem, idx) => {
              return (
                <span key={idx} className="inline-flex w-max-full space-x-1 border-[1px] border-gray-400 px-1 pt-[1px] pb-[2px] rounded-md break-all mr-1 leading-[1]">
                  {elem}
                </span>
              )
            })}
          </p>
        )
      },
      // {
      //   id: "selection",
      //   Cell: <IniterarySelectionMenu data={data} itinerario={itinerario} optionsItineraryButtonBox={optionsItineraryButtonBox} setShowEditTask={setShowEditTask} showEditTask={showEditTask} />
      // },
    ],
    [itinerario, i18next.language]
  );

  return (
    <div className="">
      {arrEnviarInvitaciones.length > 0 && (
        <ConfirmationBlock
          arrEnviarInvitaciones={arrEnviarInvitaciones}
          set={(act) => setArrEnviatInvitaciones(act)}
        />
      )}
      <ItineraryTable
        columns={Columna}
        data={data}
        multiSeled={multiSeled}
        setArrEnviatInvitaciones={setArrEnviatInvitaciones}
        reenviar={reenviar}
        activeFunction={activeFunction}
        selectTask={selectTask}
        setSelectTask={setSelectTask}
      />
    </div>
  );
};