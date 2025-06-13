import { FC, RefObject, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { EmailDesign } from "../../utils/Interfaces";

interface props {
  action: (_id: string) => void;
}

export const ModalTemplates: FC<props> = ({ action }) => {
  const { event } = EventContextProvider();
  const { config } = AuthContextProvider()
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<EmailDesign[]>([]);
  const [myTemplates, setMyTemplates] = useState<EmailDesign[]>([]);

  useEffect(() => {
    fetchApiEventos({
      query: queries.getPreviewEmailTemplates,
      variables: {
        evento_id: event?._id
      },
    }).then((res) => {
      console.log(res);
      setMyTemplates(res as EmailDesign[]);
    })
    setTemplates([]);
  }, []);

  return (
    <div className='w-full h-full flex flex-col rounded-lg space-y-2'>
      {["templates", "mytemplates"].map((elem, idx) => (
        <div key={idx} className='w-full h-1/2 flex flex-col rounded-md border-[1px]'>
          <div className='w-full h-10 px-2 py-1 border-b-[1px]'>
            {t(elem)}
          </div>
          <div className='bg-gray-100 w-full flex-1 flex flex-wrap overflow-y-scroll gap-x-3 gap-y-2 p-2 px-9 rounded-b-md'>
            {(elem === "templates" ? templates : myTemplates).map((template, idx) => (
              <div key={idx} className='w-20 h-[120px] flex flex-col items-center pt-1 rounded-md hover:bg-white transition-colors ease-in-out duration-200 cursor-pointer' onClick={() => action(template._id)}>
                <div className='w-[75%] h-[75%]'>
                  <img src={template.preview} alt={template.name} className='w-full h-full object-cover' />
                </div>
                <span className="w-full text-center text-[10px] break-all line-clamp-2">
                  {template.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}