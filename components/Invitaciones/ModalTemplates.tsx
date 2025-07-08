import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { EventContextProvider } from "../../context/EventContext";
import { EmailDesign, ModalInterface } from "../../utils/Interfaces";
import { IoTrashOutline } from "react-icons/io5";
import { SimpleDeleteConfirmation } from "../Utils/SimpleDeleteConfirmation";

interface props {
  use: "load" | "edit"
  action: (emailDesign: EmailDesign) => void;
}

export const ModalTemplates: FC<props> = ({ action, use }) => {
  const { event } = EventContextProvider();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<EmailDesign[]>([]);
  const [myTemplates, setMyTemplates] = useState<EmailDesign[]>([]);
  const [modal, setModal] = useState<ModalInterface>({ state: false });
  const [folders] = useState<string[]>(use === "edit" ? ["templates", "mytemplates"] : ["mytemplates"]);

  useEffect(() => {
    fetchApiEventos({
      query: queries.getPreviewsEmailTemplates,
      variables: {
        evento_id: event?._id
      },
    }).then((res) => {
      setMyTemplates(res as EmailDesign[]);
    })
    fetchApiEventos({
      query: queries.getPreviewsEmailTemplates,
      variables: {},
    }).then((res) => {
      const templates = res as EmailDesign[] ?? [];
      setTemplates(templates.map((elem) => {
        return {
          ...elem,
          isTemplate: true
        }
      }));
    })
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
      {folders.map((elem, idx) => (
        <div key={idx} className={`w-full ${use === "edit" ? "h-1/2" : "h-full"} flex flex-col rounded-md border-[1px]`}>
          <div className='w-full h-10 px-2 py-1 border-b-[1px]'>
            {t(elem)}
          </div>
          <div className={`bg-gray-100 w-full flex-1 flex flex-wrap overflow-y-scroll gap-x-3 gap-y-2 p-2 rounded-b-md ${use === "edit" ? "px-9" : "px-34"}`}>
            {(elem === "templates" ? templates : myTemplates).map((template, idx) => (
              <div key={idx} className={`${use === "edit" ? "w-20 h-[120px] pt-1 text-[10px]" : "w-40 h-[240px] space-y-2 pt-3 text-[11px]"} flex flex-col items-center rounded-md hover:bg-white transition-colors ease-in-out duration-200 cursor-pointer relative ${template._id === event?.templateInvitacionSelect && use === "load" ? "border-[1px] border-primary" : ""}`} onClick={() => action({ ...template } as EmailDesign)}>
                {(elem !== "templates" && use === "edit") && <div onClick={e => {
                  e.stopPropagation();
                  setModal({ state: true, title: template.configTemplate.name, values: template })
                }} className="absolute top-1 right-1 p-1 bg-white rounded-full hover:scale-105 hover:bg-red-100 z-10" >
                  <IoTrashOutline className="w-4 h-4 text-red-500" />
                </div>}
                <div className='w-[75%] h-[75%]'>
                  <img src={template.preview} alt={template.configTemplate.name} className='w-full h-full object-cover' />
                </div>
                <span className="w-full text-center break-all line-clamp-2">
                  {template.configTemplate.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}