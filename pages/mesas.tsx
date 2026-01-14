
import React, { FC, useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../context";
import FormCrearMesa from "../components/Forms/FormCrearMesa";
import BlockPanelMesas, { ListTables } from "../components/Mesas/BlockPanelMesas";
import BlockResumen from "../components/Mesas/BlockResumen";
import BlockInvitados from "../components/Mesas/BlockInvitados";
import ModalMesa from "../components/Mesas/ModalMesa";
import { useDelayUnmount } from "../utils/Funciones";
import ModalLeft from "../components/Utils/ModalLeft";
import FormInvitado from "../components/Forms/FormInvitado";
import VistaSinCookie from "./vista-sin-cookie";
import SwiperCore, { Pagination } from 'swiper';
import Prueba from "../components/Mesas/prueba";
import FormEditarMesa from "../components/Forms/FormEditarMesa";
import BlockTitle from "../components/Utils/BlockTitle";
import { useMounted } from "../hooks/useMounted"
import ModalBottomSinAway from "../components/Utils/ModalBottomSinAway";
import FormEditarInvitado from "../components/Forms/FormEditarInvitado";
import { motion } from "framer-motion";
import { SubMenu } from "../components/Utils/SubMenu";
import { BlockPlanos } from "../components/Mesas/BlockPlanos";
import { setupDropzone } from "../components/Mesas/FuntionsDragable";
import BlockPanelElements from "../components/Mesas/BlockPanelElements";
import { fetchApiEventos, queries } from "../utils/Fetching";
import { useToast } from "../hooks/useToast";
import BlockPlantillas from "../components/Mesas/BlockPlantillas";
import BlockZonas from "../components/Mesas/BlockZonas";
import { useAllowed } from "../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { GalerySvg } from "../utils/Interfaces";
import { Arbol, Arbol2, Dj, Layer2, Piano } from "../components/icons";
import SvgFromString from "../components/SvgFromString";

// eslint-disable-next-line react-hooks/rules-of-hooks
SwiperCore.use([Pagination]);

export const ListElements: GalerySvg[] = [
  { icon: <Arbol className="" />, title: "arbol", tipo: "element", size: { width: 60, height: 120 } },
  { icon: <Arbol2 className="" />, title: "arbol2", tipo: "element", size: { width: 60, height: 120 } },
  { icon: <Dj className="" />, title: "dj", tipo: "element", size: { width: 140, height: 110 } },
  { icon: <Layer2 className="" />, title: "layer2", tipo: "element", size: { width: 280, height: 250 } },
  { icon: <Piano className="" />, title: "piano", tipo: "element", size: { width: 120, height: 120 } },
];

// Función helper para convertir SVGs del backend en elementos React
export const convertBackendSvgsToReact = (backendSvgs: any[]): GalerySvg[] => {
  return backendSvgs.map((svgItem: any) => ({
    ...svgItem,
    // Convertir el string SVG del backend en un componente React usando SvgFromString
    icon: <SvgFromString svgString={svgItem.icon} className="relative w-max" />,
    size: { width: 60, height: 60 }
  }));
};


const Mesas: FC = () => {
  const { t } = useTranslation();
  const { forCms } = AuthContextProvider()
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests, setFilterGuests, allFilterGuests, setEditDefault, planSpaceSelect } = EventContextProvider();
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
        event.galerySvgs = svgsWithReactIcons;
        setEvent({ ...event });
        // Actualizar también la lista local
        setListElements(prev => {
          // Mantener los elementos estáticos (Arbol, Arbol2, etc.)
          const staticElements = prev.filter(item => !item._id);
          return [...staticElements, ...svgsWithReactIcons];
        });
      })
    }
  }, [event?.galerySvgVersion])

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
    if (creaElement) {
      const element = values.tipo === "element"
        ? event?.galerySvgs
          ? [...event?.galerySvgs, ...ListElements].find(elem => elem.title === values.modelo)
          : ListElements.find(elem => elem.title === values.modelo)
        : null
      try {
        const inputValues = {
          position: {
            x: (values.offsetX - (element?.size?.width ?? 60) / 2).toFixed(0),
            y: (values.offsetY - (element?.size?.height ?? 60) / 2).toFixed(0)
          },
          tipo: values.tipo === "text" ? "text" : values.modelo,
          rotation: 0,
          size: element?.size ?? { width: 60, height: 60 }
        }
        fetchApiEventos({
          query: queries.createElement,
          variables: {
            eventID: event._id,
            planSpaceID: planSpaceActive._id,
            values: JSON.stringify({ ...inputValues })
          },
        }).then((result: any) => {
          planSpaceActive.elements.push({ ...result })
          setPlanSpaceActive({ ...planSpaceActive })
          event.planSpace[planSpaceSelect] = planSpaceActive
          setEvent({ ...event })
          setCreaElement(false)
        })
      } catch (err) {
        toast("error", t("Ha ocurrido un error al añadir el objeto"))
        console.log(err);
      }
    }
  }, [creaElement])

  useEffect(() => {
    const defaultTablesDraggable = ListTables.map(elem => `#dragN${elem.title}_${elem.tipo}`)
    const defaultElementsDraggable = event?.galerySvgs
      ? [...event?.galerySvgs, ...ListElements].map(elem => `#dragN${elem.title}_${elem.tipo}`)
      : ListElements.map(elem => `#dragN${elem.title}_${elem.tipo}`)
    setupDropzone({ target: '.js-dropTables', accept: `${[...defaultTablesDraggable, ...defaultElementsDraggable, "#dragN_text"]}`, handleOnDrop, setEvent, event, planSpaceActive, setPlanSpaceActive, planSpaceSelect })
  }, [planSpaceActive, event?.galerySvgs])

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
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }

    if (!event) return <></>
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
          <ModalMesa set={setShowFormEditar} state={showFormEditar} title={`${t("table")}: "${showFormEditar.table.title}"`}>
            <FormEditarMesa
              set={setShowFormEditar}
              state={showFormEditar}
            />
          </ModalMesa>
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
        <div className="font-display">
          <section id="areaDrag" className={`w-full h-full pt-2 md:py-0 static`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 ">
              <BlockTitle title={"Mesas y asientos"} />
            </motion.div>
            <div className={`${fullScreen || forCms ? "absolute z-[50] w-[100vw] h-[100vh] top-0 left-0" : "w-full h-[calc(100vh-208px)] md:h-[calc(100vh-210px)] md:mt-2"}`}>
              <div className={`flex flex-col md:flex-row w-full items-center h-full`}>
                <div className={`w-[calc(100%-0px)] mt-2 md:mt-0 ${fullScreen ? " md:w-[23%] h-[calc(30%-8px)]" : " md:w-[25%] h-[calc(30%-8px)]"} md:h-[100%] flex flex-col items-center`}>
                  <div className="bg-primary rounded-t-lg md:rounded-none w-[100%] ] h-10 ">
                    <SubMenu itemSelect={itemSelect} setItemSelect={setItemSelect} />
                  </div>
                  <div className={`bg-base flex w-[100%] h-[calc(100%-40px)]`} >
                    <div className="flex flex-col h-[100%] w-full md:px-2 justify-start transform transition duration-700">
                      <div className={`bg-white w-[100%] h-[100%] my-1 ${fullScreen ? "md:h-[30%] 2xl:h-[25%]" : "md:h-[40%] 2xl:h-[25%] rounded-lg shadow-lg"}`}>
                        {itemSelect == "invitados" &&
                          <BlockInvitados set={setIsMounted} setEditInv={setEditInv} editInv={editInv} setSelected={setSelected} />
                        }
                        {itemSelect == "mesas" &&
                          <BlockPanelMesas />
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
      </>
    );
  }
};

export default Mesas;
