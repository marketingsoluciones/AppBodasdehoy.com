import { cloneElement, FC, useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useDelayUnmount } from "../../utils/Funciones";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { ArrowDown, CanceladoIcon, ConfirmadosIcon, PendienteIcon, PlusIcon } from "../icons";
import ModalBottom from "../Utils/ModalBottom";
import FormEditarInvitado from "../Forms/FormEditarInvitado";
import { guests, table } from "../../utils/Interfaces";
import { SlOptionsVertical } from "react-icons/sl";

interface propsBlockListaInvitados {
    state: boolean;
    set: CallableFunction;
    menu?: any
    setGetMenu?: any
    createPDF?: any
    setCreatePDF?: any
}

interface guestsExt extends guests {
    tableNameRecepcion: Partial<table>
    tableNameCeremonia: Partial<table>
}
export const BlockTableroInvitados: FC<propsBlockListaInvitados> = ({ state, set, createPDF, setCreatePDF }) => {
    const { event, allFilterGuests } = EventContextProvider();
    const { actionModals, setActionModals } = AuthContextProvider()
    const [isMounted, setIsMounted] = useState(false);
    const shouldRenderChild = useDelayUnmount(isMounted, 500);
    const [invitadoSelected, setSelected] = useState<string | null>(null);
    const GuestsFathers = event?.invitados_array?.filter((invitado) => !invitado?.father)
    const [data, setData] = useState<{ titulo: string; data: guestsExt[] }[]>([]);
    const [modal, setModal] = useState({ state: false, title: null, handle: () => { } })

    const toast = useToast()
    const [isAllowed, ht] = useAllowed()

    const handleClick = (e, click) => {
        e.preventDefault();
        set({ state: !state, click: click });
    };

    const ConditionalAction = ({ e }) => {
        if (event.invitados_array.length >= 1) {
            setActionModals(!actionModals)
        } else {
            handleClick(e, "invitado")
        }

    }

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

    console.log(data)

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
                <button
                    onClick={() => !isAllowed() ? ht() : event?.invitados_array.length > 0 ? setCreatePDF(!createPDF) : toast("error", "Debes agregar invitados")}
                    className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
                >
                    {/* <PlusIcon /> */}
                    Crear PDF
                </button>
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
                                <div className="bg-gray-100 px-3 py-3 rounded-md flex  items-center justify-between hover:cursor-pointer">
                                    <div className="capitalize text-azulCorporativo">
                                        {item.titulo}
                                    </div>
                                    <div className="text-azulCorporativo">
                                        <ArrowDown />
                                    </div>
                                </div>
                                <GuestCard guestData={item.data} modal={modal} setModal={setModal} />
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}


export const GuestCard = ({ guestData, modal, setModal }) => {
    const [show, setShow] = useState(false);
    const [isAllowed] = useAllowed()


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

    return (
        <>
            {
                guestData.length > 0 && guestData.map((item, idx) => {
                    return (
                        <div key={idx} className="bg-gray-100 my-2 mx-2 rounded-md ">
                            <div className="flex justify-between pl-5 pr-2 relative ">
                                <div
                                    className="flex justify-start items-center truncate pr-3 cursor-pointer pt-3"
                                /*  onClick={!isAllowed() ? null : handleClick} */
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
                                <div className="items-center col-span-2 flex flex-col bg-primary rounded-md text-white py-1">
                                    <p className="font-semibold text-[12px] ">Menu</p>
                                    <p className=" font-body text-[12px]"> {item.nombre_menu}</p>
                                </div>
                                <span className="items-center col-span-3 flex flex-col bg-primary rounded-md text-white py-1 ">
                                    <p className="font-semibold text-[12px] ">Mesa Recepción</p>
                                    <p className=" font-body text-[12px]"> {item.tableNameRecepcion.title}</p>
                                </span>
                                <span className="items-center col-span-3 flex flex-col bg-primary rounded-md text-white py-1 ">
                                    <p className="font-semibold text-[12px] ">Mesa  Ceremonia</p>
                                    <p className=" font-body text-[12px]"> {item.tableNameCeremonia.title}</p>
                                </span>
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
                                <div className="flex gap-1 ">
                                    <span className="">asistencia</span>
                                    <div className="flex items-center font-body space-x-1 ">
                                        {cloneElement(dicc[item.asistencia].icon, { className: "w-3 h-3" })}
                                        {item.asistencia}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })
            }
        </>
    )
}