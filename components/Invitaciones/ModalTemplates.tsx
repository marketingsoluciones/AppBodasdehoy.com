import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { EventContextProvider } from "../../context/EventContext";
import { TemplateDesign, ModalInterface } from "../../utils/Interfaces";
import { IoTrashOutline } from "react-icons/io5";
import { SimpleDeleteConfirmation } from "../Utils/SimpleDeleteConfirmation";
import { HiOutlineMail } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";

interface props {
  use: "load" | "edit"
  action: (emailDesign: TemplateDesign) => void;
  optionSelect: string
}

export const ModalTemplates: FC<props> = ({ action, use, optionSelect }) => {
  const { event } = EventContextProvider();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<TemplateDesign[]>([]);
  const [myTemplates, setMyTemplates] = useState<TemplateDesign[]>([]);
  const [modal, setModal] = useState<ModalInterface>({ state: false });
  const [folders] = useState<string[]>(use === "edit" ? ["templates", "mytemplates"] : ["mytemplates"]);

  useEffect(() => {
    if (optionSelect === "email") {
      fetchApiEventos({
        query: queries.getPreviewsEmailTemplates,
        variables: {
          evento_id: event?._id
        },
      }).then((res) => {
        setMyTemplates(res as TemplateDesign[]);
      })
      fetchApiEventos({
        query: queries.getPreviewsEmailTemplates,
        variables: {},
      }).then((res) => {
        const templates = res as TemplateDesign[] ?? [];
        setTemplates(templates.map((elem) => {
          return {
            ...elem,
            isTemplate: true
          }
        }));
      })
    } else {
      // fetchApiEventos({
      //   query: queries.getPreviewsWhatsappTemplates,
      //   variables: {
      //     evento_id: event?._id
      //   },
      // }).then((res) => {
      //   setTemplates(res as TemplateDesign[] ?? []);
      // })
    }
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
          <div className='flex gap-2 items-center w-full h-10 px-2 py-1 border-b-[1px]'>
            {optionSelect === "email" ? <HiOutlineMail className="w-6 h-6 text-primary" /> : <FaWhatsapp className="w-6 h-6 text-emerald-500 " />}
            {t(elem)} {optionSelect === "email" ? t("email") : "Whatsapp"}
          </div>
          <div className={`bg-gray-100 w-full flex-1 flex flex-wrap overflow-y-scroll gap-x-3 gap-y-2 p-2 rounded-b-md ${use === "edit" ? "px-9" : "px-34"}`}>
            <div className="w-full h-full flex items-center justify-center absolute inset-0 opacity-15">
              {optionSelect === "email" ? <HiOutlineMail className="w-80 h-80 text-primary -rotate-12" /> : <FaWhatsapp className="w-80 h-80 text-emerald-500 -rotate-12  " />}
            </div>
            {(elem === "templates" ? templates : myTemplates).map((template, idx) => (
              <div key={idx} className={`${use === "edit" ? "w-20 h-[120px] pt-1 text-[10px]" : "w-40 h-[240px] space-y-2 pt-3 text-[11px]"} flex flex-col items-center rounded-md hover:bg-white transition-colors ease-in-out duration-200 cursor-pointer relative ${template._id === event?.templateEmailSelect && use === "load" ? "border-[1px] border-primary" : ""}`} onClick={() => action({ ...template } as TemplateDesign)}>
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