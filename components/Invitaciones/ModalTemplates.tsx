import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { EventContextProvider } from "../../context";
import { EmailDesign, ModalInterface } from "../../utils/Interfaces";
import { IoTrashOutline } from "react-icons/io5";
import { SimpleDeleteConfirmation } from "../Utils/SimpleDeleteConfirmation";

interface props {
  action: (emailDesign: EmailDesign) => void;
}

export const ModalTemplates: FC<props> = ({ action }) => {
  const { event } = EventContextProvider();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<EmailDesign[]>([]);
  const [myTemplates, setMyTemplates] = useState<EmailDesign[]>([]);
  const [modal, setModal] = useState<ModalInterface>({ state: false });

  useEffect(() => {
    fetchApiEventos({
      query: queries.getPreviewEmailTemplates,
      variables: {
        evento_id: event?._id
      },
    }).then((res) => {
      setMyTemplates(res as EmailDesign[]);
    })
    setTemplates([]);
  }, []);

  const handleDelete = () => {
    fetchApiEventos({
      query: queries.deleteEmailTemplate,
      variables: {
        evento_id: event?._id,
        template_id: modal.values._id
      }
    }).then((res) => {
      setMyTemplates(myTemplates.filter(template => template._id !== modal.values._id))
      setModal({ state: false })
    })
  }

  return (
    <div className='w-full h-full flex flex-col rounded-lg space-y-2'>
      {modal.state && <SimpleDeleteConfirmation
        loading={false}
        setModal={setModal}
        handleDelete={handleDelete}
        message={<p className="text-azulCorporativo mx-8 text-center capitalize" > Estas seguro de borrar <span className='font-semibold'>{modal.title}</span></p>}
      />}
      {["templates", "mytemplates"].map((elem, idx) => (
        <div key={idx} className='w-full h-1/2 flex flex-col rounded-md border-[1px]'>
          <div className='w-full h-10 px-2 py-1 border-b-[1px]'>
            {t(elem)}
          </div>
          <div className='bg-gray-100 w-full flex-1 flex flex-wrap overflow-y-scroll gap-x-3 gap-y-2 p-2 px-9 rounded-b-md'>
            {(elem === "templates" ? templates : myTemplates).map((template, idx) => (
              <div key={idx} className='w-20 h-[120px] flex flex-col items-center pt-1 rounded-md hover:bg-white transition-colors ease-in-out duration-200 cursor-pointer relative' onClick={() => action({ ...template } as EmailDesign)}>
                {elem !== "templates" && <div onClick={e => {
                  e.stopPropagation();
                  setModal({ state: true, title: template.name, values: template })
                }} className="absolute top-1 right-1 p-1 bg-white rounded-full hover:scale-105 hover:bg-red-100 z-10" >
                  <IoTrashOutline className="w-4 h-4 text-red-500" />
                </div>}
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