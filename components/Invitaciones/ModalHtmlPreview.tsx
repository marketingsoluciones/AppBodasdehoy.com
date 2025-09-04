import { FC, RefObject, useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "./ButtonPrimary";


interface props {
  htmlToImageRef: RefObject<HTMLIFrameElement>;
  html: string;
  action: () => void;
  onTitleChange?: (title: string) => void;
}

export const ModalHtmlPreview: FC<props> = ({ htmlToImageRef, html, action, onTitleChange }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState<string>("");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange?.(newTitle);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center space-y-4">

      <div ref={htmlToImageRef} className="bg-gray-200 w-[360px] h-[540px] border border-gray-200 rounded flex items-center justify-center overflow-hidden relative" >
          <iframe id='html-to-image-container' srcDoc={html} className='w-[1080px] h-[1620px] scale-[25%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden' />
      </div>
   
      <div className="w-full max-w-md">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder={t('enterTitle') || 'Ingresa un título para la plantilla'}
          className="w-full px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-0 "
        />
      </div>
      <div className="flex justify-end gap-2">
        <ButtonPrimary onClick={action}>
          {t('save')}
        </ButtonPrimary>
      </div>
    </div>
  )
}