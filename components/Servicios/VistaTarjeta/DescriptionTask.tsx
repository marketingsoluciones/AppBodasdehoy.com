import { Interweave } from "interweave";
import { HashtagMatcher, Link, UrlMatcher, UrlProps } from "interweave-autolink";
import dynamic from "next/dynamic";
import { ComponentType, FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import 'react-quill/dist/quill.snow.css';

const replacesLink: ComponentType<UrlProps> = (props) => {
  return (
    <Link href={props?.url}>
      <a className="text-xs break-all underline" target="_blank"  >{props?.children}</a>
    </Link>
  )
};

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-lg" />
});

// Configuración del editor Quill
const quillModules = {
  toolbar: [
    // [{ 'header': [1, 2, 3, false] }], 
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'align': [] }],
    // // ['link', 'image'], 
    ['clean']
  ],
};

const quillFormats = [
  //  'header', 
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'indent',
  'align',
  //  'link', 'image' 
];

interface Props {
  canEdit: boolean;
  task: any;
  handleUpdate: (field: string, value: any) => Promise<void>;
  owner: boolean;
  showAttachments?: boolean;
}
export const DescriptionTask: FC<Props> = ({ canEdit, task, handleUpdate, owner, showAttachments }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);
  const [customDescription, setCustomDescription] = useState(task?.tips || '');
  const ruta = window.location.pathname;


  useEffect(() => {
    setCustomDescription(task?.tips || '');
  }, [task])

  const isItinerarioRoute = ["/itinerario"].includes(ruta);
  const isOwner = Boolean(owner);
  const canUserEdit = Boolean(canEdit);
  const hasTaskStatus = Boolean(task.estatus);
  const canShowEditButton = isItinerarioRoute
    ? isOwner
      ? canUserEdit
      : (hasTaskStatus && canUserEdit)
    : canUserEdit;

  const shouldShowEditor = editing && canShowEditButton;

  return (
    <>
      <div className="flex flex-col flex-1 basis-0 min-h-0 max-h-full">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">
            {t('Descripción detallada')}
          </label>
          {canShowEditButton && (
            <button id="edit-description"
              onClick={() => setEditing(true)}
              className="text-xs text-primary hover:text-primary/80"
            >
              {t('Editar')}
            </button>
          )}
        </div>
        <div className="w-full relative flex flex-1 min-h-0">
          {shouldShowEditor && (
            <div className="absolute z-10 w-full bg-white border border-green rounded-lg overflow-hidden">
              <div className="h-[293px]">
                <ReactQuill
                  id="editor-description"
                  value={customDescription}
                  onChange={setCustomDescription}
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                  placeholder={t('Escribe una descripción detallada...')}
                  className="bg-white border-none description-editor"
                />
              </div>
              <div className="flex justify-end space-x-2 p-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => {
                    setCustomDescription(task.tips || '');
                    setEditing(false);
                  }}
                  className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t('Cancelar')}
                </button>
                <button
                  onClick={() => {
                    handleUpdate('tips', customDescription);
                    setEditing(false);
                  }}
                  className="px-4 py-2 text-xs bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  {t('Guardar')}
                </button>
              </div>
            </div>
          )}
          <div id="description-task" className={`w-full flex flex-1 basis-0 min-h-0 max-h-full overflow-y-auto break-words border border-gray-200 rounded-lg p-4 ${canEdit ? '*cursor-pointer hover:border-gray-300' : 'cursor-default opacity-60'} `}
            onDoubleClick={() => {
              if (canShowEditButton) {
                setCustomDescription(task.tips || '');
                setEditing(true);
              }
            }}
          >
            {task.tips
              ? <Interweave
                className="text-xs transition-all my-emoji"
                content={task.tips}
                matchers={[
                  new UrlMatcher('url', {}, replacesLink),
                  new HashtagMatcher('hashtag')
                ]}
              />
              : <p className="text-xs text-gray-400">
                {canEdit ? t('Haz doble clic para agregar una descripción...') : t('Sin descripción')}
              </p>
            }
          </div>
        </div>
      </div>
      <style jsx global>{`
      /* Estilos del editor Quill */
        /* Forzar layout flexible y altura completa del editor */
      .description-editor {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .description-editor .ql-container {
        flex: 1 1 auto;
        height: auto !important;
        overflow: hidden; /* el scroll ocurre en .ql-editor */
        font-family: inherit;
        font-size: 0.875rem;
        line-height: 1.5rem;
        border: none !important;
      }
      .description-editor .ql-container.ql-snow {
        border: none !important;
      }
      .description-editor .ql-editor {
        min-height: 200px;
        padding: 1rem;
        font-size: 12px;
        height: 100%;
        overflow-y: auto;
      }
      .description-editor .ql-toolbar {
        flex: 0 0 30px;
        background-color: #f9fafb;
        border: none !important;
        border-bottom: 1px solid #e5e7eb !important;
        font-family: inherit;
        height: 30px;
      }
      .description-editor .ql-toolbar.ql-snow {
        border: none !important;
        border-bottom: 1px solid #e5e7eb !important;
      }
      .description-editor .ql-toolbar.ql-snow .ql-formats {
       transform: translateY(-5px);
      }
      .description-editor .ql-toolbar button:hover {
        background-color: #e5e7eb !important;
      }
      .description-editor .ql-toolbar button.ql-active {
        background-color: #ddd6fe !important;
        color: #6b21a8 !important;
      }
      .description-editor .ql-editor.ql-blank::before {
        color: #9ca3af;
        font-style: normal;
        font-size: 12px;
      }
`}</style>
    </>
  )
}