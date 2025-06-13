import { FC, RefObject } from "react";
import { useTranslation } from "react-i18next";

interface props {
  htmlToImageRef: RefObject<HTMLIFrameElement>;
  html: string;
  action: () => void;
}

export const ModalHtmlPreview: FC<props> = ({ htmlToImageRef, html, action }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex justify-center items-end">
      <div className="bg-gray-200 w-[360px] h-[540px] border border-gray-200 rounded flex items-center justify-center overflow-hidden relative" >
        <iframe id='html-to-image-container' ref={htmlToImageRef} srcDoc={html} className='w-[1080px] h-[1620px] scale-[25%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden' />
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-green"
          onClick={action}
        >
          {t('save')}
        </button>
      </div>
    </div>
  )
}