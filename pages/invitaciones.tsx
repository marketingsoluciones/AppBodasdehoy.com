import { useEffect, useState, } from "react";
import { DiseñoIcon, EmailIcon, SmsIcon, WhatsappIcon, } from "../components/icons";
import BlockTitle from "../components/Utils/BlockTitle";
import useHover from "../hooks/useHover";
import ModuloSubida from "../components/Invitaciones/ModuloSubida";
import { motion } from "framer-motion";
import { AuthContextProvider, EventContextProvider } from "../context";
import { CounterInvitations } from "../components/Invitaciones/CounterInvitations";
import { DataTableGroupProvider } from "../context/DataTableGroupContext";
import VistaSinCookie from "./vista-sin-cookie";
import { useMounted } from "../hooks/useMounted"
import { OptionsMenu } from "../components/Invitaciones/OptionsMenu";
import { EnviadosComponent } from "../components/Invitaciones/EnviadosComponent";
import { DiseñoComponent } from "../components/Invitaciones/DiseñoComponent";
import { Test, TitleComponent } from "../components/Invitaciones/Test";
import { PlantillaTextos } from "../components/Invitaciones/PlantillaTextos";
import { GoChevronDown } from "react-icons/go";
import { useTranslation } from 'react-i18next';
import { Modal } from "../components/Utils/Modal";
import { EmailReactEditorComponent } from "../components/Invitaciones/EmailReactEditorComponent";
import { fetchApiEventos, queries } from "../utils/Fetching";
import { TemplateWathsappValues, WhatsappEditorComponent } from "../components/Invitaciones/WhatsappEditorComponent";
import { TemplateWathsappBusinessValues, WhatsappBusinessEditorComponent } from "../components/Invitaciones/WhatsappBusinessEditorComponent";
import { WhatsappBusinessPreview } from "../components/Invitaciones/WhatsappBusinessPreview";

export type optionArryOptions = {
  title: string;
  icon: any;
  state: boolean;
}

const Invitaciones = () => {
  const { t } = useTranslation();
  const { user, verificationDone, forCms } = AuthContextProvider()
  const { event } = EventContextProvider();
  const [hoverRef, isHovered] = useHover();
  const [dataInvitationSent, setDataInvitationSent] = useState([]);
  const [dataInvitationNotSent, setDataInvitationNotSent] = useState([]);
  const [optionSelect, setOptionSelect] = useState<TitleComponent>("email")
  const [stateConfi, setStateConfi] = useState(true)
  const [ShowEditorModal, setShowEditorModal] = useState(false)
  const [previewEmailReactEditor, setPreviewEmailReactEditor] = useState(false)
  const [previewEmailTemplate, setPreviewEmailTemplate] = useState<string>()
  const [previewWhatsappTemplate, setPreviewWhatsappTemplate] = useState<TemplateWathsappBusinessValues>()
  const [variablesTemplatesInvitaciones, setVariablesTemplatesInvitaciones] = useState<any[]>([])
  const variables = variablesTemplatesInvitaciones;
  const [variableMap, setVariableMap] = useState<any>({});
  useEffect(() => {
    const map = {};
    variables.forEach(v => {
      map[v.value] = { id: v.id, name: v.name, sample: v.sample };
    });
    setVariableMap(map);
  }, []);


  const arryOptions: optionArryOptions[] = [
    {
      title: "email",
      icon: <EmailIcon />,
      state: false
    },
    {
      title: "whatsapp",
      icon: <WhatsappIcon />,
      state: false
    },
    {
      title: "sms",
      icon: <SmsIcon />,
      state: false
    },
    {
      title: "diseño",
      icon: <DiseñoIcon />,
      state: false
    }
  ]

  useMounted()
  useEffect(() => {
    const reduce = event?.invitados_array?.reduce((acc: any, item: any) => {
      const asd = {
        _id: item._id,
        nombre: item.nombre,
        correo: item.correo,
        sexo: item.sexo,
        invitacion: item.invitacion,
        telefono: item.telefono,
        date: item.fecha_invitacion,
        father: item.father
      }
      item.invitacion ? acc.sent.push(asd) : acc.notSent.push(asd);
      return acc;
    }, { sent: [], notSent: [] })

    const InvitationSent = reduce?.sent?.filter((invitado: any) => !invitado?.father)
    const InvitationNotSent = reduce?.notSent?.filter((invitado: any) => !invitado?.father)

    reduce?.sent?.length != dataInvitationSent?.length && setDataInvitationSent(InvitationSent);
    reduce?.notSent.length != dataInvitationNotSent?.length && setDataInvitationNotSent(InvitationNotSent);
    fetchApiEventos({
      query: queries.getVariablesTemplatesInvitaciones,
      variables: {
        evento_id: event?._id
      },
    }).then((res: any) => {
      setVariablesTemplatesInvitaciones(res)
    })
    if (event?.templateEmailSelect && optionSelect === "email") {
      fetchApiEventos({
        query: queries.getVariableEmailTemplate,
        variables: {
          template_id: event?.templateEmailSelect,
          selectVariable: "preview"
        },
      }).then((res: any) => {
        setPreviewEmailTemplate(res?.preview)
      })
    }
    if (event?.templateWhatsappSelect && optionSelect === "whatsapp") {
      fetchApiEventos({
        query: queries.getWhatsappInvitationTemplates,
        variables: {
          evento_id: event?._id
        },
      }).then((res: any) => {
        const template = res.find((elem: any) => elem._id === event?.templateWhatsappSelect)
        setPreviewWhatsappTemplate(template?.data as TemplateWathsappBusinessValues)
      })
    }
  }, [optionSelect, event?.templateEmailSelect, event?.templateWhatsappSelect, event?.fecha_actualizacion, event?.updatedAt, event?.invitados_array]);

  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    if (!event) return <></>
    return (
      <DataTableGroupProvider>
        <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-full top-0 left-4" : "bg-base. w-full pb-6 pt-2 md:py-0"}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 gap-4 h-full pb-10"
          >
            {ShowEditorModal && <Modal classe={" w-[95%] md:w-[90%] h-[90%] "} >
              {optionSelect === "email"
                ? < EmailReactEditorComponent setShowEditorModal={setShowEditorModal} previewEmailReactEditor={previewEmailReactEditor} variablesTemplatesInvitaciones={variablesTemplatesInvitaciones} />
                : <WhatsappBusinessEditorComponent setShowEditorModal={setShowEditorModal} variablesTemplatesInvitaciones={variablesTemplatesInvitaciones} />
              }
            </Modal>}
            <BlockTitle title="Invitaciones" />
            <CounterInvitations />
            <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full pt-2 relative">
              <button className="text-primary flex items-center text-[20px] first-letter:capitalize ml-3" onClick={() => setStateConfi(!stateConfi)}>
                {t("invitationsettings")}
                <span> <GoChevronDown className={`h-6 w-6 text-azulCorporativo cursor-pointer transition-all ml-2 ${stateConfi && "rotate-180"}`} /></span>
              </button>
              <div className={`${stateConfi ? "" : "hidden"} md:h-96`}>
                <div className="w-full h-full flex flex-col md:flex-row mt-3 md:space-x-6 md:px-4">
                  <div className={`w-full h-96 md:w-auto flex justify-center`}>
                    <div ref={hoverRef} className={`relative w-60 h-80 ${optionSelect === "email" ? "bg-[#808080] rounded-lg border-[1px] border-gray-300" : "bg-white"}`}>
                      {["email"].includes(optionSelect)
                        ? previewEmailTemplate
                          ? <img
                            src={previewEmailTemplate}
                            alt="imgInvitacion"
                            className="w-full h-full object-contain rounded-lg"
                            style={{ maxWidth: "100%", maxHeight: "100%", display: "block" }} />
                          : <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                            <p className="text-gray-500 text-xs text-center">{`No hay template de ${optionSelect} seleccionado`}</p>
                          </div>
                        : optionSelect === "whatsapp"
                          ? <div className={`w-full h-full flex items-center justify-center translate-y-4 transition-all duration-300 ${!false ? "scale-[50%]" : "scale-[100%] absolute top-0 left-0 z-10"}`}>
                            <WhatsappBusinessPreview values={previewWhatsappTemplate} variableMap={variableMap} />
                          </div>
                          : <ModuloSubida event={event} use={"imgInvitacion"} />
                      }
                    </div>
                  </div>
                  <div className={`flex-1 h-[352px] flex flex-col shadow-md rounded-2xl overflow-hidden`}>
                    <OptionsMenu
                      arryOptions={arryOptions}
                      optionSelect={optionSelect}
                      setOptionSelect={setOptionSelect}
                    />
                    <div className="col-span-3 w-full md:h-[280px] md:h-full">
                      {optionSelect === "diseño" && <DiseñoComponent setEmailEditorModal={setShowEditorModal} EmailEditorModal={ShowEditorModal} />}
                      {["email", "whatsapp"].includes(optionSelect) && <Test TitleComponent={optionSelect} setEmailEditorModal={setShowEditorModal} setPreviewEmailReactEditor={setPreviewEmailReactEditor} optionSelect={optionSelect} />}
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${["email", "diseño"].includes(optionSelect) ? !stateConfi ? "" : "md:pt-3" : null} pt-3`}>
                <EnviadosComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} optionSelect={optionSelect} />
              </div>
            </div>
          </motion.div>
        </section>
      </DataTableGroupProvider>
    );
  }
};
export default Invitaciones;


