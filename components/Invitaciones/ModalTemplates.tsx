import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { EventContextProvider } from "../../context/EventContext";
import { TemplateDesign, ModalInterface } from "../../utils/Interfaces";
import { IoTrashOutline } from "react-icons/io5";
import { SimpleDeleteConfirmation } from "../Utils/SimpleDeleteConfirmation";
import { HiOutlineMail } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { TemplateWathsappValues } from "./WhatsappEditorComponent";
import { Interweave } from "interweave";

interface props {
  use: "load" | "edit"
  action: (template: TemplateDesign | TemplateWathsappValues) => void;
  optionSelect: string
}

export const ModalTemplates: FC<props> = ({ action, use, optionSelect }) => {
  const { event } = EventContextProvider();
  const { t } = useTranslation();
  const [templatesEmail, setTemplatesEmail] = useState<TemplateDesign[]>([]);
  const [myTemplatesEmail, setMyTemplatesEmail] = useState<TemplateDesign[]>([]);
  const [templatesWhatsapp, setTemplatesWhatsapp] = useState<TemplateWathsappValues[]>([]);
  const [myTemplatesWhatsapp, setMyTemplatesWhatsapp] = useState<TemplateWathsappValues[]>([]);
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
        setMyTemplatesEmail(res as TemplateDesign[]);
      })
      fetchApiEventos({
        query: queries.getPreviewsEmailTemplates,
        variables: {},
      }).then((res) => {
        const templates = res as TemplateDesign[] ?? [];
        setTemplatesEmail(templates.map((elem) => {
          return {
            ...elem,
            isTemplate: true
          }
        }));
      })
    } else if (optionSelect === "whatsapp") {
      fetchApiEventos({
        query: queries.getWhatsappInvitationTemplates,
        variables: {
          evento_id: event?._id
        },
      }).then((res: any) => {
        const asd = res.map((elem: any) => {
          return { ...elem, ...elem.data, data: undefined }
        })
        setMyTemplatesWhatsapp(asd as TemplateWathsappValues[]);
        setTemplatesWhatsapp([]);
      })
    }
  }, []);

  const handleDelete = () => {
    if (optionSelect === "email") {
      fetchApiEventos({
        query: queries.deleteEmailTemplate,
        variables: {
          evento_id: event?._id,
          template_id: modal.values._id
        }
      }).then((res) => {
        setMyTemplatesEmail(myTemplatesEmail.filter(template => template._id !== modal.values._id) as TemplateDesign[])
        setModal({ state: false })
      })
    }
    if (optionSelect === "whatsapp") {
      fetchApiEventos({
        query: queries.deleteWhatsappInvitationTemplate,
        variables: {
          evento_id: event?._id,
          template_id: modal.values._id
        }
      }).then((res) => {
        setMyTemplatesWhatsapp(myTemplatesWhatsapp.filter(template => template._id !== modal.values._id) as TemplateWathsappValues[])
        setModal({ state: false })
      })
    }
  }

  return (
    <div className='w-full h-full flex flex-col rounded-lg space-y-2'>
      <div className="w-full h-full flex items-center justify-center absolute inset-0 opacity-15">
        {optionSelect === "email" ? <HiOutlineMail className="w-80 h-80 text-primary -rotate-12" /> : <FaWhatsapp className="w-80 h-80 text-emerald-500 -rotate-12  " />}
      </div>
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
          {optionSelect === "email"
            ? <div className={`bg-gray-100 w-full flex-1 flex md:flex-wrap flex-col items-center overflow-y-scroll gap-x-3 gap-y-2 p-2 rounded-b-md ${use === "edit" ? "px-9" : "px-34"}`}>
              {(elem === "templates" ? templatesEmail : myTemplatesEmail)?.map((template, idx) => (
                <div key={idx} className={`${use === "edit" ? "w-20 h-[120px] pt-1 text-[10px]" : "w-40 h-[240px] space-y-2 pt-3 text-[11px]"} flex flex-col items-center rounded-md hover:bg-white transition-colors ease-in-out duration-200 cursor-pointer relative ${template._id === event?.templateEmailSelect && use === "load" ? "border-[1px] border-primary" : ""}`} onClick={() => action({ ...template } as TemplateDesign)}>
                  {(elem !== "templates" && use === "edit") && <div onClick={e => {
                    e.stopPropagation();
                    setModal({ state: true, title: template.configTemplate.name, values: template })
                  }} className="absolute top-1 right-1 p-1 bg-white rounded-full hover:scale-105 z-10" >
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
            : <div className="w-full h-full flex flex-col z-10 text-sm border-gray-200 text-gray-800">
              <div className="w-full min-h py-2 flex border-b-[1px] font-semibold">
                <span className="w-1/3  text-center">{t("name")}</span>
                <span className="flex-1 border-l-[1px] text-center">{t("content")}</span>
                <span className="w-12 border-l-[1px] text-center" />
              </div>
              {(elem === "templates" ? templatesWhatsapp : myTemplatesWhatsapp)?.map((template, idx) => (
                <div onClick={() => {
                  action({ ...template })
                }} key={idx} className="w-full min-h py-1 flex hover:bg-gray-200 transition-colors ease-in-out duration-200 border-b-[1px]">
                  <span className="w-1/3 px-2 py-1">{template.templateName}</span>
                  <span className="flex-1 border-l-[1px] px-2 py-1"><Interweave content={template.bodyContent} /></span>
                  <span className="w-12 border-l-[1px] text-center flex justify-center items-center" >
                    <div onClick={() => {
                      setModal({ state: true, title: template.templateName, values: template })
                    }} className="bg-white rounded-full hover:scale-105 hover:bg-gray-100 cursor-pointer p-1">
                      <IoTrashOutline className="w-4 h-4" />
                    </div>
                  </span>
                </div>
              ))}
            </div>

          }
        </div>
      ))}
    </div>
  )
}