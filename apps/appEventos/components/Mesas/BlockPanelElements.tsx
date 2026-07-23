import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DragTable from "./DragTable"
import SvgFromString from '../SvgFromString';
import { getSvgOptimizationInfo, SVG_SIZE_LIMITS } from '../../utils/svgSizeUtils';
import { customAlphabet } from "nanoid";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { EventContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { GalerySvg } from "../../utils/Interfaces";
import { convertBackendSvgsToReact } from "../../pages/mesas";
import { FURNITURE } from "./furnitureIcons";

interface propsBlockPanelElements {
  listElements: GalerySvg[]
  setListElements: (listElements: GalerySvg[]) => void
}

const BlockPanelElements: FC<propsBlockPanelElements> = ({ listElements, setListElements }) => {
  const { event, setEvent } = EventContextProvider()

  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [svgUrl, setSvgUrl] = useState("");
  const [mounted, setMounted] = useState(false);
  const toast = useToast()

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      const validation = validateSvgSize(file);
      if (!validation.isValid) {
        toast("success", validation.message);
        return;
      }
      if (validation.message) {
        console.warn(validation.message);
      }
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const svgContent = e.target?.result as string;
          const optimizationInfo = getSvgOptimizationInfo(svgContent);
          const newElement: GalerySvg = {
            icon: <SvgFromString svgString={svgContent} className="relative w-max" />,
            title: file.name.replace('.svg', '').replace(/_/g, '-') + "-" + customAlphabet('0123456789abcdef', 5)(),
            tipo: "element",
            size: { width: 60, height: 60 }
          };
          const result: any = await fetchApiEventos({
            query: queries.createGalerySvgs,
            variables: {
              evento_id: event?._id,
              galerySvgs: [{
                title: newElement.title,
                icon: svgContent.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' '),
                tipo: "element"
              }]
            },
          })
          const svgsWithReactIcons = convertBackendSvgsToReact(result.results);
          setEvent((prev) => ({
            ...prev,
            galerySvgs: prev.galerySvgs ? [...prev.galerySvgs, ...svgsWithReactIcons] : svgsWithReactIcons,
          }));
          const newListElements = [...listElements, newElement]
          setListElements(newListElements);
          setShowModal(false);
          setIsLoading(false);
        } catch (error) {
          console.error('Error al procesar el SVG:', error);
          toast("error", "Error al procesar el archivo SVG");
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        toast("error", "Error al leer el archivo");
        setIsLoading(false);
      };
      reader.readAsText(file);
    } else {
      toast("error", "Por favor selecciona un archivo SVG válido");
    }
  };

  const handleUrlSubmit = async () => {
    if (svgUrl) {
      setIsLoading(true);
      try {
        const apiUrl = `/api/fetch-svg?url=${encodeURIComponent(svgUrl)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const svgContent = await response.text();
        const optimizationInfo = getSvgOptimizationInfo(svgContent);
        const urlTitle = svgUrl.split('/').pop()?.replace('.svg', '').replace(/_/g, '-') || customAlphabet('0123456789abcdef', 8)();
        const newElement: GalerySvg = {
          icon: <SvgFromString svgString={svgContent} className="relative w-max" />,
          title: urlTitle,
          tipo: "element",
          size: { width: 60, height: 60 }
        };
        const result: any = await fetchApiEventos({
          query: queries.createGalerySvgs,
          variables: {
            evento_id: event?._id,
            galerySvgs: [{
              title: newElement.title,
              icon: svgContent.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' '),
              tipo: "element"
            }]
          },
        })
        const svgsWithReactIcons = convertBackendSvgsToReact(result.results);
        setEvent((prev) => ({
          ...prev,
          galerySvgs: prev.galerySvgs ? [...prev.galerySvgs, ...svgsWithReactIcons] : svgsWithReactIcons,
        }));
        const newListElements = [...listElements, ...svgsWithReactIcons]
        setListElements(newListElements);
        setShowModal(false);
        setSvgUrl("");
        setIsLoading(false);
      } catch (error) {
        console.error('Error completo al cargar SVG:', error);
        toast("error", `Error al cargar el SVG: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setIsLoading(false);
      }
    } else {
      toast("warning", "Por favor completa todos los campos");
    }
  };

  const validateSvgSize = (file: File) => {
    const sizeInKB = file.size / 1024;
    const maxSizeKB = SVG_SIZE_LIMITS.MAX_FILE_SIZE / 1024;
    if (file.size > SVG_SIZE_LIMITS.MAX_FILE_SIZE) {
      return {
        isValid: false,
        message: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeKB}KB. Tamaño del archivo: ${sizeInKB.toFixed(1)}KB`
      };
    }
    if (file.size > SVG_SIZE_LIMITS.RECOMMENDED_SIZE) {
      return {
        isValid: true,
        message: `El archivo es grande (${sizeInKB.toFixed(1)}KB). Considera optimizarlo para mejor rendimiento.`
      };
    }
    return { isValid: true };
  };

  // Modal "Añadir SVG" — rediseñado a la paleta rosa del prototipo (antes azul/gris genérico).
  // Lógica intacta: handleFileUpload / handleUrlSubmit / createGalerySvgs.
  const Modal = () => (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(43,43,48,.38)] px-4"
      onClick={() => { if (!isLoading) setShowModal(false) }}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-[400px] max-w-full bg-white rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,.28)] p-6 text-[#3A3A42]">
        <div className="flex items-center gap-[11px] mb-[18px]">
          <div className="w-10 h-10 rounded-[11px] flex-none bg-[#FCE7F0] text-[#EF5B94] flex items-center justify-center text-[20px] leading-none">＋</div>
          <div>
            <div className="text-[16px] font-bold text-[#3A3A42]">Añadir SVG</div>
            <div className="text-[11.5px] font-medium text-[#a0a0a8]">Un elemento decorativo para tu plano</div>
          </div>
        </div>
        {/* Límites de tamaño en pastilla rosa (regla proyecto: avisos en pastilla) */}
        <div className="bg-[#FCF2F6] border border-[#f7c2da] rounded-[12px] px-4 py-3 mb-4 text-[11px] font-medium text-[#c14a78] leading-relaxed">
          Máximo {SVG_SIZE_LIMITS.MAX_FILE_SIZE / 1024}KB · Recomendado {SVG_SIZE_LIMITS.RECOMMENDED_SIZE / 1024}KB o menos.
        </div>
        {/* Opción 1: Cargar desde archivo */}
        <div className="mb-4">
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#b3b3ba] mb-2">Cargar desde archivo</div>
          <input
            type="file"
            accept=".svg"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="w-full p-3 rounded-[11px] border-[1.5px] border-[#E7E7EA] text-[12.5px] file:mr-3 file:py-1.5 file:px-3 file:rounded-[8px] file:border-0 file:bg-[#FCE7F0] file:text-[#EF5B94] file:font-semibold file:cursor-pointer disabled:opacity-60"
          />
        </div>
        {/* Opción 2: Cargar desde URL */}
        <div className="mb-4">
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#b3b3ba] mb-2">Cargar desde URL</div>
          <input
            type="text"
            placeholder="https://ejemplo.com/icono.svg"
            value={svgUrl}
            onChange={(e) => setSvgUrl(e.target.value)}
            disabled={isLoading}
            className="w-full p-3 rounded-[11px] border-[1.5px] border-[#E7E7EA] focus:border-[#EF5B94] outline-none text-[12.5px] mb-2 disabled:opacity-60"
          />
          <button
            onClick={handleUrlSubmit}
            disabled={isLoading}
            className="w-full py-[11px] rounded-[11px] bg-[#EF5B94] text-white text-[12.5px] font-semibold disabled:bg-[#f0aecb] disabled:cursor-not-allowed"
          >
            {isLoading ? 'Cargando…' : 'Agregar desde URL'}
          </button>
        </div>
        <button
          onClick={() => setShowModal(false)}
          disabled={isLoading}
          className="w-full py-[11px] rounded-[11px] bg-[#f7f7f9] text-[#6b6b72] text-[12.5px] font-semibold disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Modal usando Portal de react-dom */}
      {mounted && showModal && createPortal(
        <Modal />,
        document.getElementById('rootElementMain') || document.body
      )}
      <div id="listTables" className="w-full h-full flex flex-col">
        {/* Aviso en pastilla ovalada rosa (proto Mobiliario) */}
        <div className="flex-none bg-[#FCF2F6] border border-[#f7c2da] rounded-[999px] px-4 py-[9px] mb-[11px]">
          <div className="text-[10px] font-medium text-[#c14a78] whitespace-nowrap">Arrastra un elemento al plano para añadirlo.</div>
        </div>
        {/* Cabecera de sección */}
        <div className="flex-none text-[11px] font-bold tracking-wider uppercase text-[#b3b3ba] mb-[10px]">Elementos decorativos</div>
        {/* Grid 3-col de tarjetas fiel al HTML. DragTable conserva el motor de arrastre
            (mismos IDs #dragN/#icon + js-dragDefault + handlers); `label` = modo tarjeta. */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="grid grid-cols-3 gap-[9px] content-start">
            {/* 6 elementos base del HTML: Texto · Árbol · Planta · Cabina DJ · Arco · Piano */}
            {FURNITURE.map((f) => {
              const isText = f.model === 'text'
              const item = {
                icon: <f.Icon />,
                title: isText ? '' : f.model,
                tipo: isText ? 'text' : 'element',
                size: f.size,
              } as GalerySvg
              return <DragTable key={f.model} item={item} label={f.label} />
            })}
            {/* SVGs personalizados subidos por el usuario (galery, tienen _id) */}
            {listElements.filter((el) => (el as any)?._id).map((item, idx) => (
              <DragTable key={(item as any)._id || idx} item={item} label={item.title} />
            ))}
            {/* Añadir SVG — tarjeta punteada; abre el modal real (createGalerySvgs) */}
            <div
              id="added-svg"
              onClick={() => { setShowModal(true) }}
              className="w-full flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-[12px] bg-white border-[1.5px] border-dashed border-[#f0aecb] cursor-pointer hover:bg-[#FCF2F6] transition-colors"
            >
              <span className="text-[#EF5B94] text-[18px] leading-none">＋</span>
              <span className="text-[10px] font-semibold text-[#EF5B94] text-center leading-tight">Añadir SVG</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlockPanelElements;