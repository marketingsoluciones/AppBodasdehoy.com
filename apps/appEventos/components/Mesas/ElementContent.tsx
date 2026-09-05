import { FC, cloneElement, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { ListElements } from "../../pages/mesas";
import { element } from "../../utils/Interfaces";
import { RxQuestionMark } from "react-icons/rx";
import 'react-quill/dist/quill.snow.css';
import dynamic from "next/dynamic";
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching";

interface propsElement {
  item: element
  scale: number
  disableDrag: boolean
}
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-lg" />
});

export const ElementContent: FC<propsElement> = ({ item, scale, disableDrag }) => {
  const { editDefault } = EventContextProvider()
  const [reactElement, setReactElement] = useState<React.ReactElement>();
  const { event, planSpaceActive, setPlanSpaceActive, setEvent } = EventContextProvider()
  // Vacío por defecto → se muestra el placeholder "Escribe aquí" (fiel al prototipo).
  const [customEditor, setCustomEditor] = useState<string>(item?.title || "")
  const [editDefaultOld, setEditDefaultOld] = useState<any>()
  const [isMounted, setIsMounted] = useState(false)
  const [isClickEditor, setIsClickEditor] = useState(false)
  const [triggerClickOutside, setTriggerClickOutside] = useState(new Date())

  useEffect(() => {
    if (!disableDrag || editDefault?.clicked !== item._id) {
      setIsClickEditor(false)
    }
  }, [disableDrag, editDefault?.clicked])

  useEffect(() => {
    if (item?.tipo === "text") {
      if (item?.title !== customEditor) {
        fetchApiBodas({
          query: queries.editElement,
          variables: {
            evento_id: event._id,
            element_id: item._id,
            datos: { title: customEditor }
          }
        }).then((res) => {
          // Update inmutable del title del elemento.
          const newPlanSpaceActive = {
            ...planSpaceActive,
            elements: planSpaceActive.elements.map((el) =>
              el._id !== item._id ? el : { ...el, title: customEditor }
            ),
          }
          setPlanSpaceActive(newPlanSpaceActive)
          setEvent((prev) => ({
            ...prev,
            planSpace: prev.planSpace.map((ps) =>
              ps._id !== planSpaceActive._id ? ps : newPlanSpaceActive
            ),
          }))
        })
      }
    }
  }, [triggerClickOutside])

  // Manejar clics fuera del editor
  useEffect(() => {
    if (isClickEditor && isMounted) {
      const handleClickOutside = (e: MouseEvent) => {
        const elem = document.getElementById(`editor-textTable_${item._id}`)
        const editor = elem?.querySelector('.ql-editor') as HTMLElement
        if (editor) {
          const target = e.target as Node
          // Los botones lápiz/+/- hacen stopPropagation → no llegan aquí.
          if (!editor.contains(target)) {
            setTriggerClickOutside(new Date())
            setIsClickEditor(false)
          }
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isClickEditor, isMounted, item?._id])

  useEffect(() => {
    if (!isMounted) {
      setTimeout(() => {
        setIsMounted(true)
      }, 500)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  // El botón LÁPIZ (en DragableDefault) dispara la edición del texto vía evento,
  // para mostrar el input tipo píldora con borde rosa (fiel al prototipo).
  useEffect(() => {
    const onEdit = (e: any) => {
      if (e?.detail?.id === item._id) {
        setIsClickEditor(true)
        setTimeout(() => {
          const editor = document.getElementById(`editor-textTable_${item._id}`)?.querySelector('.ql-editor') as HTMLElement | null
          editor?.focus()
        }, 0)
      }
    }
    window.addEventListener('mesas-text-edit', onEdit as any)
    return () => window.removeEventListener('mesas-text-edit', onEdit as any)
  }, [item?._id])
  // Sin toolbar Quill: el diseño (prototipo) usa lápiz para editar y +/- para el
  // tamaño de letra (como mobiliario). Texto plano centrado.
  const quillModules = { toolbar: false };

  useEffect(() => {
    if (isMounted && item?.tipo === "text") {
      const elem = document.getElementById(`editor-textTable_${item._id}`)
      const editor = elem?.querySelector('.ql-editor') as HTMLElement
      if (editor) {
        const handleDoubleClick = (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
        }
        const handleClick = (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          setIsClickEditor(true)
        }
        editor.addEventListener('dblclick', handleDoubleClick, true) // true para captura
        editor.addEventListener('click', handleClick, true)
        return () => {
          editor.removeEventListener('dblclick', handleDoubleClick, true)
          editor.removeEventListener('click', handleClick, true)
        }
      }
    }
  }, [isMounted, item?._id, item?.tipo])

  const quillFormats = [
    'size', // Agregar el formato de tamaño
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
  ];

  useEffect(() => {
    setEditDefaultOld(editDefault?.clicked)
    if (item._id === editDefaultOld) {
      window.getSelection()?.removeAllRanges()
    }
  }, [editDefault?.clicked])

  useEffect(() => {
    if (item?.tipo === "text") {
      const reactElement = <div
        className="flex items-center justify-center"
        data-type={item.tipo}
      >
        <ReactQuill
          id={`editor-textTable_${item._id}`}
          value={customEditor}
          onChange={setCustomEditor}
          modules={quillModules}
          formats={quillFormats}
          theme="snow"
          placeholder="Escribe aquí"
          className={`bg-white border-none textTable-editor_${item._id}`}
        />
      </div>
      setReactElement(reactElement)
    } else {
      const element = event?.galerySvgs
        ? [...event?.galerySvgs, ...ListElements].find(elem => elem.title === item.tipo)
        : ListElements.find(elem => elem.title === item.tipo)
      if (element?.icon) {
        const size = item?.size ? item?.size : element?.size
        // En el plano el mobiliario va en GRIS CLARO (como antes) y con el vector más fino
        // (los iconos usan stroke=currentColor/strokeWidth 1.7; aquí los sobreescribimos).
        setReactElement(cloneElement(element?.icon as React.ReactElement<any>, {
          style: { ...size, rotate: `${item?.rotation}deg`, color: '#B4B4BC' },
          stroke: '#B4B4BC',
          strokeWidth: 1.3,
          'data-width': size?.width,
          'data-height': size?.height,
          'data-rotation': item?.rotation
        } as any))
      }
    }
  }, [item, event?.galerySvgs]);

  // Modo edición del texto: seleccionado + click-editor activo (lápiz o clic en el texto).
  // El pill con borde rosa aparece solo aquí. (isClickEditor se resetea al soltar el drag.)
  const isEditing = editDefault?.clicked === item?._id && isClickEditor
  const fontSize = item?.fontSize ?? 14

  return (
    <>
      {reactElement
        ? reactElement
        : <div className="flex items-center justify-center bg-gray-100 rounded-full w-full h-full p-3 text-gray-300">
          <RxQuestionMark className="w-12 h-12 text-gray-500" />
        </div>}
      <style jsx global>{`
        /* Estilos del editor Quill */
        .textTable-editor_${item._id} {
          height: 100%;
          display: flex;
          flex-direction: column;
         # position: relative;
         position: static !important;
        }
        .textTable-editor_${item._id} .ql-container {
          flex: 1 1 auto;
          height: auto !important;
          overflow: hidden;
          font-family: inherit;
          font-size: ${fontSize}px;
          line-height: 1.4;
          position: static !important;
          /* Input tipo píldora con borde rosa SOLO al editar (fiel al prototipo). */
          border: ${isEditing ? "1.5px solid #EF5B94" : "none"} !important;
          border-radius: ${isEditing ? "9999px" : "0"};
          padding: ${isEditing ? "4px 16px" : "0"};
          /* Sin fondo blanco en display: el texto se ve limpio sobre la cuadrícula.
             Solo pinta blanco dentro del pill rosa al editar. */
          background: ${isEditing ? "white" : "transparent"};
          transition: border-color .15s ease, padding .15s ease;
        }
        .textTable-editor_${item._id} .ql-container.ql-snow {
          border: none !important;
          position: static !important;
        }
        .textTable-editor_${item._id} .ql-editor {
          background-color: transparent;
          min-width: 60px;
          padding: 0;
          font-size: ${fontSize}px;
          font-weight: 600;
          text-align: center;
          color: #1f2937;
          height: 100%;
          overflow-y: auto;
          position: static !important;
          cursor: ${isEditing ? "text" : "pointer"};
        }
        .textTable-editor_${item._id} .ql-toolbar {
          ${editDefault?.clicked === item._id && !disableDrag && isClickEditor ? "visibility: visible" : "display: none"};
          width: 400px;
          
          transform:
          translatey(
          ${item.rotation > -1 && item.rotation < 105
          ? `-${100 / scale}%`
          : item.rotation < 270
            ? `0%`
            //aqui falta
            : `${100}%`} 
          ) 
          scale(${0.90 / scale}) 
          rotate(${-item?.rotation}deg) 
          !important;

          transform-origin:
          ${item.rotation > -1 && item.rotation < 285
          ? "top"
          //aqui falta
          : "top"
        } left;
          //aqui falta
          ${item?.rotation > 260 ? "bottom:0;" : "top:0;"}

          position: fixed !important;
          background-color: #e5e7eb;
          border: 1px solid #6b7280 !important;
          border-radius: 6px 6px 0 0;
          font-family: inherit;
          height: 40px;
          z-index: 1000;
          display: flex;
          align-items: center;
          padding: 0 8px;
          box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
        }
        .textTable-editor_${item._id} .ql-toolbar.ql-snow {
          ${editDefault?.clicked === item._id && !disableDrag && isClickEditor ? "visibility: visible" : "display: none"};
          border: 1px solid #e5e7eb !important;
          border-radius: 6px 6px 0 0;
        }
        .textTable-editor_${item._id} .ql-toolbar.ql-snow .ql-formats {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-right: 8px;
        }
        .textTable-editor_${item._id} .ql-toolbar button {
          width: 28px;
          height: 28px;
          padding: 4px;
          border: none;
          background: transparent;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .textTable-editor_${item._id} .ql-toolbar button:hover {
          background-color: #e5e7eb !important;
        }
        .textTable-editor_${item._id} .ql-toolbar button.ql-active {
          background-color: #ddd6fe !important;
          color: #6b21a8 !important;
        }
        .textTable-editor_${item._id} .ql-toolbar .ql-stroke {
          stroke: currentColor;
        }
        .textTable-editor_${item._id} .ql-toolbar .ql-fill {
          fill: currentColor;
        }
        .textTable-editor_${item._id} .ql-editor.ql-blank::before {
          color: ${isEditing ? "#c4c4cc" : "#1f2937"};
          font-style: normal;
          font-weight: 600;
          font-size: ${fontSize}px;
          left: 0;
          right: 0;
          text-align: center;
        }
      `}</style>
    </>
  );
};