import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import 'react-quill/dist/quill.snow.css';

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
  ht: () => void;
}
export const DescriptionTask: FC<Props> = ({ canEdit, task, handleUpdate, ht }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);
  const [customDescription, setCustomDescription] = useState(task?.tips || '');

  useEffect(() => {
    setCustomDescription(task?.tips || '');
  }, [task])

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">
            {t('Descripción detallada')}
          </label>
          {canEdit &&
            <button id="edit-description"
              onClick={() => setEditing(true)}
              className="text-xs text-primary hover:text-primary/80"
            >
              {t('Editar')}
            </button>
          }
        </div>
        <div className="w-full relative">
          {editing
            && <div className="absolute z-10 w-full bg-white border border-green rounded-lg overflow-hidden">
              <div className="h-[300px] overflow-y-auto">
                <ReactQuill
                  value={customDescription}
                  onChange={setCustomDescription}
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                  placeholder={t('Escribe una descripción detallada...')}
                  className="bg-white border-none"
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
            </div>}
          <div className={`w-full h-[130px] overflow-y-auto border border-gray-200 rounded-lg p-4 ${canEdit ? 'cursor-pointer hover:border-gray-300' : 'cursor-default opacity-60'}`}
            onDoubleClick={() => {
              if (canEdit) {
                setCustomDescription(task.tips || '');
                setEditing(true);
              } else {
                ht();
              }
            }}
            title={canEdit ? "Haz clic para editar descripción" : "No tienes permisos para editar"}
          >
            {task.tips
              ? <div
                className="text-xs prose prose-xs max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-3 [&_p]:mb-4 [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:list-disc [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_li]:mb-2 [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:my-2 [&_pre]:whitespace-pre-wrap [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:italic [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 [&_.ql-align-center]:text-center [&_.ql-align-right]:text-right [&_.ql-align-justify]:text-justify [&_.ql-size-small]:text-xs [&_.ql-size-large]:text-lg [&_.ql-size-huge]:text-2xl [&_.ql-font-serif]:font-serif [&_.ql-font-monospace]:font-mono"
                dangerouslySetInnerHTML={{ __html: task.tips }}
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
      .ql-container {
        font-family: inherit;
        font-size: 0.875rem;
        line-height: 1.5rem;
        border: none !important;
      }
      .ql-container.ql-snow {
        border: none !important;
      }
      .ql-editor {
        min-height: 200px;
        padding: 1rem;
      }
      .ql-toolbar {
        background-color: #f9fafb;
        border: none !important;
        border-bottom: 1px solid #e5e7eb !important;
        font-family: inherit;
      }
      .ql-toolbar.ql-snow {
        border: none !important;
        border-bottom: 1px solid #e5e7eb !important;
      }
      .ql-toolbar button:hover {
        background-color: #e5e7eb !important;
      }
      .ql-toolbar button.ql-active {
        background-color: #ddd6fe !important;
        color: #6b21a8 !important;
      }
      .ql-editor.ql-blank::before {
        color: #9ca3af;
        font-style: normal;
      }
`}</style>
    </>
  )
}