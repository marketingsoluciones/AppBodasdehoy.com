import React, { useEffect, useRef, useState } from 'react';
import { IoFolderOpenOutline, IoSaveOutline } from "react-icons/io5";
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { GoArrowLeft } from "react-icons/go";
import { AuthContextProvider, EventContextProvider } from '../../context';
import { translations } from '../../locales/react-email-editor-es';
import i18next from "i18next";
import { toPng } from 'html-to-image';
import trimCanvas from 'trim-canvas'
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';
import ModalDefault from './ModalDefault';
import { ModalHtmlPreview } from './ModalHtmlPreview';
import { ModalTemplates } from './ModalTemplates';
import { EmailDesign } from '../../utils/Interfaces';
import { EditableLabelWithInput } from '../Forms/EditableLabelWithInput';
import ButtonPrimary from './ButtonPrimary';

interface props {
    setEmailEditorModal: (value: boolean) => void
    EmailEditorModal: boolean
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

export const EmailReactEditorComponent = ({ setEmailEditorModal, EmailEditorModal, previewEmailReactEditor, ...props }) => {
    const { config } = AuthContextProvider()
    const { event } = EventContextProvider()
    const { t } = useTranslation();
    const emailEditorRef = useRef<EditorRef>(null);
    const unlayer = emailEditorRef.current?.editor;
    const [editorReady, setEditorReady] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
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

    useEffect(() => {
        const draft = localStorage.getItem('emailEditorDesign');
        if (draft) {
            setShowLoadDraftModal(true);
        }
    }, []);

    useEffect(() => {
        if (unlayer) {
            unlayer.addEventListener('design:updated', function (updates) {
                unlayer.exportHtml(function (data) {
                    localStorage.setItem('emailEditorDesign', JSON.stringify({
                        design: data.design,
                        name: template?.name ?? "template1",
                        _id: template?._id,
                        updatedAt: new Date()
                    }));
                    setHasUnsavedChanges(true);
                });
            });
        }
    }, [unlayer]);

    const handleCloseEditor = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedModal({
                state: true,
                label: '¿Seguro que quieres salir?',
                actionUnsave: () => {
                    localStorage.removeItem('emailEditorDesign');
                    setHasUnsavedChanges(false);
                    setEmailEditorModal(false);
                    setShowUnsavedModal(undefined);
                },
                actionSave: () => {
                    handleSaveDesign()
                    setShowUnsavedModal(undefined);
                    setPostAction({
                        state: true,
                        action: () => {
                            setEmailEditorModal(false);
                        }
                    });
                }
            });
        } else {
            setEmailEditorModal(false);
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
                setHtml(data.html);
                setShowSaveModal(true);
            });
        } catch (error) {
            console.log('error', error)
        }
    };

    const handleLoadDraft = () => {
        const draft = localStorage.getItem('emailEditorDesign');
        if (draft && unlayer) {
            const template = JSON.parse(draft);
            unlayer.loadDesign(template.design);
            setTemplate(template);
        }
        setShowLoadDraftModal(false);
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
        setEditorReady(true);
        setTimeout(() => {
            setIsLoading(true)
        }, previewEmailReactEditor ? 800 : 0);
    };

    const handleNextSaveDesign = async () => {
        try {
            if (htmlToImageRef.current) {
                const node = htmlToImageRef.current;
                const rect = node.getBoundingClientRect();
                const dataUrl = await toPng(node, {
                    cacheBust: true,
                    width: rect.width,
                    height: rect.height
                });
                let canvas = document.createElement('canvas');
                const img = new window.Image();
                img.onload = function () {
                    const scale = 0.30;
                    canvas.width = 1080 * scale;
                    canvas.height = 1620 * scale;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const result = trimCanvas(canvas);
                    const pngUrl = result.toDataURL('image/png');
                    if (!template?._id) {
                        fetchApiEventos({
                            query: queries.createEmailTemplate,
                            variables: {
                                evento_id: event?._id,
                                design: designASD,
                                html,
                                name: template?.name || 'template1',
                                preview: pngUrl,
                            },
                            domain: config?.domain
                        }).then((res) => {
                            setTemplate({ ...template, _id: res[0]._id, updatedAt: new Date() })
                            localStorage.removeItem('emailEditorDesign');
                            setHasUnsavedChanges(false);
                            postAction?.state && postAction.action();
                        })
                    } else {
                        fetchApiEventos({
                            query: queries.updateEmailTemplate,
                            variables: {
                                evento_id: event?._id,
                                template_id: template?._id,
                                design: designASD,
                                html,
                                preview: pngUrl,
                            },
                        }).then((res) => {
                            setTemplate({ ...template, _id: res[0]._id, updatedAt: new Date() })
                            localStorage.removeItem('emailEditorDesign');
                            setHasUnsavedChanges(false);
                            postAction?.state && postAction.action();
                        })
                    }
                    setShowSaveModal(false);
                    setHtml('');
                };
                img.src = dataUrl;
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
                    evento_id: event?._id,
                    template_id: emailDesign._id
                }
            }).then((res) => {
                unlayer.loadDesign(res[0].design as any)
                setTemplate({ ...emailDesign, design: res[0].design })
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
                    name: template?.name,
                }
            })
        }
    }, [template?.name])

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
            {!isLoading && <div className="absolute z-50  top-[calc(50%-20px)] left-[calc(50%-20px)] loader ease-linear rounded-full border-[7px] border-black border-opacity-35 w-10 h-10" />}
            <div className={`h-full ${isLoading ? "opacity-100" : "opacity-0"} transition-all duration-300`} >
                {editorReady && <div className='absolute flex'>
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
                        <div className={"flex w-[250px] h-[38px] items-end justify-start cursor-pointer border-l"} >
                            <div className='pb-1 pl-2 text-sm relative'>
                                <EditableLabelWithInput
                                    value={template?.name ? template.name : "template1"}
                                    type={null}
                                    handleChange={(values) => { setTemplate({ ...template, name: values.value }) }}
                                    accessor={null}
                                    textAlign="left" />
                            </div>
                        </div>
                    </>}
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
                        nombre: {
                            name: "Nombre",
                            value: "{{nombre}}",
                            sample: "Juan Pérez"
                        },
                        email: {
                            name: "Email",
                            value: "{{email}}",
                            sample: "juan@email.com"
                        },
                        invitationImg: {
                            name: "invitacion",
                            value: "{{invitacion}}",
                            sample: "no hay"
                        },
                        // Puedes agregar más variables aquí
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
