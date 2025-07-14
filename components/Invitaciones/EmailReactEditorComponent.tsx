import React, { FC, useEffect, useRef, useState } from 'react';
import { IoFolderOpenOutline, IoSaveOutline } from "react-icons/io5";
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { GoArrowLeft } from "react-icons/go";
import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import { translations } from '../../locales/react-email-editor-es';
import i18next from "i18next";
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';
import ModalDefault from './ModalDefault';
import { ModalHtmlPreview } from './ModalHtmlPreview';
import { ModalTemplates } from './ModalTemplates';
import { EmailDesign } from '../../utils/Interfaces';
import { EditableLabelWithInput } from '../Forms/EditableLabelWithInput';
import ButtonPrimary from './ButtonPrimary';
import { IoIosClose } from 'react-icons/io';
import { MdOutlineShortText } from 'react-icons/md';
import { Textarea } from '../Servicios/Utils/Textarea';

interface props {
    setShowEditorModal: (value: boolean) => void
    previewEmailReactEditor?: boolean
}

type showUnsavedModalType = {
    state: boolean,
    label: string,
    actionUnsave: () => void,
    actionSave: () => void
}

type postActionType = {
    state: boolean,
    action: () => void
}

type showSubjectModalType = {
    state: boolean,
    value: string
}

export const EmailReactEditorComponent: FC<props> = ({ setShowEditorModal, previewEmailReactEditor, ...props }) => {
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const emailEditorRef = useRef<EditorRef>(null);
    const unlayer = emailEditorRef.current?.editor;
    const [editorReady, setEditorReady] = useState<boolean>(false);
    const [isLoad, setIsLoad] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [html, setHtml] = useState<string>('');
    const [designASD, setDesignASD] = useState<EmailDesign>();
    const [template, setTemplate] = useState<EmailDesign>();
    const htmlToImageRef = useRef(null);
    const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);
    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState<showUnsavedModalType>();
    const [showLoadDraftModal, setShowLoadDraftModal] = useState<boolean>(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [postAction, setPostAction] = useState<postActionType>();
    const [showSubjectModal, setShowSubjectModal] = useState<showSubjectModalType>({ state: false, value: '' });
    const [dispatchStorage, setDispatchStorage] = useState({ updatedAt: new Date, design: undefined });
    const nameNewtemplate = "new template";

    useEffect(() => {
        if (!previewEmailReactEditor) {
            const draft = localStorage.getItem('emailEditorDesign');
            if (draft) {
                setShowLoadDraftModal(true);
            }
        }
    }, []);

    useEffect(() => {
        if (template) {
            localStorage.setItem('emailEditorDesign', JSON.stringify({
                ...template,
                design: dispatchStorage.design,
                updatedAt: dispatchStorage.updatedAt
            }));
        }
    }, [dispatchStorage])

    useEffect(() => {
        if (unlayer) {
            if (!previewEmailReactEditor) {
                unlayer.addEventListener('design:updated', function (updates) {
                    unlayer.exportHtml(function (data) {

                        setDispatchStorage({
                            updatedAt: new Date(),
                            design: data.design
                        })
                        setHasUnsavedChanges(true);
                    });
                });
            } else {
                loadDesign({ _id: event?.templateEmailSelect } as EmailDesign)
            }
        }
    }, [unlayer]);

    const handleCloseEditor = () => {
        if (hasUnsavedChanges && !previewEmailReactEditor) {
            setShowUnsavedModal({
                state: true,
                label: '¿Seguro que quieres salir?',
                actionUnsave: () => {
                    localStorage.removeItem('emailEditorDesign');
                    setHasUnsavedChanges(false);
                    setShowEditorModal(false);
                    setShowUnsavedModal(undefined);
                },
                actionSave: () => {
                    handleSaveDesign()
                    setShowUnsavedModal(undefined);
                    setPostAction({
                        state: true,
                        action: () => {
                            setShowEditorModal(false);
                        }
                    });
                }
            });
        } else {
            setShowEditorModal(false);
        }
    };

    const handleOpenFolderTemplates = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedModal({
                state: true,
                label: '¿Seguro que quieres continuar?',
                actionUnsave: () => {
                    setShowTemplatesModal(true);
                    setShowUnsavedModal(undefined);
                    setPostAction({
                        state: true,
                        action: () => {
                            localStorage.removeItem('emailEditorDesign');
                            setHasUnsavedChanges(false);
                        }
                    });
                },
                actionSave: () => {
                    handleSaveDesign()
                    setShowUnsavedModal(undefined);
                    setPostAction({
                        state: true,
                        action: () => {
                            setShowTemplatesModal(true);
                        }
                    });
                }
            });
        } else {
            setShowTemplatesModal(true);
        }
    };

    const handleSaveDesign = () => {
        try {
            unlayer?.saveDesign((design) => {
                setDesignASD(design)
            });
            unlayer.exportHtml(function (data) {
                setHtml(data.html.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' '));
                setShowSaveModal(true);
            });
        } catch (error) {
            console.log('error', error)
        }
    };

    const handleLoadDraft = () => {
        const draft = localStorage.getItem('emailEditorDesign');
        setLoading(true)
        setHasUnsavedChanges(true)
        if (draft && unlayer) {
            const template = JSON.parse(draft);
            unlayer.loadDesign(template.design);
            setTemplate(template);
        }
        setShowLoadDraftModal(false);
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem('emailEditorDesign');
        setShowLoadDraftModal(false);
    };

    const onLoad: EmailEditorProps['onReady'] = (unlayer) => {
        if (previewEmailReactEditor) {
            unlayer.showPreview({
                device: "desktop",
                resolution: 1024
            })
        }
    };

    const onReady: EmailEditorProps['onReady'] = (unlayer) => {
        setEditorReady(true);//ver que hace
        setTimeout(() => {
            setIsLoad(true)
        }, previewEmailReactEditor ? 800 : 0);
    };

    const handleNextSaveDesign = async () => {
        try {
            setLoading(true)
            if (!template?._id) {
                fetchApiEventos({
                    query: queries.createEmailTemplate,
                    variables: {
                        evento_id: event?._id,
                        design: designASD,
                        html,
                        configTemplate: {
                            name: template?.configTemplate.name || nameNewtemplate,
                            subject: template?.configTemplate.subject || ""
                        }
                    },
                    domain: config?.domain
                }).then((res: EmailDesign) => {
                    setTemplate({ ...template, _id: res._id, updatedAt: new Date() })
                    localStorage.removeItem('emailEditorDesign');
                    setHasUnsavedChanges(false);
                    postAction?.state && postAction.action();
                    setShowSaveModal(false);
                    setHtml('');
                    setLoading(false)
                })
            } else {
                fetchApiEventos({
                    query: queries.updateEmailTemplate,
                    variables: {
                        evento_id: event?._id,
                        template_id: template?._id,
                        design: designASD,
                        html,
                    },
                }).then((res) => {
                    setTemplate({ ...template, _id: res[0]._id, updatedAt: new Date() })
                    localStorage.removeItem('emailEditorDesign');
                    setHasUnsavedChanges(false);
                    postAction?.state && postAction.action();
                    if (template._id === event?.templateEmailSelect) {
                        const newEvent = { ...event, fecha_actualizacion: new Date().toLocaleString() }
                        setEvent({ ...newEvent })
                    }
                    setShowSaveModal(false);
                    setHtml('');
                    setLoading(false)
                })
            }

        } catch (error) {
            console.log('error', error)
        }
    };

    const loadDesign = (emailDesign: EmailDesign) => {
        try {
            fetchApiEventos({
                query: queries.getEmailTemplate,
                variables: {
                    template_id: emailDesign._id
                }
            }).then((res) => {
                unlayer.loadDesign(res[0].design as any)
                !previewEmailReactEditor && setTemplate({
                    ...emailDesign,
                    design: res[0].design,
                    ...(emailDesign.isTemplate ? { _id: undefined } : {})
                })
            })
        } catch (error) {
            console.log('error', error)
        }
    }

    useEffect(() => {
        if (template?._id) {
            fetchApiEventos({
                query: queries.updateEmailTemplate,
                variables: {
                    evento_id: event?._id,
                    template_id: template?._id,
                    configTemplate: template?.configTemplate,
                }
            })
            if (template._id === event?.templateEmailSelect) {
                const newEvent = { ...event, fecha_actualizacion: new Date().toLocaleString() }
                setEvent({ ...newEvent })
            }
        }
    }, [template?.configTemplate?.name, template?.configTemplate?.subject])

    const asd = "{{var}}"

    return (
        <div className='relative w-full h-full'>
            {showSaveModal && (
                <ModalDefault onClose={() => { setShowSaveModal(false); setHtml(''); }} >
                    <ModalHtmlPreview htmlToImageRef={htmlToImageRef} html={html} action={handleNextSaveDesign} />
                </ModalDefault>
            )}
            {showTemplatesModal && (
                <ModalDefault onClose={() => { setShowTemplatesModal(false) }} >
                    <ModalTemplates action={(emailDesign: EmailDesign) => {
                        loadDesign(emailDesign)
                        postAction?.state && postAction.action();
                    }} use={"edit"} />
                </ModalDefault>
            )}
            {showLoadDraftModal && (
                <ModalDefault onClose={handleDiscardDraft}>
                    <div className="p-4">
                        <p className="mb-4">Tienes un diseño guardado sin terminar. ¿Quieres cargarlo?</p>
                        <div className="flex gap-2">
                            <ButtonPrimary onClick={handleLoadDraft}>Cargar</ButtonPrimary>
                            <ButtonPrimary onClick={handleDiscardDraft}>Descartar</ButtonPrimary>
                        </div>
                    </div>
                </ModalDefault>
            )}
            {showUnsavedModal?.state && (
                <ModalDefault onClose={() => setShowUnsavedModal({ state: false, label: '', actionUnsave: () => { }, actionSave: () => { } })}>
                    <div className="p-4">
                        <p className="mb-4">{`Tienes cambios sin guardar. ${showUnsavedModal.label}`}</p>
                        <div className="flex gap-2 flex-wrap">
                            <ButtonPrimary onClick={showUnsavedModal.actionUnsave} >
                                Descartar los cambios
                            </ButtonPrimary>
                            <ButtonPrimary onClick={showUnsavedModal.actionSave} >
                                Guardar los cambios
                            </ButtonPrimary>
                            <ButtonPrimary
                                onClick={() => setShowUnsavedModal({ state: false, label: '', actionUnsave: () => { }, actionSave: () => { } })}
                            >
                                Cancelar
                            </ButtonPrimary>
                        </div>
                    </div>
                </ModalDefault>
            )}
            {showSubjectModal.state && (
                <div className='bg-blue-300 flex items-start space-x-3 w-[500px] p-2 absolute top-10 left-40 border-2 border-gray-300 rounded-lg'>
                    <Textarea value={showSubjectModal.value} setValue={(value) => setShowSubjectModal({ state: true, value: value })} allowEnter={false} />
                    <ButtonPrimary onClick={() => {
                        setTemplate({ ...template, configTemplate: { ...template?.configTemplate, subject: showSubjectModal.value } })
                        setShowSubjectModal({ state: false, value: '' })
                    }}>Guardar</ButtonPrimary>
                </div>
            )}
            {(!isLoad || loading) && <div className="absolute z-50 w-full h-full bg-white opacity-30" />}
            {(!isLoad || loading) && <div className="absolute z-50  top-[calc(50%-20px)] left-[calc(50%-20px)] loader ease-linear rounded-full border-[7px] border-black border-opacity-35 w-10 h-10" />}
            <div className={`h-full ${isLoad ? "opacity-100" : "opacity-0"} transition-all duration-300`} >
                {editorReady && <div className='absolute flex w-[604px]'>
                    <div onClick={handleCloseEditor} className={"flex w-16 h-[38px] flex-col items-center justify-center cursor-pointer border-l hover:bg-[#F4F4F4]"} >
                        <div className='pt-[2px]'>
                            <GoArrowLeft className='h-5 w-5' />
                        </div>
                    </div>
                    {!previewEmailReactEditor && <>
                        <div onClick={handleOpenFolderTemplates} className={"flex w-[50px] h-[38px] flex-col items-center justify-center cursor-pointer border-l hover:bg-[#F4F4F4]"} >
                            <div className='pt-[2px]'>
                                <IoFolderOpenOutline className='h-5 w-5' />
                            </div>
                        </div>
                        <div onClick={handleSaveDesign} className={"flex w-[50px] h-[38px] flex-col items-center justify-center cursor-pointer border-l hover:bg-[#F4F4F4]"} >
                            <div className='pt-[2px]'>
                                <IoSaveOutline className='h-5 w-5' />
                            </div>
                        </div>
                        <div className={"flex flex-col w-[250px] h-[38px] items-start justify-end cursor-pointer border-l"} >
                            <label className='text-[10px] font-semibold text-gray-600 translate-y-0.5 px-1'>{t('nameTemplate')}</label>
                            <div className='pb-0.5 w-full flex justify-start text-sm relative px-2'>
                                <EditableLabelWithInput
                                    value={template?.configTemplate?.name ? template.configTemplate.name : nameNewtemplate}
                                    type={null}
                                    handleChange={(values) => {
                                        setTemplate({ ...template, configTemplate: { ...template?.configTemplate, name: values.value } })
                                    }}
                                    accessor={null}
                                    textAlign="left" />
                            </div>
                        </div>
                        {/* <div className={"bg-blue-500* flex flex-col flex-1 h-[38px] items-start justify-end cursor-pointer border-l"} >
                            <label className='text-[10px] font-semibold text-gray-600 translate-y-0.5 px-1'>{t('subject')}</label>
                            <div className='pb-0.5 w-full flex justify-start text-sm relative px-2'>
                                <EditableLabelWithInput
                                    value={template?.configTemplate?.subject ? template.configTemplate.subject : ""}
                                    type={null}
                                    handleChange={(values) => {
                                        setTemplate({ ...template, configTemplate: { ...template?.configTemplate, subject: values.value } })
                                    }}
                                    accessor={null}
                                    textAlign="left" />
                            </div>
                        </div> */}
                        <div onClick={() => setShowSubjectModal({ state: !showSubjectModal.state, value: template?.configTemplate?.subject })} className={"flex w-[50px] h-[38px] flex-col items-center justify-center cursor-pointer border-x hover:bg-[#F4F4F4]"} >
                            <div className='pt-[2px] flex flex-col items-center justify-center'>
                                <span className='text-[10px] font-semibold text-gray-600 translate-y-0.5 px-1'>{t('subject')}</span>
                                <MdOutlineShortText className='h-5 w-5' />
                            </div>
                        </div>
                    </>}
                </div>}
                {previewEmailReactEditor && <div className='absolute flex right-0 bg-white'>
                    <div onClick={handleCloseEditor} className={"flex w-[50px] h-[38px] flex-col items-center justify-center cursor-pointer border-l hover:bg-[#F4F4F4]"} >
                        <div className='pt-[2px]'>
                            <IoIosClose className='h-6 w-6 text-gray-800' />
                        </div>
                    </div>
                </div>}
                <EmailEditor ref={emailEditorRef} onLoad={onLoad} onReady={onReady} minHeight={'100%'} options={{
                    id: 'editor',
                    displayMode: "email",
                    devices: [],
                    locale: 'en-US',
                    translations: {
                        'en-US': i18next.language === 'es' ? translations : {}
                    },
                    mergeTags: {
                        tag1: {
                            name: "tipo de evento",
                            value: "{{params.typeEvent}}",
                            sample: event?.tipo?.toUpperCase()
                        },
                        tag2: {
                            name: "nombre del evento",
                            value: "{{params.nameEvent}}",
                            sample: event?.nombre?.toUpperCase()
                        },
                        tag3: {
                            name: "invitado",
                            value: "{{params.nameGuest}}",
                            sample: event?.invitados_array[0]?.nombre || "sin invitados cargados"
                        },
                        tag4: {
                            name: "fecha",
                            value: "{{params.dateEvent}}",
                            sample: new Date(parseInt(event?.fecha)).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        },
                        tag5: {
                            name: "estilo",
                            value: "{{params.styleEvent}}",
                            sample: event?.estilo?.toUpperCase() || "sin estilo cargado"
                        },
                        tag6: {
                            name: "tematica",
                            value: "{{params.themeEvent}}",
                            sample: event?.tematica?.toUpperCase() || "sin tematica cargada"
                        },
                        tag7: {
                            name: "usuario_nombre",
                            value: "{{params.userEvent}}",
                            sample: event?.usuario_nombre
                        },
                        tag8: {
                            name: "imgEvento",
                            value: "{{params.imgEvent}}",
                            sample: event?.imgEvento?.i640 ? `https://apiapp.bodasdehoy.com/${event?.imgEvento?.i640}` : "sin imagen cargada"
                        },
                        tag9: {
                            name: "lugar",
                            value: "{{params.placeEvent}}",
                            sample: event?.lugar?.title || "sin lugar cargado"
                        },
                    },
                    appearance: {
                        actionBar: {
                            placement: 'top'
                        },
                        panels: {
                            tools: {
                                dock: 'right',
                                collapsible: true,
                                tabs: {
                                    body: {
                                        visible: true
                                    },
                                },
                            },
                        },
                        loader: {
                            html: '<div/>'
                        },
                    },
                    tools: {
                        rows: {
                            properties: {
                                noStackMobile: {
                                    editor: {
                                        _override: {
                                            desktop: {
                                                defaultValue: true, // Default value for 'Do Not Stack on Mobile'
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        image: {
                            enabled: true,
                            position: 6,
                        },
                        button: {
                            enabled: true,
                            position: 7,
                        },
                        menu: {
                            enabled: false,
                        },
                    },
                }} />
            </div>
            <style jsx>
                {`
          .loader {
              border-top-color:  ${config?.theme?.primaryColor};
              -webkit-animation: spinner 1.5s linear infinite;
              animation: spinner 1.5s linear infinite;
          }
          @-webkit-keyframes spinner {
              0% {
              -webkit-transform: rotate(0deg);
              }
              100% {
              -webkit-transform: rotate(360deg);
              }
          }
          @keyframes spinner {
              0% {
              transform: rotate(0deg);
              }
              100% {
              transform: rotate(360deg);
              }
          }
        `}
            </style>
        </div>
    );
};
