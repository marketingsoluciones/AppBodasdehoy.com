import { FC } from "react";
import { useEffect, useMemo, useState, } from "react";
import { DotsOpcionesIcon, InvitacionesIcon, PencilEdit } from "../../icons";
import useHover from "../../../hooks/useHover";
import { ConfirmationBlock } from "../../Invitaciones/ConfirmationBlock"
import { DataTable } from "../../Invitaciones/DataTable"
import { getRelativeTime } from "../../../utils/FormatTime";
import { useTranslation } from 'react-i18next';
import { boolean } from "yup";
import { IoIosAttach } from "react-icons/io";
import { GruposResponsablesArry } from "./ResponsableSelector";
import { ItineraryTable } from "./ItineraryTable";
import ClickAwayListener from "react-click-away-listener";
import { HiOutlineViewList } from "react-icons/hi";
import { LiaIdCardSolid, LiaLinkSolid } from "react-icons/lia";
import { GoEyeClosed, GoGitBranch } from "react-icons/go";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { EditTastk } from "./ItineraryPanel";
import { useAllowed } from "../../../hooks/useAllowed";
import { CgSoftwareDownload } from "react-icons/cg";
import { getBytes, getMetadata, getStorage, ref } from "firebase/storage";
import { Itinerary } from "../../../utils/Interfaces";
import { event } from "../../../gtas";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { ImageAvatar } from "../../Utils/ImageAvatar";

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
  optionsItineraryButtonBox: any
  selectTask: string
  setSelectTask: any
  itinerario: Itinerary
}

interface propsCell {
  data: any
  justifyCenter?: boolean
}

const resolveCell = ({ data, justifyCenter }: propsCell) => {
  const value = data.cell.value
  if (Array.isArray(value)) {
    return (
      <div className="w-full text-gray-900 bg-blue-400">
        {value.map((elem, idx) => {
          return (
            <span key={idx} className="inline-flex ml-2 items-center">
              <img alt={elem} src={[]?.find(el => el.title.toLowerCase() === elem.toLowerCase())?.icon} className="w-6 h-6" />
              <span>
                {elem}
              </span>
            </span>
          )
        })}
      </div>
    )
  }
  return (
    <div className={`flex w-full ${justifyCenter && "justify-center"}`}>
      {data.cell.value}
    </div>
  )
}

export const ItineraryColumns: FC<props> = ({ data = [], multiSeled = true, reenviar = true, activeFunction, setModalStatus, modalStatus, setModalWorkFlow, modalWorkFlow, setModalCompartirTask, modalCompartirTask, deleteTask, showEditTask, setShowEditTask, optionsItineraryButtonBox, selectTask, setSelectTask, itinerario }) => {
  const { event } = EventContextProvider()
  const { user } = AuthContextProvider()
  const { t } = useTranslation();
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([])
  const [isAllowed, ht] = useAllowed()
  const disable = !isAllowed("itinerario")
  const storage = getStorage();

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

  const Columna = useMemo(
    () => [
      {
        Header: t("título"),
        accessor: "descripcion",
        id: "description",
        Cell: (data) => (
          <span key={data.cell.row.id} className="font-bold">
            {data.cell.value}
          </span>
        )
      },
      {
        Header: t("fecha"),
        accessor: "fecha",
        id: "date",
        Cell: (data) => (
          <div key={data.cell.row.id} className="flex w-full justify-center">
            {!!data.cell.value && new Date(data.cell.value).toLocaleString()}
          </div>
        )
      },
      {
        Header: `${t("duración")} min`,
        accessor: "duracion",
        id: "duration",
        Cell: (data) => (
          <div key={data.cell.row.id} className="flex w-full justify-center">
            {data.cell.value}
          </div>
        )
      },
      {
        Header: t("responsables"),
        accessor: "responsable",
        id: "responsables",
        Cell: (data) =>
          <div key={data.cell.row.id} className="w-full">
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
                    {elem}
                  </span>
                </span>
              )
            })}
          </div>
      },
      {
        Header: t("tips"),
        accessor: "tips",
        id: "tips",
        Cell: (data) => {
          return (
            <div key={data.cell.row.id} className="w-full">
              <div dangerouslySetInnerHTML={{ __html: data?.cell?.value }} />
            </div>
          )
        }
      },
      {
        Header: t("archivos adjuntos"),
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
        Header: t("eqiquetas"),
        accessor: "tags",
        id: "tags",
        Cell: (data) => (
          <p key={data.cell.row.id} className="space-y-1 -mr-1">
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
      {
        id: "selection",
        Cell: (data) => {
          const [show, setShow] = useState(false)
          const [value, setValue] = useState("")
          return (
            <div key={data.cell.row.id} className="relative w-full h-full flex justify-center *bg-red">
              <div onClick={() => { setShowEditTask({ state: !showEditTask.state, values: data.cell.row.original }) }} className="hidden md:flex text-gray-600 cursor-pointer w-4 h-6 items-center justify-center *bg-blue-400">
                <PencilEdit className="w-5 h-5" />
              </div>
              <ClickAwayListener onClickAway={() => show && setShow(false)} >
                <div onClick={() => setShow(!show)} className="w-full h-4 flex justify-center" >
                  <div className="text-gray-900 cursor-pointer w-4 h-6 flex items-center justify-center *bg-blue-400">
                    <DotsOpcionesIcon className={`${!show ? "text-gray-600" : "text-gray-900"} w-4 h-4`} />
                  </div>
                  {show && <div className={`absolute right-9 top-0 bg-white z-50 rounded-md shadow-md`}>
                    {optionsItineraryButtonBox?.map((item, idx) =>
                      <div key={idx}
                        onClick={() => {
                          setValue(item.value)
                          setShow(false)
                          item?.onClick(data.cell.row.original, itinerario)
                        }}
                        className={`${item.value === "edit" ? "flex md:hidden" : "flex"} p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 ${item.value === value && "bg-gray-200"}`}
                      >
                        {item.icon}
                        <span className="flex-1 leading-[1]">
                          {item.title}
                        </span>
                      </div>
                    )}
                  </div>}
                </div>
              </ClickAwayListener>
            </div>
          )
        }
      },
    ],
    [itinerario]
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