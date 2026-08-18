import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { ComponentType, FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import 'react-quill/dist/quill.snow.css';

const replacesLink: ComponentType<UrlProps> = (props) => {
  return (
    <a href={props?.url} className="text-xs break-all underline" target="_blank" rel="noopener noreferrer">{props?.children}</a>
  )
};

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-lg" />
});

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['clean'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
  ],
};

const quillFormats = [
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'indent',
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
  const ruta = usePathname();
  // Rediseño studio (gate ?studio, default ON): solo /itinerario. Fiel a
  // tarjetatareaitinerario.html (.desc-head / .desc-area).
  const isStudio = typeof window !== "undefined"
    && window.location.pathname === "/itinerario"
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  useEffect(() => {
    setCustomDescription(task?.tips || '');
  }, [task])

  const canShowEditButton = canEdit
  const shouldShowEditor = editing && canShowEditButton;

  return (
    <>
      <div className={isStudio ? "flex flex-col w-full" : "flex flex-col flex-1 basis-0 min-h-0 max-h-full"}>
        <div className="flex items-center justify-between mb-2">
          <label className={isStudio ? "flex items-center gap-[7px] font-semibold text-[12.5px] text-[#a0a0a8]" : "text-xs font-medium text-gray-700"}>
            {t('Descripción detallada')}
          </label>
          {canShowEditButton && !isStudio && (
            <button id="edit-description"
              onClick={() => setEditing(true)}
              className="text-xs text-primary hover:text-primary/80"
            >
              {t('Editar')}
            </button>
          )}
        </div>
        <div className={isStudio ? "w-full relative" : "w-full relative flex flex-1 min-h-0"}>
          {shouldShowEditor && (
            <div className={`${isStudio ? 'relative w-full border-[1.5px] border-[#E7E7EA]' : 'absolute z-10 w-full border border-green'} bg-white rounded-lg overflow-hidden`}>
              <div className={isStudio ? '' : 'h-[293px]'}>
                <ReactQuill
                  id="editor-description"
                  value={customDescription}
                  onChange={setCustomDescription}
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                  placeholder={t('Escribe una descripción detallada...')}
                  className={`bg-white border-none description-editor ${isStudio ? 'description-editor-studio' : ''}`}
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
          <div id="description-task" className={`w-full break-words ${isStudio && shouldShowEditor ? 'hidden' : ''} ${isStudio ? "min-h-[60px] border-[1.5px] border-[#E7E7EA] rounded-xl px-4 py-[13px] text-[12.5px] hover:border-[#EF5B94]" : "flex flex-1 basis-0 min-h-0 max-h-full overflow-y-auto border border-gray-200 rounded-lg p-4"} ${canEdit ? 'cursor-pointer hover:border-gray-300' : 'cursor-default opacity-60'} `}
            onClick={() => {
              if (isStudio && canShowEditButton) {
                setCustomDescription(task.tips || '');
                setEditing(true);
              }
            }}
            onDoubleClick={() => {
              if (!isStudio && canShowEditButton) {
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
                {canEdit ? (isStudio ? t('Haz clic para agregar una descripción…') : t('Haz doble clic para agregar una descripción...')) : t('Sin descripción')}
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
        z-index: 1000;
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
        background-color: rgba(0, 0, 0, 0.06) !important;
        color: var(--color-secondary, #f472b6) !important;
      }
      .description-editor .ql-editor.ql-blank::before {
        color: #9ca3af;
        font-style: normal;
        font-size: 12px;
      }
      /* Studio: editor inline compacto, del tamaño de la caja de descripción */
      .description-editor-studio .ql-editor { min-height: 60px !important; max-height: 220px; height: auto !important; padding: 12px 16px; }
      .description-editor-studio .ql-toolbar { flex: 0 0 auto; }
      .description-editor-studio .ql-container { flex: 0 1 auto; }
`}</style>
    </>
  )
}
