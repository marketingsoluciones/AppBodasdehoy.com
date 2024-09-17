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
            <div className="flex gap-2 md:gap-4 items-center mt-1 mb-3 md:mb-5 mx-2">
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
            <div className="relative overflow-x-auto md:overflow-x-visible space-y-3 mx-2 ">
                {
                    data.map((item, idx) => {
                        return (
                            <div key={idx} >
                                <div onClick={() => toggleVisibility(item.titulo)} className="bg-gray-100 px-3 py-3 rounded-md flex  items-center justify-between hover:cursor-pointer">
                                    <div className="capitalize text-azulCorporativo">
                                        {item.titulo}
                                    </div>
                                    <div className="text-azulCorporativo">
                                        <ArrowDown />
                                    </div>
                                </div>
                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showCards[item.titulo] ? 'max-h-screen' : 'max-h-0'
                                    }`}>
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
    const [show, setShow] = useState(false);
    const [showModalMenu, setShowModalMenu] = useState({});
    const [showModalRecepcion, setShowModalRecepcion] = useState({});
    const [showModalCeremonia, setShowModalCeremonia] = useState({});
    const [showModalAsistenci, setShowModalAsistenci] = useState({});


    const [value, setValue] = useState("sin menú");
    const [value2, setValue2] = useState({});
    const [value3, setValue3] = useState("pendiente");

    const [loading, setLoading] = useState(false);
    const [idGuest, setIdGuest] = useState(null)
    const router = useRouter();
    const toast = useToast()

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
            console.log("menu")
            setShowModalMenu((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
        if (option === "recepcion") {
            console.log("recepcion")
            setShowModalRecepcion((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
        if (option === "ceremonia") {
            console.log("ceremonia")
            setShowModalCeremonia((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
        if (option === "asistencia") {
            console.log("asistencia")
            setShowModalAsistenci((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }

    };

    const [isAllowed] = useAllowed()
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
    const ListaOption = [
        {
            title: "Borrar",
            /* function: () => HandleRemove(row.row.original._id), */
        },
        {
            title: "Editar",
            /* function: () => HandleEdit(row.row.original._id), */
        },
        {
            title: "Compartir",
            /* function: () => HandleEdit(row.row.original._id), */
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
            {
                guestData.length > 0 && guestData?.map((item, idx) => {

                    return (
                        <div key={idx} className={`  bg-gray-100 my-2 mx-2 rounded-md transition-all delay-100 `}>
                            <div className="flex justify-between pl-5 pr-2 relative ">
                                <div
                                    className="flex justify-start items-center truncate pr-3 cursor-pointer pt-3"
                                    onClick={!isAllowed() ? null : () => handleClick(item._id)}
                                >
                                    <img
                                        className="block w-10 h-10 mr-2"
                                        src={image[item.sexo]?.image}
                                        alt={image[item.sexo]?.alt}
                                    />
                                    <p className="font-display text-sm capitalize overflow-ellipsis text-gray-700">
                                        {item.nombre}
                                    </p>
                                </div>
                                <div onClick={() => !isAllowed() ? null : setShow(!show)} className="pt-4">
                                    <SlOptionsVertical />
                                </div>
                                <ul
                                    className={`${show ? "block" : "hidden"
                                        } top-10 right-0 absolute w-max border border-base bg-white capitalize rounded-md overflow-hidden shadow-lg z-10 translate-x-[-12px]`}
                                >
                                    {ListaOption.map((item, idx) => (
                                        <li
                                            key={idx}
                                            /* onClick={() => {
                                                item.title.toLowerCase() === "borrar"
                                                    ? setModal({
                                                        state: true,
                                                        title: <span>
                                                            <strong>
                                                                {`${row.row.cells[0].value} `}
                                                            </strong>
                                                            <span>{`${!row.row.cells[5].value
                                                                ? "será borrado"
                                                                : row.row.cells[5].value === 1
                                                                    ? `y su acompañante serán borrados`
                                                                    : `y sus ${row.row.cells[5].value} acompañantes serán borrados`
                                                                } de la lista de invitados`}
                                                            </span>
                                                        </span>,
                                                        handle: () => item.function()
                                                    })
                                                    : item.function()
                                            }} */
                                            className="font-display cursor-pointer border-base border block px-4 text-sm text-gray-500 hover:text-gray-500 hover:bg-base py-3"
                                        >
                                            {item.title}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid grid-cols-8 px-2 justify-between pb-2 pt-2 border-gray-500  transition  capitalize gap-1">
                                <div onClick={() => !isAllowed() ? null : toggleVisibility("menu", item._id)} className="items-center col-span-2 flex flex-col bg-primary rounded-md text-white py-1 relative ">
                                    <p className="font-semibold text-[12px] ">Menu</p>
                                    <p className=" font-body text-[12px]"> {item.nombre_menu}</p>
                                    {
                                        showModalMenu[item._id] &&
                                        <ClickAwayListener onClickAway={() => showModalMenu[item._id] && setShowModalMenu(false)}>
                                            {showModalMenu[item._id] &&
                                                (
                                                    <ul className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 -left-[13px] z-40 w-max`}>
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
                                <div onClick={() => !isAllowed() ? null : toggleVisibility("recepcion", item._id)} className="items-center col-span-3 flex flex-col bg-primary rounded-md text-white py-1 relative ">
                                    <p className="font-semibold text-[12px] ">Mesa Recepción</p>
                                    <p className=" font-body text-[12px]"> {item.tableNameRecepcion.title}</p>
                                    {
                                        showModalRecepcion[item._id] &&
                                        <ClickAwayListener onClickAway={() => showModalRecepcion[item._id] && setShowModalRecepcion(false)}>
                                            {
                                                showModalRecepcion[item._id] && (
                                                    <ul className="absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 z-40 w-max">
                                                        {
                                                            [
                                                                { _id: null, title: "No Asignado" },
                                                                ...event?.planSpace.find(elem => elem?.title === "recepción")?.tables
                                                            ]?.map((item: any, idx: any) => {
                                                                console.log("hola", item)
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
                                <div onClick={() => !isAllowed() ? null : toggleVisibility("ceremonia", item._id)} className="items-center col-span-3 flex flex-col bg-primary rounded-md text-white py-1 relative ">
                                    <p className="font-semibold text-[12px] ">Mesa  Ceremonia</p>
                                    <p className=" font-body text-[12px]"> {item.tableNameCeremonia.title}</p>
                                    {
                                        showModalCeremonia[item._id] &&
                                        <ClickAwayListener onClickAway={() => showModalCeremonia[item._id] && setShowModalCeremonia(false)}>
                                            {
                                                showModalCeremonia && (
                                                    <ul
                                                        className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 z-50 w-max`}
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

                            <div className="bg-gray-200 flex justify-between text-[13px] py-1 rounded-md px-3">
                                <div className="flex space-x-1">
                                    <span>
                                        Acompañantes:
                                    </span>
                                    <div className="font-body">

                                        {item.passesQuantity}
                                    </div>
                                </div>
                                <div onClick={() => !isAllowed() ? null : toggleVisibility("asistencia", item._id)} className="flex gap-1 relative ">
                                    <span className="">asistencia</span>
                                    <div className="flex items-center font-body space-x-1 ">
                                        { dicc[item.asistencia]?.icon&& cloneElement(dicc[item.asistencia].icon, { className: "w-3 h-3" })}
                                        {item.asistencia}
                                    </div>
                                    {
                                        showModalAsistenci[item._id] &&
                                        <ClickAwayListener onClickAway={() => showModalAsistenci[item._id] && setShowModalAsistenci(false)}>
                                            {
                                                showModalAsistenci && (
                                                    <ul
                                                        className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 -left-9 z-40`}
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
                            </div>
                        </div>
                    )
                })
            }
        </>
    )
}

