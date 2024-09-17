import { cloneElement, FC, useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useDelayUnmount } from "../../utils/Funciones";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { ArrowDown, CanceladoIcon, ConfirmadosIcon, PendienteIcon, PlusIcon } from "../icons";
import ModalBottom from "../Utils/ModalBottom";
import FormEditarInvitado from "../Forms/FormEditarInvitado";
import { guests, table, Event } from "../../utils/Interfaces";
import { SlOptionsVertical } from "react-icons/sl";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import ClickAwayListener from "react-click-away-listener";
import { useRouter } from "next/router";
import { BorrarInvitado } from "../../hooks/EditarInvitado";
import { Modal } from "../Utils/Modal";
import { DeleteConfirmation } from "../Itinerario/MicroComponente/DeleteConfirmation";


interface propsBlockListaInvitados {
    menu?: any
    setGetMenu?: any
    createPDF?: any
    setCreatePDF?: any
    ConditionalAction?: any
    handleClick?: any
}

interface guestsExt extends guests {
    tableNameRecepcion: Partial<table>
    tableNameCeremonia: Partial<table>
}
interface handleMoveGuest {
    event: Event
    setEvent: any
    toast: any
    invitadoID: string
    previousTable: Partial<table>
    lastTable: Partial<table>
    f1: number
}



export const BlockTableroInvitados: FC<propsBlockListaInvitados> = ({ createPDF, setCreatePDF, ConditionalAction, handleClick }) => {
    const { event, allFilterGuests, setEvent } = EventContextProvider();
    const [isMounted, setIsMounted] = useState(false);
    const shouldRenderChild = useDelayUnmount(isMounted, 500);
    const [invitadoSelected, setSelected] = useState<string | null>(null);
    const GuestsFathers = event?.invitados_array?.filter((invitado) => !invitado?.father)
    const [data, setData] = useState<{ titulo: string; data: guestsExt[] }[]>([]);
    const [modal, setModal] = useState({ state: false, title: null, handle: () => { } })
    const [showCards, setShowCards] = useState({})
    const toast = useToast()
    const [isAllowed, ht] = useAllowed()

    const toggleVisibility = (itemTitle) => {
        setShowCards((prevState) => ({
            ...prevState,
            [itemTitle]: !prevState[itemTitle],
        }));
    };


    useEffect(() => {
        let asd = {}
        for (let i = 0; i < event?.grupos_array?.length; i++) {
            asd = { ...asd, [event?.grupos_array[i]]: { titulo: event?.grupos_array[i], data: [] } }
        }
        const tablesRecepcion = event?.planSpace.find(elem => elem?.title === "recepción")?.tables
        const tablesCeremonia = event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables
        const Data = GuestsFathers.reduce((acc, item: guestsExt) => {
            const guestRecepcion = allFilterGuests[0]?.sentados.find(elem => elem._id === item._id)
            const guestCeremonia = allFilterGuests[1]?.sentados.find(elem => elem._id === item._id)
            const tableRecepcion = tablesRecepcion?.find(elem => elem._id === guestRecepcion?.tableID)
            const tableCeremonia = tablesCeremonia?.find(elem => elem._id === guestCeremonia?.tableID)
            item.chairs = [
                { planSpaceName: "recepción", chair: guestRecepcion?.chair, table: tableRecepcion },
                { planSpaceName: "ceremmonia", chair: guestCeremonia?.chair, table: tableCeremonia },
            ]
            item.tableNameRecepcion = tableRecepcion?.title ? tableRecepcion : { title: "no asignado" }
            item.tableNameCeremonia = tableCeremonia?.title ? tableCeremonia : { title: "no asignado" }

            if (event?.grupos_array?.includes(item?.rol)) {
                acc[item.rol] = { titulo: item.rol, data: acc[item.rol]?.data ? [...acc[item.rol]?.data, item] : [item] }
            } else {
                acc["no asignado"] = { titulo: "no asignado", data: acc["no asignado"]?.data ? [...acc["no asignado"]?.data, item] : [item] }
            }
            return acc;
        }, asd);
        Data && setData(Object.values(Data));
    }, [allFilterGuests]);


    return (
        <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full pt-2 pb-28 mb-32  relative" >
            <div className="flex gap-2 items-center mt-1 mb-3 md:mb-5 mx-2*">
                <button
                    onClick={(e) => !isAllowed() ? ht() : ConditionalAction({ e })}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary md:bg-primary md:text-white md:hover:bg-white md:hover:text-primary"
                >
                    <PlusIcon />
                    Invitado
                </button>
                <button
                    onClick={(e) => !isAllowed() ? ht() : handleClick(e, "grupo")}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
                >
                    <PlusIcon />
                    Grupo
                </button>
                <button
                    onClick={(e) => !isAllowed() ? ht() : handleClick(e, "menu")}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
                >
                    <PlusIcon />
                    Menu
                </button>
                {/* <button
                    onClick={() => !isAllowed() ? ht() : event?.invitados_array.length > 0 ? setCreatePDF(!createPDF) : toast("error", "Debes agregar invitados")}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
                >
                    
                    Crear PDF
                </button> */}
            </div>
            {shouldRenderChild && (
                <ModalBottom state={isMounted} set={setIsMounted}>
                    <div className="flex justify-center w-full gap-6">
                        <div className="w-full md:w-5/6">
                            <div className="border-l-2 border-gray-100 pl-3 my-6 w-full ">
                                <h2 className="font-display text-2xl capitalize text-primary font-light">
                                    Editar <br />
                                    <span className="font-display text-4xl capitalize text-gray-500 font-medium">
                                        Invitado
                                    </span>
                                </h2>
                            </div>
                            {invitadoSelected !== "" ? (
                                <FormEditarInvitado
                                    //ListaGrupos={event?.grupos_array}
                                    invitado={event.invitados_array.find(
                                        (guest) => guest._id === invitadoSelected
                                    )}
                                    setInvitadoSelected={setSelected}
                                    state={isMounted}
                                    set={setIsMounted}
                                />
                            ) : (
                                <div className="w-full h-full grid place-items-center">
                                    {" "}
                                    <p className="font-display text-lg text-gray-100">
                                        No hay invitado seleccionado
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalBottom>
            )}
            <div className="relative overflow-x-auto md:overflow-x-visible space-y-3 mx-2* ">
                {
                    data.map((item, idx) => {
                        return (
                            <div key={idx} >
                                <div onClick={() => toggleVisibility(item.titulo)} className="bg-gray-100 px-3 py-3  flex  items-center justify-between hover:cursor-pointer">
                                    <div className="capitalize text-azulCorporativo">
                                        {item.titulo}
                                    </div>
                                    <div className="text-azulCorporativo">
                                        <ArrowDown />
                                    </div>
                                </div>
                                <div className={`transition-all duration-200 ease-in-out`}>
                                    {
                                        showCards[item.titulo] && <div>
                                            <GuestCard
                                                guestData={item.data}
                                                modal={modal}
                                                setModal={setModal}
                                                setSelected={setSelected}
                                                setIsMounted={setIsMounted}
                                                isMounted={isMounted}
                                                event={event}
                                                setEvent={setEvent}
                                            />
                                        </div>
                                    }
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export const handleMoveGuest = (props: handleMoveGuest) => {
    try {
        const { invitadoID, previousTable, lastTable, f1, event, setEvent, toast } = props
        if (previousTable?._id) {
            const f2 = event?.planSpace[f1]?.tables?.findIndex(elem => elem._id === previousTable?._id)
            const f3 = event.planSpace[f1].tables[f2].guests.findIndex(elem => elem._id === invitadoID)
            event.planSpace[f1].tables[f2].guests.splice(f3, 1)
            setEvent({ ...event })
            fetchApiEventos({
                query: queries.editTable,
                variables: {
                    eventID: event._id,
                    planSpaceID: event?.planSpace[f1]?._id,
                    tableID: event.planSpace[f1].tables[f2]?._id,
                    variable: "guests",
                    valor: JSON.stringify([...event.planSpace[f1].tables[f2]?.guests])
                },
            });
            if (!lastTable) {
                toast("success", `El invitado no está sentado en ninguna mesa`,)
            }
        }
        if (lastTable) {
            for (let i = 0; i < lastTable?.numberChair; i++) {
                if (!lastTable?.guests?.map(el => el.chair).includes(i)) {
                    if (lastTable) {
                        const f2 = event?.planSpace[f1]?.tables?.findIndex(elem => elem._id === lastTable?._id)
                        event.planSpace[f1].tables[f2].guests.push({ _id: invitadoID, chair: i, order: new Date() })
                        setEvent({ ...event })
                        fetchApiEventos({
                            query: queries.editTable,
                            variables: {
                                eventID: event._id,
                                planSpaceID: event?.planSpace[f1]?._id,
                                tableID: event.planSpace[f1].tables[f2]?._id,
                                variable: "guests",
                                valor: JSON.stringify([...event.planSpace[f1].tables[f2]?.guests])
                            },
                        });
                        toast("success", `El invitado fue sentado en la mesa; ${lastTable.title}, puesto: ${i + 1}`,)
                    }
                    break
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
}

export const GuestCard = ({ guestData, modal, setModal, setSelected, setIsMounted, isMounted, event, setEvent }) => {
    const [show, setShow] = useState({});
    const [showModalMenu, setShowModalMenu] = useState({});
    const [showModalRecepcion, setShowModalRecepcion] = useState({});
    const [showModalCeremonia, setShowModalCeremonia] = useState({});
    const [showModalAsistenci, setShowModalAsistenci] = useState({});
    const [showModalAcompañante, setShowModalAcompañante] = useState({});
    const [acompañanteID, setAcompañanteID] = useState({ id: "", crear: true })
    const [value, setValue] = useState("sin menú");
    const [value2, setValue2] = useState({});
    const [value3, setValue3] = useState("pendiente");
    const [loading, setLoading] = useState(false);
    const [idGuest, setIdGuest] = useState(null)
    const router = useRouter();
    const toast = useToast()
    const [isAllowed] = useAllowed()
    const GuestsByFather = event?.invitados_array?.filter((invitado) => invitado?.father === acompañanteID.id)



    useEffect(() => {
        setAcompañanteID(old => ({ ...old, crear: false }))
        if (event.showChildrenGuest === idGuest && !showModalAcompañante) {
            setAcompañanteID({ id: idGuest, crear: false })
            return
        }
        fetchApiEventos({
            query: queries.eventUpdate,
            variables: {
                idEvento: event._id,
                variable: "showChildrenGuest",
                value: !showModalAcompañante ? idGuest : ""
            }
        })
        event.showChildrenGuest = !showModalAcompañante ? idGuest : null
        setEvent({ ...event })


    }, [acompañanteID.id])

    /* console.log("---->", event.showChildrenGuest) */

    const updateMyData = ({
        rowID,
        columnID,
        reemplazar,
        value,
        loading,
        eventoID,
    }) => {
        try {
            // Para modificar el estado
            if (loading == true) {
                setEvent((viejo) => {
                    const { invitados_array: arr } = viejo;
                    const rowIndex = arr.findIndex((e) => e._id == rowID);
                    const resultado = arr.map((invitado) => {
                        if (invitado._id === rowID) {
                            //Para escribir en base de datos
                            fetchApiEventos({
                                query: queries.editGuests,
                                variables: {
                                    eventID: event._id,
                                    guestID: invitado._id,
                                    variable: reemplazar,
                                    value: value
                                },
                            });
                            return {
                                ...arr[rowIndex],
                                [columnID]: value,
                            };
                        }
                        return invitado;
                    });
                    return {
                        ...viejo,
                        invitados_array: resultado,
                    };
                });
            }
        } catch (error) {
            console.log(error);
        }
    };
    const toggleVisibility = (option, _id) => {
        if (option === "menu") {
            setShowModalMenu((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
        if (option === "recepcion") {
            setShowModalRecepcion((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
        if (option === "ceremonia") {
            setShowModalCeremonia((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
        if (option === "asistencia") {
            setShowModalAsistenci((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
        if (option === "options") {
            setShow((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
        if (option === "acompañante") {
            setShowModalAcompañante((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setAcompañanteID({ id: _id, crear: false })
        }
    };
    const handleClick = (id) => {
        setSelected(id);
        setIsMounted(!isMounted);
    };
    const image = {
        hombre: {
            image: "/profile_men.png",
            alt: "Hombre",
        },
        mujer: {
            image: "profile_woman.png",
            alt: "Mujer",
        },
    };
    const ListaState = [
        {
            title: "pendiente",
            icon: <PendienteIcon />,
        },
        {
            title: "confirmado",
            icon: <ConfirmadosIcon />,
        },
        {
            title: "cancelado",
            icon: <CanceladoIcon />,
        },
    ];
    const dicc = ListaState.reduce((acc, el) => {
        acc[el.title] = { ...el };
        return acc;
    }, {});
    const HandleRemove = async (rowID) => {
        // Modificar base de datos
        try {
            await BorrarInvitado(event._id, rowID);
        } catch (error) {
            console.log(error);
        } finally {
            //Modifico el estado y memo
            setEvent((old) => {
                const { invitados_array: arr } = old;

                const resultado = arr.filter(
                    (invitado) => invitado?._id !== rowID
                );
                return {
                    ...old,
                    invitados_array: resultado,
                };
            });
            setShow(!show);
        }
    };
    const HandleEdit = (id) => {
        setSelected(id);
        setIsMounted(!isMounted);
        setModal(false)
    };
    const ListaOption = [
        {
            title: "Borrar",
            function: () => HandleRemove(idGuest),
        },
        {
            title: "Editar",
            function: () => HandleEdit(idGuest),
        },
        {
            title: "Compartir",
            /*  function: () => HandleEdit(row.row.original._id), */
        },
    ];

    useEffect(() => {
        setLoading(false);
        updateMyData({
            rowID: idGuest,
            columnID: "nombre_menu",
            reemplazar: "nombre_menu",
            value: value,
            loading: loading,
            eventoID: event._id,
        });
        setLoading(true);
    }, [value]);

    useEffect(() => {
        setLoading(false);
        updateMyData({
            rowID: idGuest,
            columnID: "asistencia",
            reemplazar: "asistencia",
            value: value3,
            loading: loading,
            eventoID: event._id,
        });
        setLoading(true);
    }, [value3]);


    return (
        <>
            {modal.state &&
                <Modal classe={"w-[95%] md:w-[450px] h-[200px]"}>
                    <DeleteConfirmation setModal={setModal} modal={modal} />
                </Modal>}
            {
                guestData.length > 0 && guestData?.map((item, idx) => {
                    return (
                        <>
                            <div key={idx} className={`  bg-gray-100 my-2 mx-2 rounded-md grid grid-cols-6 relative `}>
                                <div onClick={!isAllowed() ? null : () => handleClick(item._id)} className=" pt-2 pl-2 justify-self-center relative col-span-1 h-max ">
                                    <img
                                        className="block w-10 h-10 mr-2"
                                        src={image[item.sexo]?.image}
                                        alt={image[item.sexo]?.alt}
                                    />
                                </div>
                                <div className="col-span-4 grid grid-cols-2  justify-between pb-2 pt-2 border-gray-500  transition  capitalize ">
                                    <div className="col-span-2">
                                        <p onClick={!isAllowed() ? null : () => handleClick(item._id)} className="font-display text-2xl capitalize overflow-ellipsis text-gray-700">
                                            {item.nombre}
                                        </p>
                                    </div>
                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                        <div className="font-semibold text-[12px] ">asistencia :</div>
                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("asistencia", item._id)} className="flex items-center justify-between font-body  col-span-1 ">
                                            <div className="flex items-center text-[14px]">
                                                {dicc[item.asistencia]?.icon && cloneElement(dicc[item.asistencia].icon, { className: "w-4 h-4" })}
                                                {item.asistencia}
                                            </div>

                                            <div className="pl-2 ">
                                                <ArrowDown className="h-2 w-2" />
                                            </div>
                                        </div>
                                        {
                                            showModalAsistenci[item._id] &&
                                            <ClickAwayListener onClickAway={() => showModalAsistenci[item._id] && setShowModalAsistenci(false)}>
                                                {
                                                    showModalAsistenci && (
                                                        <ul
                                                            className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-9 -right-5 z-40`}
                                                        >
                                                            {ListaState.map((item, index) => {
                                                                return (
                                                                    <li
                                                                        key={index}
                                                                        className={`${value?.toLowerCase() === item?.title?.toLowerCase() && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                        onClick={() => {
                                                                            setValue3(item.title);
                                                                            setShowModalAsistenci(false);
                                                                        }}
                                                                    >
                                                                        {cloneElement(item.icon, { className: "w-5 h-5" })}
                                                                        {item.title}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )
                                                }
                                            </ClickAwayListener>
                                        }
                                    </div>
                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                        <p className="font-semibold text-[12px] ">Menu :</p>
                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("menu", item._id)} className=" flex items-center justify-between ">
                                            <p className=" font-body text-[12px] pl-2"> {item.nombre_menu}</p>
                                            <div className="pl-2">
                                                <ArrowDown className="h-2 w-2" />
                                            </div>
                                        </div>
                                        {
                                            showModalMenu[item._id] &&
                                            <ClickAwayListener onClickAway={() => showModalMenu[item._id] && setShowModalMenu(false)}>
                                                {showModalMenu[item._id] &&
                                                    (
                                                        <ul className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 right-1 z-40 w-max`}>
                                                            {event.menus_array?.length > 0 && event?.menus_array?.map((item, index) => {
                                                                return (
                                                                    <li
                                                                        key={index}
                                                                        className={`${value?.toLowerCase() === item?.nombre_menu?.toLowerCase() && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                        onClick={(e) => {
                                                                            setValue(item?.nombre_menu);
                                                                            setShowModalMenu(false);
                                                                        }}
                                                                    >
                                                                        {item?.nombre_menu}
                                                                    </li>
                                                                );
                                                            })}
                                                            <li
                                                                className="cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                                                                onClick={(e) => {
                                                                    setValue(null);
                                                                    setShowModalMenu(!showModalMenu);
                                                                }}
                                                            >
                                                                {"sin menú"}
                                                            </li>
                                                        </ul>
                                                    )
                                                }
                                            </ClickAwayListener>
                                        }
                                    </div>
                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                        <p className="font-semibold text-[12px] ">Mesa Recepción :</p>
                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("recepcion", item._id)} className="flex items-center justify-between">
                                            <p className=" font-body text-[12px] pl-2"> {item.tableNameRecepcion.title}</p>
                                            <div className="pl-2">
                                                <ArrowDown className="h-2 w-2" />
                                            </div>
                                        </div>
                                        {
                                            showModalRecepcion[item._id] &&
                                            <ClickAwayListener onClickAway={() => showModalRecepcion[item._id] && setShowModalRecepcion(false)}>
                                                {
                                                    showModalRecepcion[item._id] && (
                                                        <ul className="absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-6 -right-4 z-40 w-max">
                                                            {
                                                                [
                                                                    { _id: null, title: "No Asignado" },
                                                                    ...event?.planSpace.find(elem => elem?.title === "recepción")?.tables
                                                                ]?.map((item: any, idx: any) => {
                                                                    /* if (item?.guests?.length < item?.numberChair || value?._id === item?._id || !item?._id) { */
                                                                    return (
                                                                        <li
                                                                            key={idx}
                                                                            className={`${(/* value._id === item._id || */ (/* !value2._id && */ !item._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                            onClick={() => {
                                                                                const f1 = event?.planSpace.findIndex(elem => elem?.title === "recepción")
                                                                                const table = event.planSpace[f1]?.tables.find(el => el._id === item._id)
                                                                                setShowModalRecepcion(!showModalRecepcion);
                                                                                if (/* value?._id || */ item?._id) {
                                                                                    if (/* value?._id !== */ item?._id) {
                                                                                        setValue2(item.title);
                                                                                        handleMoveGuest({ invitadoID: idGuest, previousTable: value2, lastTable: table, f1, event, setEvent, toast })
                                                                                    }
                                                                                }
                                                                            }}
                                                                        >
                                                                            {item?.title}
                                                                        </li>
                                                                    )
                                                                    /*  } */
                                                                })}
                                                            <li
                                                                className=" cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                                                                onClick={() => router.push("/mesas")}
                                                            >
                                                                Añadir mesa
                                                            </li>
                                                        </ul>
                                                    )
                                                }
                                            </ClickAwayListener>
                                        }
                                    </div>
                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                        <p className="font-semibold text-[12px] ">Mesa  Ceremonia :</p>
                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("ceremonia", item._id)} className="flex items-center justify-between">
                                            <p className=" font-body text-[12px] pl-2"> {item.tableNameCeremonia.title}</p>
                                            <div className="pl-2">
                                                <ArrowDown className="h-2 w-2" />
                                            </div>
                                        </div>
                                        {
                                            showModalCeremonia[item._id] &&
                                            <ClickAwayListener onClickAway={() => showModalCeremonia[item._id] && setShowModalCeremonia(false)}>
                                                {
                                                    showModalCeremonia && (
                                                        <ul
                                                            className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-6 -right-4 z-50 w-max`}
                                                        >
                                                            {[
                                                                { _id: null, title: "No Asignado" },
                                                                ...event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables]?.map((elem: any, index) => {
                                                                    /* if (elem?.guests?.length < elem?.numberChair || value?._id === elem?._id || !elem?._id) { */
                                                                    return (
                                                                        <li
                                                                            key={index}
                                                                            className={`${(/* value._id === elem._id ||  */(/* !value._id && */ !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                            onClick={() => {
                                                                                const f1 = event?.planSpace.findIndex(elem => elem?.title === "ceremonia")
                                                                                const table = event.planSpace[f1]?.tables.find(el => el._id === elem._id)
                                                                                setShowModalCeremonia(false);
                                                                                if (/* value?._id || */ elem?._id) {
                                                                                    if (/* value?._id !== */ elem?._id) {
                                                                                        setValue(elem.title);
                                                                                        handleMoveGuest({ invitadoID: idGuest, previousTable: value2, lastTable: table, f1, event, setEvent, toast })
                                                                                    }
                                                                                }
                                                                            }}
                                                                        >
                                                                            {elem?.title}
                                                                        </li>
                                                                    )
                                                                    /* } */
                                                                })}
                                                            <li
                                                                className=" cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                                                                onClick={() => router.push("/mesas")}
                                                            >
                                                                Añadir mesa
                                                            </li>
                                                        </ul>
                                                    )
                                                }
                                            </ClickAwayListener>
                                        }
                                    </div>
                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                        <div className="font-semibold text-[12px] ">
                                            Acompañantes :
                                        </div>
                                        <div onClick={() => !isAllowed() ? null : item?.passesQuantity > 0 ? toggleVisibility("acompañante", item._id) : null} className="font-body text-[12px] pl-2 flex items-center justify-between">
                                            {item.passesQuantity}
                                            <div className={`${item?.passesQuantity > 0 ? "block" : "hidden"} pl-2  "`}>
                                                <ArrowDown className="h-2 w-2" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className=" justify-self-end relative col-span-1 ">

                                    <div onClick={() => !isAllowed() ? null : toggleVisibility("options", item._id)} className="pt-4 pr-4">
                                        <SlOptionsVertical />
                                    </div>
                                    {
                                        show[item._id] &&
                                        <ClickAwayListener onClickAway={() => show[item._id] && setShow(false)}>
                                            {show[item._id] && (
                                                <ul
                                                    className={` top-5 right-0 absolute w-max border border-base bg-white capitalize rounded-md overflow-hidden shadow-lg z-10 translate-x-[-12px]`}
                                                >
                                                    {ListaOption.map((item, idx) => (
                                                        <li
                                                            key={idx}
                                                            onClick={() => {
                                                                item.title.toLowerCase() === "borrar"
                                                                    ? setModal({
                                                                        state: true,
                                                                        title: <span>
                                                                            <strong>
                                                                                Deseas eliminar a este invitado y a sus acompañantes ?
                                                                            </strong>
                                                                        </span>,
                                                                        handle: () => item.function()
                                                                    })
                                                                    : item.function()
                                                            }}
                                                            className="font-display cursor-pointer border-base border block px-4 text-sm text-gray-500 hover:text-gray-500 hover:bg-base py-3"
                                                        >
                                                            {item.title}
                                                        </li>
                                                    ))}
                                                </ul>)}
                                        </ClickAwayListener>
                                    }
                                </div>
                            </div >
                            {
                                showModalAcompañante[item._id] &&
                                GuestsByFather.length >0 && GuestsByFather?.map((item, idx) => {
                                    return (
                                        <div key={idx}>
                                            <div className="capitalize flex justify-center "> Acompañantes de  {item.nombre}</div>
                                            <div className={`  bg-gray-100 my-2 mx-3 rounded-md grid grid-cols-6 relative `}>
                                                <div onClick={!isAllowed() ? null : () => handleClick(item._id)} className=" pt-2 pl-2 justify-self-center relative col-span-1 h-max ">
                                                    <img
                                                        className="block w-10 h-10 mr-2"
                                                        src={image[item.sexo]?.image}
                                                        alt={image[item.sexo]?.alt}
                                                    />
                                                </div>
                                                <div className="col-span-4 grid grid-cols-2  justify-between pb-2 pt-2 border-gray-500  transition  capitalize ">
                                                    <div className=" col-span-2">
                                                        <p onClick={!isAllowed() ? null : () => handleClick(item._id)} className="font-display text-2xl capitalize overflow-ellipsis text-gray-700">
                                                            {item.nombre}
                                                        </p>
                                                    </div>
                                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                                        <div className="font-semibold text-[12px] ">asistencia :</div>
                                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("asistencia", item._id)} className="flex items-center justify-between font-body  col-span-1 ">
                                                            <div className=" flex  items-center ">
                                                                {dicc[item.asistencia]?.icon && cloneElement(dicc[item.asistencia].icon, { className: "w-4 h-4" })}
                                                                {item.asistencia}
                                                            </div>

                                                            <div className="pl-2 ">
                                                                <ArrowDown className="h-2 w-2" />
                                                            </div>
                                                        </div>
                                                        {
                                                            showModalAsistenci[item._id] &&
                                                            <ClickAwayListener onClickAway={() => showModalAsistenci[item._id] && setShowModalAsistenci(false)}>
                                                                {
                                                                    showModalAsistenci && (
                                                                        <ul
                                                                            className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-9 -right-5 z-40`}
                                                                        >
                                                                            {ListaState.map((item, index) => {
                                                                                return (
                                                                                    <li
                                                                                        key={index}
                                                                                        className={`${value?.toLowerCase() === item?.title?.toLowerCase() && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                                        onClick={() => {
                                                                                            setValue3(item.title);
                                                                                            setShowModalAsistenci(false);
                                                                                        }}
                                                                                    >
                                                                                        {cloneElement(item.icon, { className: "w-5 h-5" })}
                                                                                        {item.title}
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                    )
                                                                }
                                                            </ClickAwayListener>
                                                        }
                                                    </div>
                                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                                        <p className="font-semibold text-[12px] ">Menu :</p>
                                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("menu", item._id)} className=" flex items-center justify-between ">
                                                            <p className=" font-body text-[12px] pl-2"> {item.nombre_menu}</p>
                                                            <div className="pl-2">
                                                                <ArrowDown className="h-2 w-2" />
                                                            </div>
                                                        </div>
                                                        {
                                                            showModalMenu[item._id] &&
                                                            <ClickAwayListener onClickAway={() => showModalMenu[item._id] && setShowModalMenu(false)}>
                                                                {showModalMenu[item._id] &&
                                                                    (
                                                                        <ul className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 right-1 z-40 w-max`}>
                                                                            {event.menus_array?.length > 0 && event?.menus_array?.map((item, index) => {
                                                                                return (
                                                                                    <li
                                                                                        key={index}
                                                                                        className={`${value?.toLowerCase() === item?.nombre_menu?.toLowerCase() && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                                        onClick={(e) => {
                                                                                            setValue(item?.nombre_menu);
                                                                                            setShowModalMenu(false);
                                                                                        }}
                                                                                    >
                                                                                        {item?.nombre_menu}
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                            <li
                                                                                className="cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                                                                                onClick={(e) => {
                                                                                    setValue(null);
                                                                                    setShowModalMenu(!showModalMenu);
                                                                                }}
                                                                            >
                                                                                {"sin menú"}
                                                                            </li>
                                                                        </ul>
                                                                    )
                                                                }
                                                            </ClickAwayListener>
                                                        }
                                                    </div>
                                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                                        <p className="font-semibold text-[12px] ">Mesa Recepción :</p>
                                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("recepcion", item._id)} className="flex items-center justify-between">
                                                            <p className=" font-body text-[12px] pl-2"> {item.nombre_mesa}</p>
                                                            <div className="pl-2">
                                                                <ArrowDown className="h-2 w-2" />
                                                            </div>
                                                        </div>
                                                        {
                                                            showModalRecepcion[item._id] &&
                                                            <ClickAwayListener onClickAway={() => showModalRecepcion[item._id] && setShowModalRecepcion(false)}>
                                                                {
                                                                    showModalRecepcion[item._id] && (
                                                                        <ul className="absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-6 -right-4 z-40 w-max">
                                                                            {
                                                                                [
                                                                                    { _id: null, title: "No Asignado" },
                                                                                    ...event?.planSpace.find(elem => elem?.title === "recepción")?.tables
                                                                                ]?.map((item: any, idx: any) => {
                                                                                    /* if (item?.guests?.length < item?.numberChair || value?._id === item?._id || !item?._id) { */
                                                                                    return (
                                                                                        <li
                                                                                            key={idx}
                                                                                            className={`${(/* value._id === item._id || */ (/* !value2._id && */ !item._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                                            onClick={() => {
                                                                                                const f1 = event?.planSpace.findIndex(elem => elem?.title === "recepción")
                                                                                                const table = event.planSpace[f1]?.tables.find(el => el._id === item._id)
                                                                                                setShowModalRecepcion(!showModalRecepcion);
                                                                                                if (/* value?._id || */ item?._id) {
                                                                                                    if (/* value?._id !== */ item?._id) {
                                                                                                        setValue2(item.title);
                                                                                                        handleMoveGuest({ invitadoID: idGuest, previousTable: value2, lastTable: table, f1, event, setEvent, toast })
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            {item?.title}
                                                                                        </li>
                                                                                    )
                                                                                    /*  } */
                                                                                })}
                                                                            <li
                                                                                className=" cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                                                                                onClick={() => router.push("/mesas")}
                                                                            >
                                                                                Añadir mesa
                                                                            </li>
                                                                        </ul>
                                                                    )
                                                                }
                                                            </ClickAwayListener>
                                                        }
                                                    </div>
                                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                                        <p className="font-semibold text-[12px] ">Mesa  Ceremonia :</p>
                                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("ceremonia", item._id)} className="flex items-center justify-between">
                                                            <p className=" font-body text-[12px] pl-2"> {item.puesto}</p>
                                                            <div className="pl-2">
                                                                <ArrowDown className="h-2 w-2" />
                                                            </div>
                                                        </div>
                                                        {
                                                            showModalCeremonia[item._id] &&
                                                            <ClickAwayListener onClickAway={() => showModalCeremonia[item._id] && setShowModalCeremonia(false)}>
                                                                {
                                                                    showModalCeremonia && (
                                                                        <ul
                                                                            className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-6 -right-4 z-50 w-max`}
                                                                        >
                                                                            {[
                                                                                { _id: null, title: "No Asignado" },
                                                                                ...event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables]?.map((elem: any, index) => {
                                                                                    /* if (elem?.guests?.length < elem?.numberChair || value?._id === elem?._id || !elem?._id) { */
                                                                                    return (
                                                                                        <li
                                                                                            key={index}
                                                                                            className={`${(/* value._id === elem._id ||  */(/* !value._id && */ !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                                            onClick={() => {
                                                                                                const f1 = event?.planSpace.findIndex(elem => elem?.title === "ceremonia")
                                                                                                const table = event.planSpace[f1]?.tables.find(el => el._id === elem._id)
                                                                                                setShowModalCeremonia(false);
                                                                                                if (/* value?._id || */ elem?._id) {
                                                                                                    if (/* value?._id !== */ elem?._id) {
                                                                                                        setValue(elem.title);
                                                                                                        handleMoveGuest({ invitadoID: idGuest, previousTable: value2, lastTable: table, f1, event, setEvent, toast })
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            {elem?.title}
                                                                                        </li>
                                                                                    )
                                                                                    /* } */
                                                                                })}
                                                                            <li
                                                                                className=" cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                                                                                onClick={() => router.push("/mesas")}
                                                                            >
                                                                                Añadir mesa
                                                                            </li>
                                                                        </ul>
                                                                    )
                                                                }
                                                            </ClickAwayListener>
                                                        }
                                                    </div>
                                                </div>
                                                <div className=" justify-self-end relative col-span-1 ">

                                                    <div onClick={() => !isAllowed() ? null : toggleVisibility("options", item._id)} className="pt-4 pr-4">
                                                        <SlOptionsVertical />
                                                    </div>
                                                    {
                                                        show[item._id] &&
                                                        <ClickAwayListener onClickAway={() => show[item._id] && setShow(false)}>
                                                            {show[item._id] && (
                                                                <ul
                                                                    className={` top-5 right-0 absolute w-max border border-base bg-white capitalize rounded-md overflow-hidden shadow-lg z-10 translate-x-[-12px]`}
                                                                >
                                                                    {ListaOption.map((item, idx) => (
                                                                        <li
                                                                            key={idx}
                                                                            onClick={() => {
                                                                                item.title.toLowerCase() === "borrar"
                                                                                    ? setModal({
                                                                                        state: true,
                                                                                        title: <span>
                                                                                            <strong>
                                                                                                Deseas eliminar a este invitado y a sus acompañantes ?
                                                                                            </strong>
                                                                                        </span>,
                                                                                        handle: () => item.function()
                                                                                    })
                                                                                    : item.function()
                                                                            }}
                                                                            className="font-display cursor-pointer border-base border block px-4 text-sm text-gray-500 hover:text-gray-500 hover:bg-base py-3"
                                                                        >
                                                                            {item.title}
                                                                        </li>
                                                                    ))}
                                                                </ul>)}
                                                        </ClickAwayListener>
                                                    }
                                                </div>
                                            </div>
                                            <div className="border-b"></div>
                                        </div>
                                    )
                                })

                            }
                            {
                                showModalAcompañante[item._id] && GuestsByFather.length === 0 &&
                                <>
                                    <div className="capitalize flex justify-center "> Acompañantes de  {item.nombre}</div>
                                    <span className="items-center col-span-3 flex gap-3 text-gray-500 justify-center pt-5">
                                        No tiene Acompañantes confirmados
                                    </span>
                                    <div className="border-b"></div>
                                </>
                            }
                        </>
                    )
                })
            }

        </>
    )
}

