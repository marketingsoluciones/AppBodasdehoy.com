import { useEffect, useState } from "react";
import { GoSearch } from "react-icons/go";
import { fetchApiBodas, fetchApiEventos, queries } from "../../utils/Fetching";
import { AuthContextProvider, EventContextProvider } from "../../context";
import ClickAwayListener from "react-click-away-listener";
import { useTranslation } from 'react-i18next';
import { Venue } from "../../utils/Interfaces";
import { useAllowed } from "../../hooks/useAllowed";

export const BlockLugarEvento = () => {
    const { event, setEvent } = EventContextProvider();
    const { config } = AuthContextProvider();
    const [placesList, setPlacesList] = useState<any[]>([]);
    const [filteredPlaces, setFilteredPlaces] = useState<any[]>([]); // Lista filtrada
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [openList, setOpenList] = useState(false);
    const [lugarEvento, setLugarEvento] = useState<Venue>(event?.lugar);
    const [isAllowed, ht] = useAllowed();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState(""); // Estado para el input de búsqueda

    useEffect(() => {
        if (!openList) return;
        setLoading(true);
        setError(false);
        fetchApiBodas({
            query: queries?.getAllBusiness,
            variables: {
                criteria: {
                    categories: "62057b0f59c9cd5da26eccfa",
                    status: true
                },
                skip: 0,
                development: "bodasdehoy"
            },
            development: config?.development
        })
            .then((result) => {
                // fetchApiBodas devuelve null en errores GraphQL (NO lanza) → tratar como error,
                // no como "0 lugares" (antes quedaba spinner infinito sin explicación).
                if (!result) { setError(true); return; }
                const results = Array.isArray(result?.results) ? result.results : [];
                setPlacesList(results);
                setFilteredPlaces(
                    searchQuery
                        ? results.filter((i) => i?.businessName?.toLowerCase().includes(searchQuery))
                        : results
                );
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [openList]);

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        setFilteredPlaces(
            (placesList ?? []).filter((item) =>
                item?.businessName?.toLowerCase().includes(query)
            )
        );
    };

    const handleClick = (item) => {
        const newLugar = { _id: item._id, title: item.businessName, slug: item?.slug }
        // eventUpdate espera $input: EventoUpdateInput! (lugar = JSON escalar). Antes se pasaba
        // variable/value (firma vieja) → faltaba $input → NO persistía (solo local hasta refrescar).
        fetchApiEventos({
            query: queries?.eventUpdate,
            variables: {
                idEvento: event._id,
                input: { lugar: newLugar },
            }
        });
        setLugarEvento(newLugar);
        setEvent((prev) => ({ ...prev, lugar: newLugar }));
        setOpenList(false);
    };

    return (
        <div className="relative">
            <div
                onClick={() => isAllowed() && setOpenList(!openList)}
                className="bg-primaryOrg space-x-3 rounded-lg text-white flex justify-between items-center pl-1.5 md:pl-5 shadow-lg font-display text-xl select-none h-full"
            >
                <span className="text-[12px] md:text-base">{t("eventvenue")}</span>
                <div
                    className={`bg-white w-[45.8%]. md:w-[62.54%] rounded-lg h-[40px] flex items-center justify-between relative px-2 ${isAllowed() && "cursor-pointer"
                        }`}
                >
                    {/* Input de búsqueda */}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder={lugarEvento?.title || t("search")}
                        className="flex-1 font-display font-base md:text-sm text-[13px] text-gray-700 leading-3 border-none focus:ring-0 focus:outline-none w-[210px] md:w-[250px]"
                        onClick={(e) => {
                            e.stopPropagation(); // Evita que el clic cierre el modal
                            setOpenList(true); // Abre la lista al hacer clic en el input
                        }}
                    />
                    <GoSearch
                        className={`w-6 h-6 ${!isAllowed() ? "text-gray-300" : "text-primaryOrg"
                            }`}
                    />
                </div>
            </div>
            {openList && (
                <ClickAwayListener onClickAway={() => setOpenList(false)}>
                    <div className="bg-white rounded-lg py-2 px-3 space-y-1 absolute z-10 h-[290px] overflow-y-auto right-0 top-12 w-[300px]">
                        {/* Lista de lugares */}
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="loader border-t-2 border-primaryOrg rounded-full w-6 h-6 animate-spin"></div>
                            </div>
                        ) : error ? (
                            <div className="flex justify-center items-center h-full text-center text-xs text-gray-500 px-2">
                                {t("No se pudieron cargar los lugares. Inténtalo de nuevo.")}
                            </div>
                        ) : filteredPlaces && filteredPlaces.length > 0 ? (
                            filteredPlaces.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleClick(item)}
                                    className="hover:bg-slate-100 cursor-pointer rounded-md px-3 py-1"
                                >
                                    {item?.businessName}
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-center items-center h-full text-center text-xs text-gray-500 px-2">
                                {searchQuery ? `${t("Sin resultados para")} "${searchQuery}"` : t("No hay lugares disponibles")}
                            </div>
                        )}
                    </div>
                </ClickAwayListener>
            )}
        </div>
    );
};