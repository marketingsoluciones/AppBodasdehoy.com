import { cloneElement, FC, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
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
import { useTranslation } from "react-i18next";
import { LiaLinkSolid } from "react-icons/lia";
import { CopiarLink } from "../Utils/Compartir";
import { handleMoveGuest } from "./GrupoTablas";
import { guest } from "../../utils/Interfaces";


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
    t: any
}

export const BlockTableroInvitados: FC<propsBlockListaInvitados> = ({ ConditionalAction, handleClick }) => {
    const { t } = useTranslation();
    const { event, allFilterGuests, setEvent } = EventContextProvider();
    const [isMounted, setIsMounted] = useState(false);
    const shouldRenderChild = useDelayUnmount(isMounted, 500);
    const [invitadoSelected, setSelected] = useState<string | null>(null);
    const GuestsFathers = event?.invitados_array?.filter((invitado) => !invitado?.father)
    const [data, setData] = useState<{ titulo: string; data: guestsExt[] }[]>([]);
    const [modal, setModal] = useState({ state: false, title: null, handle: () => { } })
    const [showCards, setShowCards] = useState({})
    const [isAllowed, ht] = useAllowed()


    const handleShowCards = (itemTitle) => {
        setShowCards((prevState) => ({
            ...prevState,
            [itemTitle]: !prevState[itemTitle],
        }));
    };

    useEffect(() => {
        const keys = Object.keys(showCards)
        if (!keys?.length) {
            const separators = data?.reduce((acc, item) => {
                acc = {
                    ...acc,
                    [item.titulo]: !!item.data.length
                }
                return acc
            }, {})
            setShowCards(separators)
        }
    }, [data])

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
    }, [allFilterGuests, event]);


    return (
        <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full pt-2 pb-28 mb-32  relative" >
            <div className="flex  items-center justify-between relative">
                <div className="flex gap-2 items-center mt-1 mb-3 md:mb-5 mx-2">
                    <button
                        onClick={(e) => !isAllowed() ? ht() : ConditionalAction({ e })}
                        className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary md:bg-primary md:text-white md:hover:bg-white md:hover:text-primary capitalize"
                    >
                        <PlusIcon />
                        {t("invitados")}
                    </button>
                    <button
                        onClick={(e) => !isAllowed() ? ht() : handleClick(e, "grupo")}
                        className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize"
                    >
                        <PlusIcon />
                        {t("grupo")}
                    </button>
                    <button
                        onClick={(e) => !isAllowed() ? ht() : handleClick(e, "menu")}
                        className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize"
                    >
                        <PlusIcon />
                        {t("menu")}
                    </button>
                    {/* <button
                    onClick={() => !isAllowed() ? ht() : event?.invitados_array.length > 0 ? setCreatePDF(!createPDF) : toast("error", "Debes agregar invitados")}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
                    >
                    
                    Crear PDF
                    </button> */}
                </div>
            </div>
            {shouldRenderChild && (
                <ModalBottom state={isMounted} set={setIsMounted}>
                    <div className="flex justify-center w-full gap-6">
                        <div className="w-full md:w-5/6">
                            <div className="border-l-2 border-gray-100 pl-3 my-6 w-full ">
                                <h2 className="font-display text-2xl capitalize text-primary font-light">
                                    {t("edit")} <br />
                                    <span className="font-display text-4xl capitalize text-gray-500 font-medium">
                                        {t("guest")}
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
                                        {t("noguestselected")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalBottom>
            )}
            <div className="relative overflow-x-auto md:overflow-x-visible space-y-3">
                {data.map((item, idx) => {
                    return (
                        <div key={idx} >
                            <div onClick={() => handleShowCards(item.titulo)} className="bg-gray-100 px-3 py-2 flex items-center justify-between hover:cursor-pointer">
                                <div className="capitalize text-azulCorporativo">
                                    {item.titulo}
                                </div>
                                <div className="flex items-center space-x-2">
                                    {!!item?.data?.length ?
                                        <span className="flex text-sm rounded-full w-7 h-7 bg-gray-300 items-center justify-center">
                                            {item?.data?.length}
                                        </span> :
                                        <span className="flex text-sm rounded-full w-7 h-7 bg-gray-300 items-center justify-center">
                                            0
                                        </span>
                                    }
                                    <div className={`text-azulCorporativo ${!showCards[item.titulo] && "-rotate-90"}`}>
                                        <ArrowDown />
                                    </div>
                                </div>
                            </div>
                            <div className={`transition-all duration-200 ease-in-out`}>
                                {
                                    showCards[item.titulo] &&
                                    <div>
                                        {
                                            item.data.length > 0 ?
                                                <GuestCard
                                                    guestData={item.data}
                                                    modal={modal}
                                                    setModal={setModal}
                                                    setSelected={setSelected}
                                                    setIsMounted={setIsMounted}
                                                    isMounted={isMounted}
                                                    event={event}
                                                    setEvent={setEvent}
                                                /> :
                                                <div className="capitalize flex items-center justify-center pt-4">
                                                    sin invitados
                                                </div>
                                        }
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


export const GuestCard = ({ guestData, modal, setModal, setSelected, setIsMounted, isMounted, event, setEvent }) => {
    const [show, setShow] = useState({});
    const [showModalMenu, setShowModalMenu] = useState({});
    const [showModalRecepcion, setShowModalRecepcion] = useState({});
    const [showModalCeremonia, setShowModalCeremonia] = useState({});
    const [showModalAsistenci, setShowModalAsistenci] = useState({});
    const [showModalAcompañante2, setShowModalAcompañante2] = useState({ state: false, id: null });
    const [showModalCompartir, setShowModalCompartir] = useState({});
    const [acompañanteID, setAcompañanteID] = useState({ id: "", crear: true })
    const [value, setValue] = useState("sin menú");
    const [value2, setValue2] = useState<guest>();
    const [value3, setValue3] = useState("pendiente");
    const [loading, setLoading] = useState(false);
    const [idGuest, setIdGuest] = useState(null)
    const router = useRouter();
    const toast = useToast()
    const [isAllowed] = useAllowed()
    const GuestsByFather = event?.invitados_array?.filter((invitado) => invitado?.father === acompañanteID.id)
    const { t } = useTranslation()
    const link = `${window?.location?.origin}?pGuestEvent=${idGuest}${event._id?.slice(3, 9)}${event._id}`


    useEffect(() => {
        setAcompañanteID({ id: showModalAcompañante2.id, crear: false })
    }, [showModalAcompañante2.id])

    useEffect(() => {
        setAcompañanteID(old => ({ ...old, crear: false }))
        if (event.showChildrenGuest === showModalAcompañante2.id && !showModalAcompañante2) {
            setAcompañanteID({ id: showModalAcompañante2.id, crear: false })
            return
        }
        fetchApiEventos({
            query: queries.eventUpdate,
            variables: {
                idEvento: event._id,
                variable: "showChildrenGuest",
                value: !showModalAcompañante2 ? showModalAcompañante2.id : ""
            }
        })
        event.showChildrenGuest = !showModalAcompañante2 ? showModalAcompañante2.id : null
        setEvent({ ...event })


    }, [acompañanteID.id, showModalAcompañante2])

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
                toast("success", `${t("Cambio guardado")} `,)
            }
        } catch (error) {
            console.log(error);
        }
    };
    const toggleVisibility = (option, _id, dataMesa) => {
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
            setValue2(dataMesa)
        }
        if (option === "ceremonia") {
            setShowModalCeremonia((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
            setValue2(dataMesa)
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
        if (option === "compartir") {
            setShowModalCompartir((prevState) => ({
                ...prevState,
                [_id]: !prevState[_id],
            }));
            setIdGuest(_id)
        }
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
                <Modal set={setModal} state={modal.state} classe={"w-[95%] md:w-[450px] h-[200px]"}>
                    <DeleteConfirmation setModal={setModal} modal={modal} />
                </Modal>}
            {
                guestData.length > 0 && guestData?.map((item, idx) => {
                    return (
                        <>
                            <div key={idx+1} className={`hover:bg-gray-200 ${showModalAcompañante2.state && showModalAcompañante2.id === item._id ? "bg-gray-200" : ""}  bg-gray-100 my-2 mx-2 rounded-md grid grid-cols-6 relative `}>
                                <div className=" pt-2 pl-2 justify-self-center relative col-span-1 h-max ">
                                    <img
                                        className="block w-10 h-10 mr-2"
                                        src={image[item.sexo]?.image}
                                        alt={image[item.sexo]?.alt}
                                    />
                                </div>
                                <div className="col-span-4 grid grid-cols-2  justify-between pb-2 pt-2 border-gray-500  transition  capitalize">
                                    <div className="col-span-2">
                                        <p className="font-display text-2xl capitalize overflow-ellipsis text-gray-700">
                                            {item.nombre}
                                        </p>
                                    </div>
                                    <div className="items-center col-span-2  grid grid-cols-2 py-1 relative">
                                        <div className="font-semibold text-[12px] ">asistencia :</div>
                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("asistencia", item._id, null)} className="flex items-center justify-between font-body col-span-1">
                                            <div className="flex items-center text-[14px] space-x-1 -ml-[13px]">
                                                {dicc[item.asistencia]?.icon && cloneElement(dicc[item.asistencia].icon, { className: "w-4 h-4" })}
                                                <div>
                                                    {item.asistencia}
                                                </div>
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
                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("menu", item._id, null)} className=" flex items-center justify-between ">
                                            <p className=" font-body text-[12px] pl-2"> {item.nombre_menu == null ? "sin menu" : item.nombre_menu}</p>
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
                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("recepcion", item._id, item.tableNameRecepcion)} className="flex items-center justify-between">
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
                                                                    if (item?.guests?.length < item?.numberChair || !value2?._id === item?._id || !item?._id) {
                                                                        return (
                                                                            <li
                                                                                key={idx}
                                                                                className={`${(value2?._id === item._id || (!value2?._id && !item._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                                onClick={() => {
                                                                                    const f1 = event?.planSpace.findIndex(elem => elem?.title === "recepción")
                                                                                    const table = event.planSpace[f1]?.tables.find(el => el._id === item._id)
                                                                                    setShowModalRecepcion(!showModalRecepcion);
                                                                                    if (item?.tableNameRecepcion?._id || item?._id) {
                                                                                        if (item?.tableNameRecepcion?._id !== item?._id) {
                                                                                            setValue2(item.title);
                                                                                            handleMoveGuest({ t, invitadoID: idGuest, previousTable: value2, lastTable: table, f1, event, setEvent, toast })
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {item?.title}
                                                                            </li>
                                                                        )
                                                                    } 
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
                                        <div onClick={() => !isAllowed() ? null : toggleVisibility("ceremonia", item._id, item.tableNameCeremonia)} className="flex items-center justify-between">
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
                                                                    if (elem?.guests?.length < elem?.numberChair || value2?._id === elem?._id || !elem?._id) {
                                                                        return (
                                                                            <li
                                                                                key={index}
                                                                                className={`${(value2?._id === elem._id || (!value2?._id && !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                                onClick={() => {
                                                                                    const f1 = event?.planSpace.findIndex(elem => elem?.title === "ceremonia")
                                                                                    const table = event.planSpace[f1]?.tables.find(el => el._id === elem._id)
                                                                                    setShowModalCeremonia(false);
                                                                                    if (elem.tableNameCeremonia?._id || elem?._id) {
                                                                                        if (elem.tableNameCeremonia?._id !== elem?._id) {
                                                                                            setValue2(elem.title);
                                                                                            handleMoveGuest({ t, invitadoID: idGuest, previousTable: value2, lastTable: table, f1, event, setEvent, toast })
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {elem?.title}
                                                                            </li>
                                                                        )
                                                                    }
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
                                        <div onClick={() => {
                                            !isAllowed() ? null : item?.passesQuantity > 0 ? setShowModalAcompañante2({ state: !showModalAcompañante2.state, id: item._id }) : null
                                        }} className="font-body text-[12px] pl-2 flex items-center justify-between">
                                            {item.passesQuantity}
                                            <div className={`${item?.passesQuantity > 0 ? "block" : "hidden"} pl-2  "`}>
                                                <ArrowDown className="h-2 w-2" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className=" flex  justify-self-end relative col-span-1 ">
                                    <div onClick={() => !isAllowed() ? null : toggleVisibility("compartir", item._id, null)} className="pt-[13px] pr-2 h-max">
                                        <LiaLinkSolid className="h-auto w-5" />
                                    </div>
                                    <div onClick={() => !isAllowed() ? null : toggleVisibility("options", item._id, null)} className="pt-4 pr-3 h-max">
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
                                {
                                    showModalCompartir[item._id] && <ClickAwayListener onClickAway={() => showModalCompartir[item._id] && setShowModalCompartir(false)}>
                                        <ul
                                            className={`${showModalCompartir ? "block opacity-100" : "hidden opacity-0"
                                                } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-[50px] left-9 w-[300px]`}
                                        >
                                            <li
                                                className="flex items-center py-4 px-6 font-display text-sm text-gray-500 bg-base transition w-full capitalize"
                                            >
                                                <CopiarLink link={link} />
                                            </li>
                                        </ul>
                                    </ClickAwayListener>
                                }
                            </div >
                            {
                                showModalAcompañante2.id === item._id &&
                                <div >
                                    <AcompañantesCard
                                        GuestsByFather={GuestsByFather}
                                        image={image}
                                        showModalAsistenci={showModalAsistenci}
                                        setShowModalAsistenci={setShowModalAsistenci}
                                        setValue3={setValue3}
                                        ListaState={ListaState}
                                        dicc={dicc}
                                        showModalMenu={showModalMenu}
                                        setShowModalMenu={setShowModalMenu}
                                        event={event}
                                        setValue={setValue}
                                        value={value}
                                        toggleVisibility={toggleVisibility}
                                        showModalRecepcion={showModalRecepcion}
                                        setShowModalRecepcion={setShowModalRecepcion}
                                        setValue2={setValue2}
                                        value2={value2}
                                        showModalCeremonia={showModalCeremonia}
                                        setShowModalCeremonia={setShowModalCeremonia}
                                        show={show}
                                        setShow={setShow}
                                        ListaOption={ListaOption}
                                        setModal={setModal}
                                        toast={toast}
                                        setEvent={setEvent}
                                        idGuest={showModalAcompañante2.id}
                                        showModalAcompañante2={showModalAcompañante2}
                                        idFather={item._id}
                                        passesQuantity={item?.passesQuantity}

                                    />
                                </div >
                            }

                        </>
                    )
                })
            }

        </>
    )
}


interface propsAcompañantesCard {
    passesQuantity: any
    idFather: any
    showModalAcompañante2: any
    image: any
    showModalAsistenci: any
    setShowModalAsistenci: any
    setValue3: any
    ListaState: any
    dicc: any
    showModalMenu: any
    setShowModalMenu: any
    event: any
    setValue: any
    value: any
    toggleVisibility: any
    showModalRecepcion: any
    setShowModalRecepcion: any
    value2: any
    setValue2: any
    showModalCeremonia: any
    setShowModalCeremonia: any
    show: any
    setShow: any
    ListaOption: any
    setModal: any
    toast: any
    setEvent: any
    idGuest: any
    GuestsByFather: guestsExt[]
}

export const AcompañantesCard: FC<propsAcompañantesCard> = ({ passesQuantity, idFather, showModalAcompañante2, GuestsByFather, image, showModalAsistenci, setShowModalAsistenci, setValue3, ListaState, dicc, showModalMenu, setShowModalMenu, event, setValue, value, toggleVisibility, showModalRecepcion, setShowModalRecepcion, value2, setValue2, showModalCeremonia, setShowModalCeremonia, show, setShow, ListaOption, setModal, toast, setEvent, idGuest }) => {
    const { allFilterGuests } = EventContextProvider();
    const [isAllowed, ht] = useAllowed()
    const router = useRouter();
    const { t } = useTranslation()
    const [data, setData] = useState<{ titulo: string; data: guestsExt[] }[]>([]);


    useEffect(() => {
        let asd = {}
        for (let i = 0; i < event?.grupos_array?.length; i++) {
            asd = { ...asd, [event?.grupos_array[i]]: { titulo: event?.grupos_array[i], data: [] } }
        }
        const tablesRecepcion = event?.planSpace.find(elem => elem?.title === "recepción")?.tables
        const tablesCeremonia = event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables
        const Data = GuestsByFather.reduce((acc, item: guestsExt) => {
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
    }, [allFilterGuests, event]);

    return (
        <>

            {
                showModalAcompañante2.state && GuestsByFather.length > 0 && <div className="border-l border-b border-dotted border-primary rounded-l-lg rounded-t-none ml-2 -mt-3 pl-1 py-2 space-y-1 ">
                    {
                        GuestsByFather?.map((item: guestsExt, idx) => {
                            console.log("--------->", item)
                            return (
                                <div key={idx}  >
                                    <div className={`${item._id === idFather ? "bg-gray-200" : "bg-gray-100"}  mx-2 rounded-md grid grid-cols-8 relative `}>
                                        <div className=" pt-2 pl-2 justify-self-center relative col-span-1 h-max ">
                                            <img
                                                className="block w-8 h-8 mr-2"
                                                src={image[item.sexo]?.image}
                                                alt={image[item.sexo]?.alt}
                                            />
                                        </div>
                                        <div className="col-span-6 grid grid-cols-2 justify-between pb-2 pt-2 pl-1 border-gray-500 transition capitalize">
                                            <div className=" col-span-2">
                                                <p className="font-display text-xl capitalize overflow-ellipsis text-gray-700">
                                                    {item.nombre}
                                                </p>
                                            </div>
                                            <div className="items-center col-span-2 grid grid-cols-2 py-1 relative">
                                                <div className="font-semibold text-[12px] ">asistencia :</div>
                                                <div onClick={() => !isAllowed() ? null : toggleVisibility("asistencia", item._id)} className="flex items-center justify-between font-body col-span-1">
                                                    <div className="flex items-center -translate-x-3">
                                                        {dicc[item.asistencia]?.icon && cloneElement(dicc[item.asistencia].icon, { className: "w-4 h-4" })}
                                                        <span className="translate-x-1">{item.asistencia}</span>
                                                    </div>

                                                    <div className="pl-2 ">
                                                        <ArrowDown className="h-2 w-2" />
                                                    </div>
                                                </div>
                                                {
                                                    showModalAsistenci[item._id] &&
                                                    <ClickAwayListener onClickAway={() => showModalAsistenci[item._id] && setShowModalAsistenci(false)}>
                                                        {
                                                            showModalAsistenci &&
                                                            (
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
                                                    <p className=" font-body text-[12px] pl-2"> {item.nombre_menu == null ? "sin menu" : item.nombre_menu}</p>
                                                    <div className="pl-2">
                                                        <ArrowDown className="h-2 w-2" />
                                                    </div>
                                                </div>
                                                {
                                                    showModalMenu[item._id] &&
                                                    <ClickAwayListener onClickAway={() => showModalMenu[item._id] && setShowModalMenu(false)}>
                                                        {
                                                            showModalMenu[item._id] &&
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
                                                <div onClick={() => !isAllowed() ? null : toggleVisibility("recepcion", item._id, item.tableNameRecepcion)} className="flex items-center justify-between">
                                                    <p className=" font-body text-[12px] pl-2"> {item.tableNameRecepcion.title}</p>
                                                    <div className="pl-2">
                                                        <ArrowDown className="h-2 w-2" />
                                                    </div>
                                                </div>
                                                {
                                                    showModalRecepcion[item._id] &&
                                                    <ClickAwayListener onClickAway={() => showModalRecepcion[item._id] && setShowModalRecepcion(false)}>
                                                        {
                                                            showModalRecepcion[item._id] &&
                                                            (
                                                                <ul className="absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-6 -right-4 z-40 w-max">
                                                                    {
                                                                        [
                                                                            { _id: null, title: "No Asignado" },
                                                                            ...event?.planSpace.find(elem => elem?.title === "recepción")?.tables
                                                                        ]?.map((item: any, idx: any) => {
                                                                            if (item?.guests?.length < item?.numberChair || value2?._id === item?._id || !item?._id) {
                                                                                return (
                                                                                    <li
                                                                                        key={idx}
                                                                                        className={`${(value2?._id === item._id || (!value2?._id && !item._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                                        onClick={() => {
                                                                                            const f1 = event?.planSpace.findIndex(elem => elem?.title === "recepción")
                                                                                            const table = event.planSpace[f1]?.tables.find(el => el._id === item._id)
                                                                                            setShowModalRecepcion(!showModalRecepcion);
                                                                                            if (value2?._id || item?._id) {
                                                                                                if (value2?._id !== item?._id) {
                                                                                                    setValue2(item.title);
                                                                                                    handleMoveGuest({ t, invitadoID:idGuest, previousTable: value2, lastTable: table, f1, event, setEvent, toast })
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        {item?.title}
                                                                                    </li>
                                                                                )
                                                                            }
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
                                                            showModalCeremonia &&
                                                            (
                                                                <ul
                                                                    className={` absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-6 -right-4 z-50 w-max`}
                                                                >
                                                                    {[
                                                                        { _id: null, title: "No Asignado" },
                                                                        ...event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables]?.map((elem: any, index) => {
                                                                            if (elem?.guests?.length < elem?.numberChair || value2?._id === elem?._id || !elem?._id) {
                                                                            return (
                                                                                <li
                                                                                    key={index}
                                                                                    className={`${(value2._id === elem._id || (!value2._id && !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                                                                                    onClick={() => {
                                                                                        const f1 = event?.planSpace.findIndex(elem => elem?.title === "ceremonia")
                                                                                        const table = event.planSpace[f1]?.tables.find(el => el._id === elem._id)
                                                                                        setShowModalCeremonia(false);
                                                                                        if (value2?._id || elem?._id) {
                                                                                            if (value2?._id !== elem?._id) {
                                                                                                setValue(elem.title);
                                                                                                handleMoveGuest({ t, invitadoID: idGuest, previousTable: value2, lastTable: table, f1, event, setEvent, toast })
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    {elem?.title}
                                                                                </li>
                                                                            )
                                                                            }
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
                                                    {
                                                        show[item._id] &&
                                                        (
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
                                                                                            Deseas eliminar a este acompañante ?
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
                </div>
            }
            {
                showModalAcompañante2.state && GuestsByFather.length === 0 &&
                <div className="border-l border-dotted ml-2 py-2 border-primary">
                    <span className="items-center col-span-3 flex *gap-3  justify-center capitalize ">
                        + {passesQuantity} Acompañantes.<span className="text-primary pl-1 cursor-pointer" onClick={() => router.push(`${window?.location?.origin}?pGuestEvent=${idFather}${event._id?.slice(3, 9)}${event._id}`)}>Confirmar aquí</span>
                    </span>

                </div>
            }
        </>
    )
}



