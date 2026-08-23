
import React, { FC, useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../context";
import { useEventSyncWithUrl } from "../hooks/useEventSyncWithUrl";
import FormCrearMesa from "../components/Forms/FormCrearMesa";
import BlockPanelMesas, { ListTables } from "../components/Mesas/BlockPanelMesas";
import MesasStudioMovil from "../components/Mesas/MesasStudioMovil";
import BlockResumen from "../components/Mesas/BlockResumen";
import BlockInvitados from "../components/Mesas/BlockInvitados";
import ModalMesa from "../components/Mesas/ModalMesa";
import { useDelayUnmount } from "../utils/Funciones";
import ModalLeft from "../components/Utils/ModalLeft";
import FormInvitado from "../components/Forms/FormInvitado";
import VistaSinCookie from "./vista-sin-cookie";
import GuestUpsellPage from "../components/Utils/GuestUpsellPage";
import { SkeletonMesas } from "../components/Utils/SkeletonPage";
import EventLoadingOrError from "../components/Utils/EventLoadingOrError";
import SwiperCore, { Pagination } from 'swiper';
import Prueba from "../components/Mesas/prueba";
import BlockTitle from "../components/Utils/BlockTitle";
import { useMounted } from "../hooks/useMounted"
import ModalBottomSinAway from "../components/Utils/ModalBottomSinAway";
import FormEditarInvitado from "../components/Forms/FormEditarInvitado";
import { motion } from "framer-motion";
import { SubMenu } from "../components/Utils/SubMenu";
import { BlockPlanos } from "../components/Mesas/BlockPlanos";
import { setupDropzone } from "../components/Mesas/FuntionsDragable";
import BlockPanelElements from "../components/Mesas/BlockPanelElements";
import { fetchApiEventos, fetchApiBodas, queries } from "../utils/Fetching";
import { useToast } from "../hooks/useToast";
import BlockPlantillas from "../components/Mesas/BlockPlantillas";
import BlockZonas from "../components/Mesas/BlockZonas";
import TableConfigurator, { TableConfiguratorFloating } from "../components/Forms/TableConfigurator";
import { MesasUndoToast } from "../components/Mesas/MesasUndoToast";
import { useAllowed } from "../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import CopilotFilterBar from "../components/Utils/CopilotFilterBar";
import { GalerySvg } from "../utils/Interfaces";
import { Arbol2, Layer2 } from "../components/icons";
import { ArbolIcon, PlantaIcon, CabinaDjIcon, ArcoIcon, PianoIcon } from "../components/Mesas/furnitureIcons";
import SvgFromString from "../components/SvgFromString";

// eslint-disable-next-line react-hooks/rules-of-hooks
SwiperCore.use([Pagination]);

export const ListElements: GalerySvg[] = [
  // Mobiliario fiel al HTML (iconos de furnitureIcons). El MISMO icono se usa en el menú
  // (BlockPanelElements) y en el plano (ElementContent), para que sean consistentes.
  { icon: <ArbolIcon />, title: "arbol", tipo: "element", size: { width: 60, height: 120 } },
  { icon: <PlantaIcon />, title: "planta", tipo: "element", size: { width: 70, height: 100 } },
  { icon: <CabinaDjIcon />, title: "dj", tipo: "element", size: { width: 140, height: 110 } },
  { icon: <ArcoIcon />, title: "arco", tipo: "element", size: { width: 120, height: 120 } },
  { icon: <PianoIcon />, title: "piano", tipo: "element", size: { width: 120, height: 120 } },
  // Legacy (fuera del menú): tipos antiguos que pudieran tener elementos ya colocados.
  { icon: <Arbol2 className="" />, title: "arbol2", tipo: "element", size: { width: 60, height: 120 } },
  { icon: <Layer2 className="" />, title: "layer2", tipo: "element", size: { width: 280, height: 250 } },
];

// Función helper para convertir SVGs del backend en elementos React
export const convertBackendSvgsToReact = (backendSvgs: any[]): GalerySvg[] => {
  // `icon` debe ser SIEMPRE un React element válido (DragTable/SvgWrapper le hacen
  // cloneElement). Envolvemos en SvgFromString: si el string no es válido/está vacío,
  // SvgFromString degrada a null (pero sigue siendo un element válido para cloneElement),
  // evitando tanto `undefined.match(...)` como `cloneElement(undefined)`.
  return (Array.isArray(backendSvgs) ? backendSvgs : [])
    // Un mueble/elemento decorativo SIEMPRE tiene un SVG. Filtramos entradas SIN SVG
    // válido: son datos corruptos (p.ej. NOMBRES DE PLANO como "recepción"/"ceremonia"
    // guardados por error como galerySvg de tipo element) que se colaban en la grilla
    // de Mobiliario como tarjetas de solo texto. (Data-fix backend aparte; esto evita
    // mostrarlas.)
    .filter((svgItem: any) => typeof svgItem?.icon === 'string' && svgItem.icon.includes('<svg'))
    .map((svgItem: any) => ({
      ...svgItem,
      icon: <SvgFromString svgString={svgItem.icon} className="relative w-max" />,
      size: { width: 60, height: 60 },
    }));
};


// Mapa forma(TableConfigurator) ↔ tipo(backend), para editar una mesa reutilizando el
// panel del HTML (TableConfigurator con initialConfig = modo "Editar mesa", línea 324).
const SHAPE_TO_TIPO_EDIT: Record<string, string> = { round: 'redonda', rectangular: 'imperial', oval: 'redonda', square: 'cuadrada', semicircle: 'podio', head: 'podio' }
const TIPO_TO_SHAPE_EDIT: Record<string, string> = { redonda: 'round', cuadrada: 'square', imperial: 'rectangular', podio: 'round', militar: 'rectangular', bancos: 'rectangular', banco: 'rectangular' }
// Tipos lineales (sillas sueltas en fila) — no son mesas con forma geométrica.
const BENCH_TIPOS = ['bancos', 'banco', 'militar']
const mesaAConfig = (table: any, num?: number): any => {
  const isBench = BENCH_TIPOS.includes(table?.tipo)
  return {
    // 'podio' (antigua forma "media luna"/Novios) ya no es una forma seleccionable:
    // se muestra como redonda + se marca el toggle "Mesa de novios".
    shape: TIPO_TO_SHAPE_EDIT[table?.tipo] ?? 'round',
    seats: table?.numberChair ?? 8,
    tableName: table?.title ?? '',
    // Número REAL de la mesa (índice+1 en el plano), para que el preview no muestre siempre "1"
    ...(typeof num === 'number' && num > 0 ? { tableNumber: num } : {}),
    isHeadTable: table?.tipo === 'podio',
    // Banco = fila lineal de sillas sueltas → el modal muestra un modo simplificado
    // (sin Forma/Tamaño/Tipo-mesa) y preselecciona el estilo de silla "Banco".
    isBench,
    ...(isBench ? { chairStyle: table?.tableConfig?.chairStyle ?? 'bench' } : {}),
  }
}

const Mesas: FC = () => {
  const { t } = useTranslation();
  const { forCms } = AuthContextProvider()
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests, setFilterGuests, allFilterGuests, setEditDefault, planSpaceSelect } = EventContextProvider();
  // BUG-12 (informe QA post-commit): hook centralizado que sincroniza el event
  // activo con ?event= de la URL.
  useEventSyncWithUrl()
  const [values, setValues] = useState<any>({});
  const [showFormCreateTable, setShowFormCreateTable] = useState<boolean>(false);
  const [showFormEditar, setShowFormEditar] = useState<any>({ table: {}, visible: false });
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [editInv, setEditInv] = useState(false)
  const [invitadoSelected, setSelected] = useState<string | null>(null);
  const [itemSelect, setItemSelect] = useState("mesas")
  const [fullScreen, setFullScreen] = useState<boolean>(false)
  const [creaElement, setCreaElement] = useState<boolean>(false)
  const [isAllowed, ht] = useAllowed()
  const { user, verificationDone } = AuthContextProvider()
  const [listElements, setListElements] = useState<GalerySvg[]>(ListElements);

  const toast = useToast()
  useMounted()

  useEffect(() => {
    if (event?.galerySvgVersion) {
      fetchApiEventos({
        query: queries.getGalerySvgs,
        variables: {
          evento_id: event?._id,
          tipo: "element"
        }
      }).then((result: any) => {
        // Convertir los SVGs del backend en elementos React
        const svgsWithReactIcons = convertBackendSvgsToReact(result.results);
        setEvent((prev) => ({ ...prev, galerySvgs: svgsWithReactIcons }));
        // Actualizar también la lista local
        setListElements(prev => {
          // Mantener los elementos estáticos (Arbol, Arbol2, etc.)
          const staticElements = prev.filter(item => !item._id);
          return [...staticElements, ...svgsWithReactIcons];
        });
      })
    }
  }, [event?.galerySvgVersion])

  // Guardar cambios del modal "Editar mesa" (TableConfigurator) → editTable por campo,
  // como FormEditarMesa (title / numberChair / guests) + tipo si cambió la forma.
  const guardarEdicion = async (config: any) => {
    const table = showFormEditar?.table
    if (!table?._id) { setShowFormEditar({ table: {}, visible: false }); return }
    const newTitle = (config?.tableName || table.title || '').toString()
    // Banco = tipo lineal: NUNCA remapear desde la forma (evita banco→imperial que
    // destruiría el layout lineal). Se conserva el tipo original.
    const isBench = BENCH_TIPOS.includes(table?.tipo)
    const newTipo = isBench ? table.tipo : (SHAPE_TO_TIPO_EDIT[config?.shape] ?? table.tipo)
    const newSeats = Number(config?.seats ?? table.numberChair) || table.numberChair
    try {
      // Reducir sillas → quitar invitados de las sillas eliminadas (chair >= newSeats).
      let newGuests = table.guests
      if (newSeats < (table.numberChair ?? 0) && Array.isArray(table.guests)) {
        newGuests = table.guests.filter((g: any) => (g?.chair ?? 0) < newSeats)
      }
      const updatedTable = { ...table, title: newTitle, nombre_mesa: newTitle, tipo: newTipo, numberChair: newSeats, cantidad_sillas: newSeats, guests: newGuests }
      const nps: any = { ...planSpaceActive, tables: (planSpaceActive.tables ?? []).map((tb: any) => tb._id === table._id ? updatedTable : tb) }
      const nextPlanSpaces = (event.planSpace ?? []).map((ps: any) => ps._id === planSpaceActive._id ? nps : ps)
      // Persistir vía updateEvento({planSpace}) — editTable escribe en el legacy
      // evento.mesas_array (desconectado de esta UI de planos).
      const res: any = await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: event._id, input: { planSpace: nextPlanSpaces } },
      })
      if (!res?.success) {
        toast('error', res?.errors?.[0]?.message ?? t('Ha ocurrido un error al editar la mesa'))
        return
      }
      setPlanSpaceActive(nps)
      setEvent((prev: any) => ({ ...prev, planSpace: prev.planSpace.map((ps: any) => ps._id === planSpaceActive._id ? nps : ps) }))
    } catch {
      toast('error', t('Ha ocurrido un error al editar la mesa'))
    } finally {
      setShowFormEditar({ table: {}, visible: false })
    }
  }

  const handleOnDrop = (values: any) => {
    if (!isAllowed()) { ht() } else {
      setValues(values)
      if (values.tipo === "table") {
        setShowFormCreateTable(true)
      }
      if (values.tipo === "element") {
        setCreaElement(true)
      }
      if (values.tipo === "text") {
        setCreaElement(true)
      }
    }
  }

  useEffect(() => {
    if (!creaElement) return
    const element = values.tipo === "element"
      ? event?.galerySvgs
        ? [...event?.galerySvgs, ...ListElements].find(elem => elem.title === values.modelo)
        : ListElements.find(elem => elem.title === values.modelo)
      : null
    try {
      // _id estilo ObjectId (24 hex) — el front es dueño de planSpace[].elements.
      const genId = () => {
        const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
        let rest = ''; for (let i = 0; i < 16; i++) rest += Math.floor(Math.random() * 16).toString(16)
        return ts + rest
      }
      const newElement: any = {
        _id: genId(),
        title: values.tipo === "text" ? "text" : values.modelo,
        position: {
          x: Math.round((values.offsetX ?? 250) - (element?.size?.width ?? 60) / 2),
          y: Math.round((values.offsetY ?? 230) - (element?.size?.height ?? 60) / 2)
        },
        tipo: values.tipo === "text" ? "text" : values.modelo,
        rotation: 0,
        size: element?.size ?? { width: 60, height: 60 }
      }
      // El backend createElement hace evento.planSpace.push(element) — mete el mueble
      // como un PLANO nuevo (bug), no en planSpace[activo].elements. Persistimos vía
      // updateEvento({planSpace}) añadiéndolo a los elements del plano activo (igual que mesas).
      const newPlanSpaceActive: any = {
        ...planSpaceActive,
        elements: [...(planSpaceActive.elements ?? []), newElement],
      }
      const nextPlanSpaces = (event.planSpace ?? []).map((ps: any) =>
        (ps?._id === planSpaceActive._id || ps?._id === planSpaceSelect) ? newPlanSpaceActive : ps
      )
      setPlanSpaceActive(newPlanSpaceActive)
      setEvent((prev: any) => ({
        ...prev,
        planSpace: prev.planSpace.map((ps: any) =>
          (ps?._id === planSpaceActive._id || ps?._id === planSpaceSelect) ? newPlanSpaceActive : ps
        ),
      }))
      fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: event._id, input: { planSpace: nextPlanSpaces } },
      }).then((r: any) => {
        if (r && r.success === false) toast("error", t("Ha ocurrido un error al añadir el objeto"))
      }).catch(() => toast("error", t("Ha ocurrido un error al añadir el objeto")))
      setCreaElement(false)
    } catch (err) {
      toast("error", t("Ha ocurrido un error al añadir el objeto"))
      setCreaElement(false)
    }
  }, [creaElement])

  useEffect(() => {
    const defaultTablesDraggable = ListTables.map(elem => `#dragN${elem.title}_${elem.tipo}`)
    const defaultElementsDraggable = event?.galerySvgs
      ? [...event?.galerySvgs, ...ListElements].map(elem => `#dragN${elem.title}_${elem.tipo}`)
      : ListElements.map(elem => `#dragN${elem.title}_${elem.tipo}`)
    setupDropzone({ target: '.js-dropTables', accept: `${[...defaultTablesDraggable, ...defaultElementsDraggable, "#dragN_text"]}`, handleOnDrop, setEvent, event, planSpaceActive, setPlanSpaceActive, planSpaceSelect })
  }, [planSpaceActive, event?.galerySvgs])

  // Click-para-agregar mobiliario: el drop de interact.js sobre el canvas con zoom/pan
  // es frágil; DragTable emite 'mesas-add-element' al hacer clic y aquí lo colocamos en
  // el centro visible del plano (el usuario puede moverlo luego — ya persiste).
  useEffect(() => {
    const onAddElement = (e: any) => {
      const modelo = e?.detail?.modelo
      const tipo = e?.detail?.tipo
      if (tipo !== 'element' && tipo !== 'text') return
      const offsetX = 250 + Math.round(Math.random() * 80 - 40)
      const offsetY = 230 + Math.round(Math.random() * 80 - 40)
      handleOnDrop({ modelo, tipo, offsetX, offsetY })
    }
    window.addEventListener('mesas-add-element', onAddElement)
    return () => window.removeEventListener('mesas-add-element', onAddElement)
  }, [planSpaceActive, event])

  useEffect(() => {
    if (allFilterGuests) {
      setFilterGuests(allFilterGuests[event?.planSpace?.findIndex(elem => elem._id === planSpaceActive?._id)])
    }
  }, [allFilterGuests])

  useEffect(() => {
    if (!showFormEditar) {
      setEditDefault(old => { return { ...old, activeButtons: true } })
    }
  }, [showFormEditar])

  if (verificationDone) {
    if (user?.displayName === 'guest') {
      return (
        <GuestUpsellPage
          section="Plano de mesas"
          icon="🪑"
          description="Regístrate gratis para crear el plano real de tu evento y asignar invitados a mesas con herramientas de organización."
          benefits={[
            "Editor visual de mesas y salas",
            "Asignación de invitados y control de capacidad",
            "Enlaces para proveedores y seating público",
          ]}
        />
      );
    }
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }

    if (!event) return <EventLoadingOrError skeleton={<SkeletonMesas tables={6} />} />
    return (
      <>
        {/* formulario emergente para crear mesas */}
        {showFormCreateTable ? (
          <ModalMesa set={setShowFormCreateTable} state={showFormCreateTable} title={t("addtable")}>
            <FormCrearMesa
              values={values}
              set={setShowFormCreateTable}
              state={showFormCreateTable}
            />
          </ModalMesa>
        ) : null}
        {/* formulario emergente para editar mesas */}
        {showFormEditar.visible ? (
          // Modal "Editar mesa" fiel al HTML: reutiliza TableConfigurator (initialConfig →
          // header "Editar mesa"). onConfirm guarda vía editTable (guardarEdicion).
          <TableConfigurator
            initialConfig={mesaAConfig(
              showFormEditar.table,
              (planSpaceActive?.tables ?? []).findIndex((tb: any) => tb?._id === showFormEditar.table?._id) + 1
            )}
            onConfirm={guardarEdicion}
            onCancel={() => setShowFormEditar({ table: {}, visible: false })}
          />
        ) : null}
        {/* formulario emergente para agregar un invitado */}
        {shouldRenderChild && (
          <ModalLeft state={isMounted} set={setIsMounted}>
            <FormInvitado
              state={isMounted}
              set={setIsMounted}
            />
          </ModalLeft>
        )}
        {/* ===== MÓVIL (Fase 1) ===== */}
        <MesasStudioMovil />
        {/* ===== ESCRITORIO ===== */}
        <div className="hidden md:block font-display">
          <section id="areaDrag" className={`w-full h-full pt-2 md:py-0 static`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 ">
              <CopilotFilterBar entity={['tables', 'guests']} />
              <BlockTitle title={"Mesas y asientos"} />
            </motion.div>
            <div className={`${fullScreen || forCms ? "absolute z-[50] w-[100vw] h-[100vh] top-0 left-0" : "w-full h-[calc(100vh-240px)] md:h-[calc(100vh-242px)] md:mt-2"}`}>
              <div className={`flex flex-col md:flex-row w-full items-center h-full`}>
                <div className={`mesas-left-menu w-[calc(100%-0px)] mt-2 md:mt-0 ${fullScreen ? " md:w-[23%] h-[calc(30%-8px)]" : " md:w-[25%] h-[calc(30%-8px)]"} md:h-[100%] flex flex-col items-center`}>
                  {/* Scrollbars INVISIBLES en todo el menú izquierdo (el theme los pinta rosa). El scroll sigue funcionando. */}
                  <style>{`.mesas-left-menu ::-webkit-scrollbar{width:0 !important;height:0 !important;display:none !important}.mesas-left-menu,.mesas-left-menu *{scrollbar-width:none !important;-ms-overflow-style:none !important}`}</style>
                  <div className="bg-white rounded-t-lg md:rounded-none w-[100%] h-10 ">
                    <SubMenu itemSelect={itemSelect} setItemSelect={setItemSelect} />
                  </div>
                  <div className={`bg-white flex w-[100%] h-[calc(100%-40px)]`} >
                    <div className="flex flex-col h-[100%] min-h-0 w-full md:px-2 justify-start transform transition duration-700 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {/* BUG-18 (informe QA 21-jun): el panel con `h-[40%]` (md+ no full) cortaba los
                          últimos items de ListTables (banco/bancos quedaban fuera del área visible
                          aunque BlockDefault tuviera overflow-auto). Subimos a 50% + min-h específico
                          para asegurar que los 7 tipos de mesa caben. */}
                      <div className={`bg-white w-[100%] h-[100%] my-1 min-h-[280px] ${fullScreen ? "md:h-[35%] 2xl:h-[30%]" : "md:h-[50%] 2xl:h-[30%] rounded-lg shadow-lg"}`}>
                        {itemSelect == "invitados" &&
                          <BlockInvitados set={setIsMounted} setEditInv={setEditInv} editInv={editInv} setSelected={setSelected} />
                        }
                        {itemSelect == "mesas" &&
                          <BlockPanelMesas setShowFormEditar={setShowFormEditar} />
                        }
                        {itemSelect == "mobiliario" &&
                          <BlockPanelElements listElements={listElements} setListElements={setListElements} />
                        }
                        {itemSelect == "zonas" &&
                          <BlockZonas />
                          //<span>En desarrollo!</span>
                          // <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                        {itemSelect == "planos" &&
                          <BlockPlanos />
                        }
                        {itemSelect == "plantillas" &&
                          <BlockPlantillas />
                        }
                        {itemSelect == "resumen" &&
                          <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                      </div>
                      <div className={`w-[100%] h-[100%] ${fullScreen ? "md:h-[calc(70%-16px)] 2xl:h-[calc(75%-16px)]" : "md:h-[calc(60%-16px)] 2xl:h-[calc(75%-16px)]"} hidden md:block`}>
                        {true && <BlockInvitados
                          set={setIsMounted}
                          setEditInv={setEditInv}
                          editInv={editInv}
                          setSelected={setSelected}
                        />}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`bg-base  pt-2 md:pt-0 md:block flex justify-center items-center w-full ${fullScreen ? "md:w-[77%]" : "md:w-[75%]"} h-[calc(70%-0px)] md:h-[100%]`}>
                  <Prueba setShowFormEditar={setShowFormEditar} fullScreen={fullScreen} setFullScreen={setFullScreen} />
                </div>

              </div >
            </div>
          </section >
          {/* <div className="md:hidden w-full h-[80px]" /> */}
        </div >
        <ModalBottomSinAway state={editInv} set={setEditInv}>
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
              {invitadoSelected !== null ? (
                <FormEditarInvitado
                  //ListaGrupos={event?.grupos_array}
                  invitado={event.invitados_array.find(
                    (guest) => guest._id === invitadoSelected
                  )}
                  setInvitadoSelected={setSelected}
                  state={editInv}
                  set={setEditInv}
                />
              ) : (
                <div className="w-full h-96 grid place-items-center">
                  {" "}
                  <p className="font-display text-lg ">
                    {t("noguestselected")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ModalBottomSinAway>
        {/* Capa superior: configurador visual de mesas (no modifica el sistema existente) */}
        <TableConfiguratorFloating />
        {/* Toast «Deshacer» tras crear/borrar mesa */}
        <MesasUndoToast />
      </>
    );
  }
};

export default Mesas;
