import { FC, cloneElement, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { ListElements } from "../../pages/mesas";
import { element } from "../../utils/Interfaces";
import { RxQuestionMark } from "react-icons/rx";
import 'react-quill/dist/quill.snow.css';
import dynamic from "next/dynamic";

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
  const { event } = EventContextProvider()
  const [fontSize, setFontSize] = useState<number>(20)
  const [customEditor, setCustomEditor] = useState<string>(item?.title || "texto")
  const [editDefaultOld, setEditDefaultOld] = useState<any>()

  // Configuración del editor Quill
  const quillModules = {
    toolbar: [
      [{ 'size': ['small', false, 'large', 'huge'] }], // Selector de tamaño de fuente
      ['bold', 'italic', 'underline', 'strike'],
      ['clean'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],

    ],
  };

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
      const reactElement = item?.title
        ? <div className="text-sm">{item?.title}</div>
        : <div
          className="flex items-center justify-center"
          style={{
            /*...item?.size,*/
            fontSize: 'clamp(1rem, 1vw, 30rem)',//`${fontSize}px`,
            rotate: `${item?.rotation}deg`
          }}
          /*data-width={item?.size?.width} data-height={item?.size?.height}*/
          data-fontSize={fontSize}
          data-type={item.tipo}
          data-rotation={item?.rotation}
        >
          <ReactQuill
            id={`editor-textTable_${item._id}`}
            value={customEditor}
            onChange={setCustomEditor}
            modules={quillModules}
            formats={quillFormats}
            theme="snow"
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
        setReactElement(cloneElement(element?.icon, { style: { ...size, rotate: `${item?.rotation}deg` }, "data-width": size?.width, "data-height": size?.height, "data-rotation": item?.rotation }))
      }
    }
  }, [item, event?.galerySvgs]);

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
          font-size: 0.875rem;
          line-height: 1.5rem;
          border: none !important;
          position: static !important;
        }
        .textTable-editor_${item._id} .ql-container.ql-snow {
          border: none !important;
          position: static !important;
        }
        .textTable-editor_${item._id} .ql-editor {
          background-color: white;
          min-width: 50px;
          //min-height: 200px;
          padding: 0;
          font-size: 12px;
          height: 100%;
          overflow-y: auto;
          position: static !important;
        }
        .textTable-editor_${item._id} .ql-toolbar {
          ${editDefault?.clicked === item._id && !disableDrag ? "visibility: visible" : "display: none"};
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
          ${editDefault?.clicked === item._id && !disableDrag ? "visibility: visible" : "display: none"};
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
          color: #9ca3af;
          font-style: normal;
          font-size: 12px;
        }
      `}</style>
    </>
  );
};