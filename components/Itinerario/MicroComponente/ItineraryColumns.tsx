import { ComponentType, FC } from "react";
import { useMemo, useState, useEffect, useRef } from "react";
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
          // Filtrar las opciones para eliminar "estatus"
          const filteredOptions = optionsItineraryButtonBox.filter(option => option.value !== "estatus");
      
          return (
            <div className="flex w-full items-center">
              <span key={data.cell.row.id} className="font-bold flex-1 pr-10">
                {data.cell.value}
              </span>
              <div className="absolute right-0 z-20">
                <IniterarySelectionMenu
                  data={data}
                  itinerario={itinerario}
                  optionsItineraryButtonBox={filteredOptions} // Pasar las opciones filtradas
                  setShowEditTask={setShowEditTask}
                  showEditTask={showEditTask}
                />
              </div>
              {(isAllowed() && data.cell.row.original.spectatorView) && (
                <div className="absolute right-6">
                  <GoEye className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        },
      },

      
      {
        Header: t("date"),
        accessor: "fecha",
        id: "date",
        Cell: (data) => {
          const [isExpanded, setIsExpanded] = useState(false);
      
          if (!data.cell.value) return null; // Si no hay información, no mostrar nada
      
          return (
            <div
              className={`relative group flex items-center ${
                isExpanded ? "whitespace-normal" : "truncate"
              }`}
              style={{
                maxWidth: isExpanded ? "100%" : "150px",
                overflow: isExpanded ? "visible" : "hidden",
              }}
              title={!isExpanded && data.cell.value.length > 10 ? new Date(data.cell.value).toLocaleString() : ""}
            >
              <span className="cursor-pointer">
                {isExpanded
                  ? new Date(data.cell.value).toLocaleString()
                  : new Date(data.cell.value).toLocaleString().slice(0, 10)}
              </span>
              <svg
                onClick={() => setIsExpanded(!isExpanded)}
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 ml-2 cursor-pointer transition-transform ${
                  isExpanded ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          );
        },
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
            return el.title.toLowerCase() === data.cell.value[0]?.toLowerCase();
          }) ?? [user, event?.detalles_usuario_id, ...event.detalles_compartidos_array].find(el => {
            return el?.displayName?.toLowerCase() === data.cell.value[0]?.toLowerCase();
          });
      
          const [isExpanded, setIsExpanded] = useState(false);
          const [isOverflowing, setIsOverflowing] = useState(false);
          const cellRef = useRef(null);
      
          useEffect(() => {
            if (cellRef.current) {
              setIsOverflowing(cellRef.current.scrollHeight > cellRef.current.clientHeight);
            }
          }, [data.cell.value]);
      
          if (data.cell.value.length > 0) {
            return (
              <div
                ref={cellRef}
                className={`w-full relative flex flex-col items-start justify-center ${
                  isExpanded ? "whitespace-normal" : "truncate"
                }`}
                style={{
                  maxWidth: "100%", // Mantener el ancho del contenedor
                  overflow: isExpanded ? "visible" : "hidden",
                  maxHeight: isExpanded ? "none" : "2.5rem", // Limitar la altura cuando no está expandido
                }}
              >
                {data?.cell?.value?.map((elem, idx) => {
                  const userSelect = GruposResponsablesArry.find(el => {
                    return el.title.toLowerCase() === elem?.toLowerCase();
                  }) ?? [user, event?.detalles_usuario_id, ...event.detalles_compartidos_array].find(el => {
                    return el?.displayName?.toLowerCase() === elem?.toLowerCase();
                  });
                  return (
                    <span key={idx} className="inline-flex items-center space-x-1">
                      <div className="w-6 h-6 rounded-full border-[1px] border-gray-300">
                        <ImageAvatar user={userSelect} />
                      </div>
                      <span className={`flex-1 ${!userSelect && "line-through"}`}>
                        {!userSelect ? elem : userSelect.displayName ? userSelect.displayName : userSelect.email}
                      </span>
                    </span>
                  );
                })}
                {isOverflowing && (
                  <svg
                    onClick={() => setIsExpanded(!isExpanded)}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 mt-2 cursor-pointer transition-transform ${
                      isExpanded ? "rotate-180" : "rotate-0"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            );
          }
        },
      },

      {
        Header: t("tips"),
        accessor: "tips",
        id: "tips",
        Cell: (data) => {
          const [isExpanded, setIsExpanded] = useState(false);
      
          // Función para eliminar etiquetas HTML
          const stripHtml = (html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            return doc.body.textContent || "";
          };
      
          const plainText = stripHtml(data.cell.value || ""); // Convertir el contenido a texto plano
      
          if (!plainText) return null; // Si no hay información, no mostrar nada
      
          return (
            <div
              className={`relative group flex items-center ${
                isExpanded ? "whitespace-normal" : "truncate"
              }`}
              style={{
                maxWidth: isExpanded ? "100%" : "150px",
                overflow: isExpanded ? "visible" : "hidden",
              }}
              title={!isExpanded && plainText.length > 10 ? plainText : ""}
            >
              <span className="cursor-pointer">
                {isExpanded ? plainText : `${plainText.slice(0, 10)}...`}
              </span>
              <svg
                onClick={() => setIsExpanded(!isExpanded)}
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 ml-2 cursor-pointer transition-transform ${
                  isExpanded ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          );
        },
      },
      {
        Header: t("attachments"),
        accessor: "attachments",
        id: "attachments",
        Cell: (data) => {
          const [isExpanded, setIsExpanded] = useState(false);
      
          if (!data.cell.value || data.cell.value.length === 0) return null; // Si no hay información, no mostrar nada
      
          return (
            <div
              className={`relative group flex items-center ${
                isExpanded ? "whitespace-normal" : "truncate"
              }`}
              style={{
                maxWidth: isExpanded ? "100%" : "150px",
                overflow: isExpanded ? "visible" : "hidden",
              }}
              title={
                !isExpanded && data.cell.value.length > 1
                  ? data.cell.value.map((elem) => elem.name).join(", ")
                  : ""
              }
            >
              <div className="flex flex-wrap gap-2">
                {isExpanded
                  ? data.cell.value.map((elem, idx) => (
                      <span
                        key={idx}
                        onClick={() => {
                          handleDownload({ elem, task: data.cell.row.original });
                        }}
                        className="inline-flex items-center max-w-[90%] border-b-[1px] hover:font-bold border-gray-500 cursor-pointer mr-2"
                      >
                        <span className="flex-1 truncate">{elem.name}</span>
                        <CgSoftwareDownload className="w-4 h-auto" />
                      </span>
                    ))
                  : `${data.cell.value[0]?.name.slice(0, 10)}...`}
              </div>
              <svg
                onClick={() => setIsExpanded(!isExpanded)}
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 ml-2 cursor-pointer transition-transform ${
                  isExpanded ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          );
        },
      },
      {
        Header: t("labels"),
        accessor: "tags",
        id: "tags",
        Cell: (data) => {
          const [isExpanded, setIsExpanded] = useState(false);
      
          if (!data.cell.value || data.cell.value.length === 0) return null; // Si no hay información, no mostrar nada
      
          // Función para obtener colores en armonía
          const getColor = (label) => {
            const colors = {
              "Urgent": { border: "#FF6347", background: "rgba(255, 99, 71, 0.2)" }, // Rojo
              "Important": { border: "#FFA500", background: "rgba(255, 165, 0, 0.2)" }, // Naranja
              "Optional": { border: "#3CB371", background: "rgba(60, 179, 113, 0.2)" }, // Verde
              "Default": { border: "#87CEFA", background: "rgba(135, 206, 250, 0.2)" }, // Azul
            };
            return colors[label] || colors["Default"];
          };
      
          return (
            <div
              className={`relative group flex items-center ${
                isExpanded ? "whitespace-normal" : "truncate"
              }`}
              style={{
                maxWidth: isExpanded ? "100%" : "150px",
                overflow: isExpanded ? "visible" : "hidden",
              }}
              title={!isExpanded && data.cell.value.length > 1 ? data.cell.value.join(", ") : ""}
            >
              <div className="flex flex-wrap gap-1">
                {data.cell.value.slice(0, isExpanded ? data.cell.value.length : 1).map((label, index) => {
                  const { border, background } = getColor(label);
                  return (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium rounded border"
                      style={{
                        borderColor: border, // Color del borde
                        backgroundColor: background, // Color de relleno
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
              {data.cell.value.length > 1 && (
                <svg
                  onClick={() => setIsExpanded(!isExpanded)}
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 ml-2 cursor-pointer transition-transform ${
                    isExpanded ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          );
        },
      },
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