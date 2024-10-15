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
import { ResponsablesArry } from "./ResponsableSelector";
import { ItineraryTable } from "./ItineraryTable";
import ClickAwayListener from "react-click-away-listener";
import { HiOutlineViewList } from "react-icons/hi";
import { LiaIdCardSolid, LiaLinkSolid } from "react-icons/lia";
import { GoEyeClosed, GoGitBranch } from "react-icons/go";
import { MdOutlineDeleteOutline } from "react-icons/md";

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
  ht: any
  showEditTask: any
  setShowEditTask: any
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

export const ItineraryColumns: FC<props> = ({ data = [], multiSeled = true, reenviar = true, activeFunction, setModalStatus, modalStatus, setModalWorkFlow, modalWorkFlow, setModalCompartirTask, modalCompartirTask, deleteTask, ht, showEditTask, setShowEditTask }) => {
  const { t } = useTranslation();
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([])

  const options = [{
    value: "edit",
    icon: <PencilEdit className="h-auto w-5" />,
    title: "editar"
  },
  {
    value: "status",
    icon: <GoEyeClosed className="h-auto w-5" />,
    title: "estado"
  },
  {
    value: "flujo",
    icon: <GoGitBranch className="h-auto w-5" />,
    title: "flow"
  },
  {
    value: "share",
    icon: <LiaLinkSolid className="h-auto w-5" />,
    title: "compartir"
  },
  {
    value: "delete",
    icon: <MdOutlineDeleteOutline className="h-auto w-5" />,
    title: "borrar"
  }
  ]

  const Columna = useMemo(
    () => [
      {
        Header: t("título"),
        accessor: "descripcion",
        id: "description",
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
        Header: t("fecha"),
        accessor: "fecha",
        id: "date",
        Cell: (data) => (
          <div key={data.cell.row.id} className="flex w-full justify-center">
            {new Date(data.cell.value).toLocaleString()}
          </div>
        )
      },
      // {
      //   Header: t("hora"),
      //   accessor: "hora",
      //   id: "time",
      //   Cell: (data) => (
      //     <div className="flex w-full justify-center">
      //       {data.cell.value}
      //     </div>
      //   )
      // },
      {
        Header: t("responsables"),
        accessor: "responsable",
        id: "responsables",
        Cell: (data) => (
          <div key={data.cell.row.id} className="w-full text-gray-900 bg-blue-400">
            {data?.cell?.value?.map((elem, idx) => {
              return (
                <span key={idx} className="inline-flex items-center space-x-1">
                  <img alt={elem} src={ResponsablesArry.find(el => el.title.toLowerCase() === elem.toLowerCase()).icon} className="w-6 h-6" />
                  <span>
                    {elem}
                  </span>
                </span>
              )
            })}
          </div>
        )
      },
      {
        Header: t("tips"),
        accessor: "tips",
        id: "tips",
        Cell: (data) => (
          <div key={data.cell.row.id} className="w-full text-gray-900 bg-blue-400">
            {data?.cell?.value?.map((elem, idx) => {
              return (
                <span key={idx} className="inline-flex items-center">
                  -
                  <span>
                    {elem}
                  </span>
                </span>
              )
            })}
          </div>
        )
      },
      {
        Header: t("archivos adjuntos"),
        accessor: "attachment",
        id: "attachment",
        Cell: (data) => (
          <div key={data.cell.row.id} className="w-full text-gray-900 bg-blue-400">
            {data?.cell?.value?.map((elem, idx) => {
              return (
                <span key={idx} className="inline-flex items-center">
                  <IoIosAttach className="w-4 h-auto" />
                  <span>
                    {elem}
                  </span>
                </span>
              )
            })}
          </div>
        )
      },
      {
        id: "selection",
        Cell: (data) => {
          const [show, setShow] = useState(false)
          const [value, setValue] = useState("")
          return (
            <div key={data.cell.row.id} className="relative w-full h-full flex justify-center *bg-red">
              <div onClick={() => setShowEditTask(!showEditTask)} className="hidden md:flex text-gray-600 cursor-pointer w-4 h-6 items-center justify-center *bg-blue-400">
                <PencilEdit className="w-5 h-5" />
              </div>
              <ClickAwayListener onClickAway={() => show && setShow(false)} >
                <div onClick={() => setShow(!show)} className="w-full h-4 flex justify-center" >
                  <div className="text-gray-900 cursor-pointer w-4 h-6 flex items-center justify-center *bg-blue-400">
                    <DotsOpcionesIcon className={`${!show ? "text-gray-600" : "text-gray-900"} w-4 h-4`} />
                  </div>
                  {show && <div className={`absolute right-9 top-0 bg-white z-50 rounded-md shadow-md`}>
                    {options?.map((item, idx) =>
                      <div key={idx}
                        onClick={() => {
                          setValue(item.value)
                          setShow(false)
                        }}
                        className={`${item.value === "edit" ? "flex md:hidden" : "flex"} p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 ${item.value === value && "bg-gray-200"}`}
                      >
                        {item.icon}
                        {item.title}
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
    []
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
      />
    </div>
  );
};