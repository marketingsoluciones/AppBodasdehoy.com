import { FC, RefObject } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "./ButtonPrimary";

interface props {
  htmlToImageRef: RefObject<HTMLIFrameElement>;
  html: string;
  action: () => void;
}

export const ModalHtmlPreview: FC<props> = ({ htmlToImageRef, html, action }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex justify-center items-end">
      <div ref={htmlToImageRef} className="bg-gray-200 w-[360px] h-[540px] border border-gray-200 rounded flex items-center justify-center overflow-hidden relative" >
        <div>
          <iframe id='html-to-image-container' srcDoc={html} className='w-[1080px] h-[1620px] scale-[25%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden' />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <ButtonPrimary onClick={action}>
          {t('save')}
        </ButtonPrimary>
      </div>
    </div>
  )
}