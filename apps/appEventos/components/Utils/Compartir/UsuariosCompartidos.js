import { useMemo, useState } from "react";
import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider } from "../../../context";
import { ImageAvatar } from "../ImageAvatar"
import { MdOutlineEdit, MdSecurity } from "react-icons/md"
import { IoEyeOutline } from "react-icons/io5"
import { FaCrown } from "react-icons/fa"

export const UsuariosCompartidos = ({ event }) => {
    const { user } = AuthContextProvider()
    const [open, setOpen] = useState(false)

    const getOnlineInfo = (onLine) => {
        if (typeof onLine === "boolean") return { status: onLine, date: 0 }
        return {
            status: onLine?.status != false,
            date: onLine?.dateConection ?? 0
        }
    }

    const sharedUsers = useMemo(() => {
        const list = [...(event?.detalles_compartidos_array ?? [])]
            .sort((a, b) => getOnlineInfo(b?.onLine).date - getOnlineInfo(a?.onLine).date)
        if (event?.detalles_usuario_id) list.push(event.detalles_usuario_id)
        return list
    }, [event])

    const canEdit = event?.usuario_id === user?.uid
    const canSeeDetails = canEdit
    const maxShown = 4
    const overflow = sharedUsers.length > (maxShown + 1) ? sharedUsers.length - maxShown : 0
    const visible = sharedUsers.slice(-(overflow ? maxShown : Math.min(sharedUsers.length, maxShown)))

    const getPermissionCounts = (u) => {
        const p = Array.isArray(u?.permissions) ? u.permissions : []
        const view = p.filter(x => x?.value === "view").length
        const edit = p.filter(x => x?.value === "edit").length
        return { view, edit }
    }

    const permissionColumns = [
        { title: "resumen", label: "Res" },
        { title: "invitados", label: "Inv" },
        { title: "mesas", label: "Mes" },
        { title: "regalos", label: "Reg" },
        { title: "presupuesto", label: "Pre" },
        { title: "invitaciones", label: "Invt" },
        { title: "itinerario", label: "Iti" },
        { title: "momentos", label: "Mom" },
        { title: "servicios", label: "Serv" },
    ]

    const getPermissionValue = (u, title) => {
        const p = Array.isArray(u?.permissions) ? u.permissions : []
        const f = p.find(x => x?.title === title)
        return f?.value || "none"
    }

    const PermissionCell = ({ value }) => {
        if (value === "edit") {
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-green-50 border border-green-200">
                    <MdOutlineEdit className="w-4 h-4 text-green-600" />
                </span>
            )
        }
        if (value === "view") {
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 border border-blue-200">
                    <IoEyeOutline className="w-4 h-4 text-blue-600" />
                </span>
            )
        }
        return (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-50 border border-red-200">
                <MdSecurity className="w-4 h-4 text-red-600" />
            </span>
        )
    }

    return (
        <div className={`relative flex items-center ${canEdit ? 'cursor-pointer' : ''}`}>
            {canEdit ? (
                <button
                    type="button"
                    className="flex items-center"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setOpen((v) => !v)
                    }}
                >
                    {overflow > 0 && (
                        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center text-center border border-gray-300 text-[13px] truncate font-semibold z-10">
                            +{overflow}
                        </div>
                    )}
                    {visible.map((item, idx) => (
                        <div
                            key={idx}
                            className={`${idx === 0 && overflow === 0 ? '' : '-ml-2'} bg-gray-300 rounded-full w-7 h-7 flex items-center justify-center border relative`}
                        >
                            <ImageAvatar user={item} />
                            <div className={`h-2.5 w-2.5 ${getOnlineInfo(item?.onLine).status ? "bg-green" : "bg-none"} absolute rounded-full right-1 -bottom-1`} />
                        </div>
                    ))}
                </button>
            ) : (
                <div className="bg-gray-300 rounded-full w-7 h-7 flex items-center justify-center border relative">
                    <ImageAvatar user={event?.detalles_usuario_id} />
                    <div className={`h-2.5 w-2.5 ${getOnlineInfo(event?.detalles_usuario_id?.onLine).status ? "bg-green" : "bg-none"} absolute rounded-full right-1 -bottom-1`} />
                </div>
            )}

            {canSeeDetails && open && (
                <ClickAwayListener onClickAway={() => setOpen(false)}>
                    <div className="absolute top-full right-0 mt-2 w-[680px] max-w-[calc(100vw-16px)] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="max-h-72 overflow-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-100">
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <div className="w-56 text-xs font-semibold text-gray-600">Personas con acceso</div>
                                    <div className="flex-1 overflow-x-auto">
                                        <div className="inline-flex gap-2">
                                            {permissionColumns.map((c) => (
                                                <div key={c.title} className="w-10 text-[11px] font-semibold text-gray-500 text-center">
                                                    {c.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {sharedUsers.slice().reverse().map((u, idx) => {
                                const isOwner = u?.uid && u?.uid === event?.usuario_id
                                const counts = getPermissionCounts(u)
                                return (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-b-0">
                                        <div className="flex items-center gap-2 min-w-0 w-56">
                                            <div className="bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center border relative shrink-0">
                                                <ImageAvatar user={u} />
                                                <div className={`h-2.5 w-2.5 ${getOnlineInfo(u?.onLine).status ? "bg-green" : "bg-none"} absolute rounded-full right-0.5 -bottom-0.5`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm text-gray-700 font-medium truncate">
                                                    {u?.displayName || u?.email || "Usuario"}
                                                </div>
                                                {u?.email && (
                                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-x-auto">
                                            <div className="inline-flex gap-2">
                                                {permissionColumns.map((c) => {
                                                    const value = isOwner ? "edit" : getPermissionValue(u, c.title)
                                                    return (
                                                        <div key={c.title} className="w-10 flex items-center justify-center">
                                                            <PermissionCell value={value} />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 pl-2 shrink-0">
                                            {isOwner ? (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-md">
                                                    <FaCrown className="w-3 h-3 text-yellow-600" />
                                                    <span className="text-xs text-yellow-700 font-medium">Propietario</span>
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md">
                                                        <IoEyeOutline className="w-3 h-3 text-blue-600" />
                                                        <span className="text-xs text-blue-700 font-medium">{counts.view}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-md">
                                                        <MdOutlineEdit className="w-3 h-3 text-green-600" />
                                                        <span className="text-xs text-green-700 font-medium">{counts.edit}</span>
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </ClickAwayListener>
            )}
        </div>
    )
}
