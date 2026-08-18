import { ComponentType, FC } from "react";
import { useMemo, useState, } from "react";
import { ConfirmationBlock } from "../../Invitaciones/ConfirmationBlock"
import { useTranslation } from 'react-i18next';
import { GruposResponsablesArry } from "../../Servicios/Utils/ResponsableSelector";
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
import { useToast } from "../../../hooks/useToast";
import { IniterarySelectionMenu } from "./InitinerarySelectionMenu"
import ClickAwayListener from "react-click-away-listener";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { cleanResponsables } from "../../Servicios/VistaTarjeta/TaskNewUtils";
import { DateTask } from "../../Servicios/VistaTarjeta/DateTask";
import { TimeTask } from "../../Servicios/VistaTarjeta/TimeTask";
import { DurationTask } from "../../Servicios/VistaTarjeta/DurationTask";


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
  const { event, setEvent } = EventContextProvider()
  const { config, user } = AuthContextProvider()
  const { t } = useTranslation();
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([])
  const [isAllowed, ht] = useAllowed()
  const storage = getStorage();
  const toast = useToast()
  const isStudio = typeof window !== "undefined"
    && window.location.pathname === "/itinerario"
    && new URLSearchParams(window.location.search).get("studio") !== "legacy"
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const optOjo = (optionsItineraryButtonBox || []).find(o => o.value === "status")
  const optBorrar = (optionsItineraryButtonBox || []).find(o => o.value === "delete")
  const runOpt = (opt: any, task: any) => { if (typeof opt?.onClick === "function") opt.onClick(task, itinerario) }

  const handleDuplicateTask = async (task: any) => {
    setOpenMenuId(null)
    if (!isAllowed()) { ht(); return }
    try {
      const result: any = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          evento_id: event._id,
          development: config.development || "bodasdehoy",
          task: {
            itinerario_id: itinerario._id,
            descripcion: `${task?.descripcion || ""} (copia)`,
            fecha: task?.fecha ? new Date(task.fecha).toISOString() : undefined,
            hora: task?.hora,
            horaActiva: task?.horaActiva ?? true,
            duracion: task?.duracion ?? 30,
            spectatorView: task?.spectatorView ?? true,
            tags: Array.isArray(task?.tags) ? task.tags : [],
            responsable: Array.isArray(task?.responsable) ? task.responsable : [],
            tips: task?.tips || "",
          },
        },
        domain: config.domain,
      })
      const created = (result?.task || result)
      if (!created?._id) { toast("error", t("Error al duplicar la tarea")); return }
      const f1 = event.itinerarios_array.findIndex((it: any) => it._id === itinerario._id)
      setEvent((prev: any) => ({
        ...prev,
        itinerarios_array: prev.itinerarios_array.map((it: any, i: number) => i !== f1 ? it : { ...it, tasks: [...(it.tasks || []), { ...created, estatus: true }] }),
      }))
      toast("success", t("Tarea duplicada correctamente"))
    } catch (e: any) {
      console.warn("[ItineraryColumns] duplicar falló:", e?.message ?? e)
      toast("error", t("Error al duplicar la tarea"))
    }
  }

  const [editingCell, setEditingCell] = useState<{ taskId: string, field: string } | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)

  // Actualiza un campo de una tarea concreta (optimista + editTask), reutilizado
  // por los editores de la vista tabla (fecha/hora/duración/título).
  const makeHandleUpdate = (task: any) => async (field: string, value: any) => {
    if (!isAllowed()) { ht(); return }
    const f1 = event.itinerarios_array.findIndex((it: any) => it._id === itinerario._id)
    if (f1 < 0) return
    setEvent((prev: any) => ({
      ...prev,
      itinerarios_array: prev.itinerarios_array.map((it: any, i: number) => i !== f1 ? it : { ...it, tasks: it.tasks.map((tk: any) => tk._id !== task._id ? tk : { ...tk, [field]: value }) }),
    }))
    let apiValue: string
    if (field === 'horaActiva') apiValue = value ? "true" : "false"
    else if (['responsable', 'tags', 'attachments'].includes(field)) apiValue = JSON.stringify(value || [])
    else if (field === 'duracion') apiValue = String(value || "0")
    else if (field === 'fecha') apiValue = (value as any)?.includes?.('T') ? value : String(value || "")
    else apiValue = String(value || "")
    try {
      await fetchApiEventos({
        query: queries.editTask,
        variables: { evento_id: event._id, itinerario_id: itinerario._id, task_id: task._id, development: config.development || "bodasdehoy", updates: { [field]: apiValue } },
        domain: config.domain,
      })
    } catch (e: any) {
      console.warn('[ItineraryColumns] editTask falló:', e?.message ?? e)
      toast("error", t("Error al actualizar"))
    }
  }

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
    } catch (error: any) {
      const code = error?.code;
      if (code === 'storage/object-not-found') {
        toast("error", t("Archivo no encontrado"));
      } else if (code === 'storage/unauthorized') {
        toast("error", t("Sin permisos para descargar este archivo"));
      } else {
        toast("error", t("Error al descargar el archivo"));
      }
    }
  }

  const replacesLink: ComponentType<UrlProps> = (props) => {
    return (
      <a href={props?.url} className="text-xs break-all underline" target="_blank" rel="noopener noreferrer">{props?.children}</a>
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

  if (isStudio) {
    const GRID = "1.6fr 1fr 0.8fr 1.1fr 2.2fr 1fr 76px"
    return (
      <div style={{ maxWidth: 1120, margin: "0 auto", background: "#fff", borderRadius: 14, border: "1px solid #f0f0f2" }}>
        <style dangerouslySetInnerHTML={{ __html: ".iti-trow:hover{background:#fdf7fa;}.iti-abtn:hover{background:#f5f5f7;color:#EF5B94 !important;}.iti-menuit:hover{background:#fdf7fa;color:#EF5B94;}.iti-menuit-peligro:hover{background:#FBE4EF;}" }} />
        {/* cabecera */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, alignItems: "center", padding: "13px 22px", background: "#fafafa", borderBottom: "1px solid #f0f0f2", borderRadius: "14px 14px 0 0", font: "600 11px Poppins", color: "#8a8a90", letterSpacing: ".6px", textTransform: "uppercase" }}>
          <div>{t("title")}</div><div>{t("date")}</div><div>{t("duracion")}</div><div>{t("responsible")}</div><div>{t("tips")}</div><div>{t("labels")}</div><div></div>
        </div>
        {/* filas */}
        {(data || []).map((task: any, idx: number) => {
          const responsables = cleanResponsables(task?.responsable)
          const tags = Array.isArray(task?.tags) ? task.tags : []
          const menuOpen = openMenuId === task?._id
          return (
            <div key={task?._id || idx} className="iti-trow" style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, alignItems: "center", padding: "14px 22px", borderBottom: idx < (data.length - 1) ? "1px solid #f7f7f9" : "none" }}>
              {editingTitle === task?._id
                ? <input autoFocus defaultValue={task?.descripcion || ""}
                    onBlur={(e) => { makeHandleUpdate(task)('descripcion', e.target.value.trim()); setEditingTitle(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { makeHandleUpdate(task)('descripcion', e.currentTarget.value.trim()); setEditingTitle(null) } else if (e.key === 'Escape') setEditingTitle(null) }}
                    style={{ font: "600 13px Poppins", color: "#3A3A42", border: "1.5px solid #EF5B94", borderRadius: 6, padding: "3px 7px", outline: "none", width: "100%", background: "#fff" }} />
                : <div onClick={() => isAllowed() ? setEditingTitle(task?._id) : ht()} title={t("Haz clic para editar")} style={{ font: "600 13px Poppins", color: "#3A3A42", cursor: "pointer" }}>{task?.descripcion || t("Sin título")}</div>}
              <div className="iti-cell-edit">
                <DateTask handleUpdate={makeHandleUpdate(task)} canEdit={isAllowed()} task={task} setEditing={(v: boolean) => setEditingCell(v ? { taskId: task?._id, field: 'fecha' } : null)} editing={!!(editingCell?.taskId === task?._id && editingCell?.field === 'fecha')} uso="itinerary" ValidationEdit={isAllowed()} />
                {task?.horaActiva !== false && <TimeTask handleUpdate={makeHandleUpdate(task)} canEdit={isAllowed()} task={task} setEditing={(v: boolean) => setEditingCell(v ? { taskId: task?._id, field: 'hora' } : null)} editing={!!(editingCell?.taskId === task?._id && editingCell?.field === 'hora')} uso="startTime" ValidationEdit={isAllowed()} />}
              </div>
              <div className="iti-cell-edit" style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>
                <DurationTask handleUpdate={makeHandleUpdate(task)} canEdit={isAllowed()} task={task} ValidationEdit={isAllowed()} />
              </div>
              <div style={responsables.length ? { font: "500 12.5px Poppins", color: "#6b6b72" } : { font: "500 12px Poppins", color: "#c4c4cc" }}>{responsables.length ? responsables.join(", ") : t("Sin asignar", { defaultValue: "Sin asignar" })}</div>
              <div style={{ font: "400 12px/1.5 Poppins", color: task?.tips ? "#6b6b72" : "#c4c4cc", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {task?.tips ? <Interweave content={task.tips} matchers={[new UrlMatcher('url', {}, replacesLink), new HashtagMatcher('hashtag')]} /> : "—"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {tags.map((tag: string, i: number) => <span key={i} style={{ display: "inline-block", font: "600 10.5px Poppins", color: "#D83E7C", background: "#FCE7F0", padding: "4px 10px", borderRadius: 12 }}>{tag}</span>)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end", position: "relative" }}>
                {optOjo && <button className="iti-abtn" onClick={() => runOpt(optOjo, task)} title={t("Visible para invitados · clic para ocultar")} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: task?.spectatorView ? "#EF5B94" : "#b3b3ba" }}>
                  <span style={{ transform: "scale(0.85)", display: "flex" }}>{optOjo.getIcon ? optOjo.getIcon(task?.spectatorView) : optOjo.icon}</span>
                </button>}
                <ClickAwayListener onClickAway={() => menuOpen && setOpenMenuId(null)}>
                  <div style={{ position: "relative" }}>
                    <button className="iti-abtn" onClick={() => setOpenMenuId(menuOpen ? null : task?._id)} title={t("Más opciones", { defaultValue: "Más opciones" })} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#8a8a90" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>
                    </button>
                    {menuOpen && <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, width: 160, background: "#fff", borderRadius: 12, border: "1px solid #f0f0f2", boxShadow: "0 14px 40px rgba(0,0,0,.14)", zIndex: 40, padding: 6 }}>
                      <div className="iti-menuit" onClick={() => handleDuplicateTask(task)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, font: "500 12.5px Poppins", color: "#3A3A42", cursor: "pointer" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                        {t("Duplicar", { defaultValue: "Duplicar" })}
                      </div>
                      <div style={{ height: 1, background: "#f0f0f2", margin: "4px 8px" }} />
                      <div className="iti-menuit-peligro" onClick={() => { setOpenMenuId(null); runOpt(optBorrar, task) }} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, font: "500 12.5px Poppins", color: "#D83E7C", cursor: "pointer" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
                        {t("Borrar", { defaultValue: "Borrar" })}
                      </div>
                    </div>}
                  </div>
                </ClickAwayListener>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

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