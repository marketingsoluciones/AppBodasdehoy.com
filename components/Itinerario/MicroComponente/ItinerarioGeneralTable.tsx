import { ComponentType, useCallback, useEffect, useMemo, useState } from "react"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useTranslation } from "react-i18next";
import { useRowSelect, useSortBy, useTable, useExpanded } from "react-table";
import { Itinerary, OptionsSelect, Task, } from "../../../utils/Interfaces";
import ClickAwayListener from "react-click-away-listener";
import { useAllowed } from "../../../hooks/useAllowed";
import { DotsOpcionesIcon, PencilEdit } from "../../icons";
import { useToast } from "../../../hooks/useToast";
import { GoEye, GoEyeClosed, GoGitBranch } from "react-icons/go";
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink";
import { CgSoftwareDownload } from "react-icons/cg";
import { getBytes, getMetadata, getStorage, ref } from "firebase/storage";
import Link from "next/link";
import { GruposResponsablesArry } from "./ResponsableSelector";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { EditTastk } from "./ItineraryPanel";
import { LiaLinkSolid } from "react-icons/lia";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { PiCheckFatBold } from "react-icons/pi";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { GoChevronDown } from "react-icons/go";
import { AddEvent } from "./AddEvent";

export const ItineraryGeneralTable = () => {
    const toast = useToast()
    const { t } = useTranslation();
    const { event, setEvent } = EventContextProvider()
    const [isAllowed, ht] = useAllowed()
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [subComponente, setSubComponente] = useState({ id: "", crear: true })
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 5000);
    }, []);

    useEffect(() => {
        setData(event?.itinerarios_array?.filter((itinerary) => itinerary?.tipo === "itinerario"))
    }, [event])

    useEffect(() => {
        setSubComponente(old => ({ ...old, crear: false }))
    }, [subComponente.id])

    const columns = useMemo(
        () => {
            if (data === undefined) return [];
            return [
                {
                    Header: "title",
                    accessor: "title",
                    id: "title",
                },
                {
                    Header: "state",
                    accessor: "estatus",
                    id: "estatus",
                },
                {
                    Header: "Compartido con",
                    accessor: "viewers",
                    id: "viewers",
                },
                {
                    Header: "Tasks",
                    accessor: "tasks",
                    id: "tasks",
                    Cell: (data) => {
                        return (
                            <div className="flex w-full items-center justify-end capitalize">
                                {data.value.length > 0 ? data.value.length : "null"}
                            </div>
                        )
                    }
                },
                {
                    Header: "Id",
                    accessor: "_id",
                    id: "_id",
                },
                {
                    id: "ver",
                    Cell: (data) => {
                        console.log(data)
                        const [show, setShow] = useState(false)
                        const [value, setValue] = useState("")
                        const [copied, setCopied] = useState(false)

                        const handleClick = () => {
                            setSubComponente({ id: data?.row?.original?._id, crear: false })
                            /*  data.toggleAllRowsExpanded(false)
 
                             const isCurrentlyExpanded = data.row.isExpanded;
                             data.row.toggleRowExpanded(!isCurrentlyExpanded);
                             return */
                            const newExpandedRows = new Set(expandedRows);
                            const isCurrentlyExpanded = newExpandedRows.has(data.row.id);
                            if (isCurrentlyExpanded) {
                                newExpandedRows.delete(data.row.id);
                            } else {
                                newExpandedRows.add(data.row.id);
                            }
                            setExpandedRows(newExpandedRows);
                            data.row.toggleRowExpanded(!isCurrentlyExpanded);
                        }

                        useEffect(() => {
                            if (copied) {
                                setTimeout(() => {
                                    setCopied(false)
                                }, 3000);
                            }
                        }, [copied])
                        return (
                            <div onClick={() => handleClick()} className="flex w-[27px] items-center justify-center capitalize cursor-pointer">
                                <GoChevronDown className={` w-[20px] h-auto transition-all ${expandedRows.has(data.row.id) && "rotate-180"} `} />
                            </div>
                        )
                    }
                },
                {
                    id: "selection",
                    Cell: (data) => {
                        const [show, setShow] = useState(false)
                        const [value, setValue] = useState("")
                        const [copied, setCopied] = useState(false)

                        const handleClick = () => {
                            setSubComponente({ id: data?.row?.original?._id, crear: false })
                            data.toggleAllRowsExpanded(false)

                            //data.row.toggleRowExpanded()
                            return
                            /*  } */
                        }

                        useEffect(() => {
                            if (copied) {
                                setTimeout(() => {
                                    setCopied(false)
                                }, 3000);
                            }
                        }, [copied])

                        return (
                            <div key={data.cell.row.id} className="relative w-full h-full flex justify-center items-center">
                                <ClickAwayListener onClickAway={() => show && setShow(false)} >
                                    <div onClick={() => !isAllowed() ? ht() : setShow(!show)} className="w-full h-4 flex justify-center" >
                                        <div className="cursor-pointer flex items-center justify-center *bg-blue-400">
                                            <DotsOpcionesIcon className={`${!show ? !isAllowed() ? "text-gray-300" : "text-gray-700" : "text-gray-900"} w-4 h-4`} />
                                        </div>
                                        {show &&
                                            <div className={`absolute right-9c top-0c bg-white z-50 rounded-md shadow-md`}>
                                                <div onClick={() => handleClick()} className={`  p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 `}>
                                                    Ver
                                                </div>

                                                {/* {optionsItineraryButtonBox?.map((item, idx) =>
                                                    <div key={idx}
                                                        onClick={() => {
                                                            if (item.value === "share") {
                                                                setCopied(true)
                                                                toast("success", t(`copiedlink`))
                                                                return
                                                            }
                                                            setValue(item.value)
                                                            setShow(false)
                                                            item?.onClick(data.cell.row.original, itinerario)
                                                        }}
                                                        className={`${item.value === "edit" ? "flex md:hidden" : "flex"}  ${["/itinerario"].includes(window?.location?.pathname) && item.vew != "all" ? "hidden" : ""} p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 ${item.value === value && "bg-gray-200"}`}
                                                    >
                                                        {item.value === "share"
                                                            ? copied
                                                                ? <div>
                                                                    <PiCheckFatBold className="w-5 h-5" />
                                                                </div>
                                                                : <CopyToClipboard text={"link"}>
                                                                    <div className="flex">
                                                                        {item.icon}
                                                                        <span className="flex-1 leading-[1]">
                                                                            {item.title}
                                                                        </span>
                                                                    </div>
                                                                </CopyToClipboard>
                                                            : <>
                                                                {item.icon}
                                                                <span className="flex-1 leading-[1]">
                                                                    {item.title}
                                                                </span>
                                                            </>
                                                        }
                                                    </div>
                                                )} */}
                                            </div>
                                        }
                                    </div>
                                </ClickAwayListener>
                            </div>
                        )
                    }
                },
            ]
        }, [data, expandedRows])

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data }, useSortBy, useExpanded);

    const colSpan = {
        title: 6,
        estatus: 4,
        viewers: 5,
        tasks: 3,
        _id: 8,
        selection: 1,
        ver: 1,
    };

    const renderRowSubComponent = useCallback(({ row }) => {
        console.log(row)
        return (
            <SubComponenteTable data={row.values.tasks} itinerario={row.values} />
        )
    }, [subComponente])

    return (
        <div className="relative px-3 flex  justify-center w-full">
            <table
                {...getTableProps()}
                className="table-auto border-collapse rounded-lg relative p-4 ">
                <thead className="relative text-xs text-gray-700 uppercase bg-gray-200 w-full ">
                    {headerGroups.map((headerGroup: any, id: any) => {
                        return (
                            <tr
                                {...headerGroup.getHeaderGroupProps()}
                                className="grid grid-cols-28 w-full truncate"
                                key={id} >
                                {headerGroup.headers.map((column: any, id: any) => {
                                    return (
                                        <th
                                            {...column.getHeaderProps(column.getSortByToggleProps())}
                                            className={`truncate w-full leading-[1] px-1 py-1 md:py-3 text-center flex justify-center items-center text-xs font-light font-display col-span-${colSpan[column.id]
                                                }`}
                                            key={id}
                                        >
                                            <>
                                                {typeof column.render("Header") == "string" && t(column.render("Header"))}
                                                <span>
                                                    {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                                                </span>
                                            </>
                                        </th>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </thead>
                <tbody {...getTableBodyProps()} className="text-gray-700 text-xs bg-white">
                    {rows.length >= 1 ? rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <>
                                <tr
                                    {...row.getRowProps()}
                                    key={i}
                                    className={` w-full border-y font-display grid grid-cols-28 `}
                                >
                                    {row.cells.map((cell, i) => {
                                        return (
                                            <td
                                                {...cell.getCellProps()}
                                                key={i}
                                                className={`flex items-center* leading-[2] px-1 py-1 col-span-${colSpan[cell.column.id]} border-x-[1px] `}
                                            >
                                                {cell.render("Cell")}
                                            </td>
                                        );
                                    })}
                                </tr>
                                {expandedRows.has(row.id) && (
                                    <tr>
                                        <td colSpan={colSpan[row.cells[0].column.id]}>
                                            {renderRowSubComponent({ row })}
                                        </td>
                                    </tr>
                                )}
                            </>
                        );
                    }) : <tr className="transition border-b border-base hover:bg-base cursor-pointer w-full grid place-items-center">
                        <td className="bg-redpy-5 font-display text-lg text-gray-500 uppercase "></td></tr>
                        }
                </tbody>
            </table>
        </div>
    )


}

const SubComponenteTable = ({ data, itinerario }) => {
    const { t } = useTranslation();
    const [isAllowed, ht] = useAllowed()
    const storage = getStorage();
    const { user, config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const toast = useToast()
    const [modal, setModal] = useState({ state: false, title: null, values: null, itinerario: null })
    const [selectTask, setSelectTask] = useState<string>()


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

    const columns = useMemo(
        () => [
            {
                Header: t("title"),
                accessor: "descripcion",
                id: "description",
                Cell: (data) => {
                    return (
                        <div className="flex w-full items-center">
                            <span key={data.cell.row.id} className="font-bold flex-1">
                                {data.cell.value}
                            </span>
                            {(isAllowed() && data.cell.row.original.spectatorView) && <GoEye className="w-5 h-5" />}
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
            {
                id: "selection",
                Cell: (data) => {
                    const [show, setShow] = useState(false)
                    const [value, setValue] = useState("")
                    const [copied, setCopied] = useState(false)
                    const [showEditTask, setShowEditTask] = useState<EditTastk>({ state: false })
                    const optionsItineraryButtonBox: OptionsSelect[] = [
                        {
                            value: "edit",
                            icon: <PencilEdit className="w-5 h-5" />,
                            title: "editar",
                            onClick: (values: Task) => !isAllowed() ? ht() : setShowEditTask({ values, state: !showEditTask.state }),
                            vew: "all"
                        },
                        {
                            value: "status",
                            icon: <GoEyeClosed className="w-5 h-5" />,
                            getIcon: (value: boolean) => {
                                if (value) {
                                    return <GoEyeClosed className="w-5 h-5" />
                                }
                                return <GoEye className="w-5 h-5" />
                            },
                            title: "estado",
                            onClick: (values: Task) => !isAllowed() ? ht() : handleAddSpectatorView(values),
                            vew: "all"
                        },

                        {
                            value: "share",
                            icon: <LiaLinkSolid className="w-5 h-5" />,
                            title: "Link calendario",
                            vew: "tasks"
                        },
                        {
                            value: "delete",
                            icon: <MdOutlineDeleteOutline className="w-5 h-5" />,
                            title: "borrar",
                            onClick: (values: Task, itinerario: Itinerary) => !isAllowed() ? ht() : setModal({ values: values, itinerario: itinerario, state: true, title: values.descripcion }),
                            vew: "all"
                        }
                    ]

                    const handleAddSpectatorView = async (values: Task) => {
                        try {
                            fetchApiEventos({
                                query: queries.editTask,
                                variables: {
                                    eventID: event._id,
                                    itinerarioID: itinerario._id,
                                    taskID: values._id,
                                    variable: "spectatorView",
                                    valor: JSON.stringify(!values?.spectatorView)
                                },
                                domain: config.domain
                            })
                                .then(() => {
                                    const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
                                    const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id)
                                    event.itinerarios_array[f1].tasks[f2].spectatorView = !values?.spectatorView
                                    setEvent({ ...event })
                                    toast("success", t("Item guardado con exito"))
                                    setShowEditTask({ state: false })
                                })
                        } catch (error) {
                            console.log(error)
                        }

                    }


                    useEffect(() => {
                        if (copied) {
                            setTimeout(() => {
                                setCopied(false)
                            }, 3000);
                        }
                    }, [copied])

                    return (
                        <div key={data.cell.row.id} className="relative w-full h-full flex justify-center items-center">
                            <div onClick={() => { !isAllowed() ? ht() : setShowEditTask({ state: !showEditTask.state, values: data.cell.row.original }) }} className={`hidden md:flex ${isAllowed() ? "text-gray-700" : "text-gray-300"} cursor-pointer w-4 h-6 items-center justify-center *bg-blue-400`}>
                                <PencilEdit className="w-5 h-5" />
                            </div>
                            <ClickAwayListener onClickAway={() => show && setShow(false)} >
                                <div onClick={() => !isAllowed() ? ht() : setShow(!show)} className="w-full h-4 flex justify-center" >
                                    <div className="cursor-pointer w-4 h-6 flex items-center justify-center *bg-blue-400">
                                        <DotsOpcionesIcon className={`${!show ? !isAllowed() ? "text-gray-300" : "text-gray-700" : "text-gray-900"} w-4 h-4`} />
                                    </div>
                                    {show && <div className={`absolute right-9 top-0 bg-white z-50 rounded-md shadow-md`}>
                                        {optionsItineraryButtonBox?.map((item, idx) =>
                                            <div key={idx}
                                                onClick={() => {
                                                    if (item.value === "share") {
                                                        setCopied(true)
                                                        toast("success", t(`copiedlink`))
                                                        return
                                                    }
                                                    setValue(item.value)
                                                    setShow(false)
                                                    item?.onClick(data.cell.row.original, itinerario)
                                                }}
                                                className={`${item.value === "edit" ? "flex md:hidden" : "flex"}  ${["/itinerario"].includes(window?.location?.pathname) && item.vew != "all" ? "hidden" : ""} p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100 ${item.value === value && "bg-gray-200"}`}
                                            >
                                                {item.value === "share"
                                                    ? copied
                                                        ? <div>
                                                            <PiCheckFatBold className="w-5 h-5" />
                                                        </div>
                                                        : <CopyToClipboard text={"link"}>
                                                            <div className="flex">
                                                                {item.icon}
                                                                <span className="flex-1 leading-[1]">
                                                                    {item.title}
                                                                </span>
                                                            </div>
                                                        </CopyToClipboard>
                                                    : <>
                                                        {item.icon}
                                                        <span className="flex-1 leading-[1]">
                                                            {item.title}
                                                        </span>
                                                    </>
                                                }
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
        [t, event]
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data }, useSortBy, useExpanded);

    const colSpan = {
        description: 4,
        duration: 2,
        date: 3,
        responsables: 4,
        tips: 4,
        attachments: 4,
        tags: 2,
        selection: 1
    };
    return (
        <div className="relative px-3 flex flex-col justify-center w-full py-2">
            <table
                {...getTableProps()}
                className="table-auto border-collapse rounded-lg relative p-4 ">
                <thead className="relative text-xs text-gray-700 uppercase bg-gray-200 w-full ">
                    {headerGroups.map((headerGroup: any, id: any) => {
                        return (
                            <tr
                                {...headerGroup.getHeaderGroupProps()}
                                className="grid grid-cols-24 w-full truncate"
                                key={id} >
                                {headerGroup.headers.map((column: any, id: any) => {
                                    return (
                                        <th
                                            {...column.getHeaderProps(column.getSortByToggleProps())}
                                            className={`truncate w-full leading-[1] px-1 py-1 md:py-3 text-center flex justify-center items-center text-xs font-light font-display col-span-${colSpan[column.id]
                                                }`}
                                            key={id}
                                        >
                                            <>
                                                {typeof column.render("Header") == "string" && t(column.render("Header"))}
                                                <span>
                                                    {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                                                </span>
                                            </>
                                        </th>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </thead>
                <tbody {...getTableBodyProps()} className="text-gray-700 text-xs bg-white">
                    {rows.length >= 1 ? rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <>
                                <tr
                                    {...row.getRowProps()}
                                    key={i}
                                    className={` w-full border-b font-display grid grid-cols-24 `}
                                >
                                    {row.cells.map((cell, i) => {
                                        return (
                                            <td
                                                {...cell.getCellProps()}
                                                key={i}
                                                className={`flex items-center* leading-[2] px-1 py-1 col-span-${colSpan[cell.column.id]} border-x-[1px] `}
                                            >
                                                {cell.render("Cell")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </>
                        );
                    }) : <tr className="transition border-b border-base hover:bg-base cursor-pointer w-full grid place-items-center">
                        <td className="bg-redpy-5 font-display text-lg text-gray-500 uppercase "></td></tr>}
                </tbody>
            </table>
            <div className="-mb-[78px] z-50">

                <AddEvent tasks={data} itinerario={itinerario} setSelectTask={setSelectTask} />
            </div>
        </div>
    )
}