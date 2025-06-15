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

    useEffect(() => {
        console.log(100051, template)
    }, [template])


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
                    }} />
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



const asd = {
    "counters": {
        "u_row": 8,
        "u_column": 13,
        "u_content_menu": 1,
        "u_content_text": 24,
        "u_content_image": 8,
        "u_content_button": 2,
        "u_content_divider": 1,
        "u_content_heading": 3
    },
    "body": {
        "id": "0QFAKPxyzM",
        "rows": [
            {
                "id": "-Pm2fEb9Wp",
                "cells": [
                    1
                ],
                "columns": [
                    {
                        "id": "aREOk3UC4g",
                        "contents": [
                            {
                                "id": "hpEzy7mhvP",
                                "type": "image",
                                "values": {
                                    "containerPadding": "10px 10px 0px",
                                    "anchor": "",
                                    "src": {
                                        "url": "https://assets.unlayer.com/projects/139/1676495528722-apple_logo_circle_f5f5f7-000_2x.png",
                                        "width": 116,
                                        "height": 116,
                                        "maxWidth": "15%",
                                        "autoWidth": false,
                                        "dynamic": true
                                    },
                                    "textAlign": "center",
                                    "altText": "",
                                    "action": {
                                        "name": "web",
                                        "values": {
                                            "href": "",
                                            "target": "_blank"
                                        }
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_image_1",
                                        "htmlClassNames": "u_content_image"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "_override": {
                                        "mobile": {
                                            "src": {
                                                "maxWidth": "20%",
                                                "autoWidth": false
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                "id": "wQof8hV6QL",
                                "type": "heading",
                                "values": {
                                    "containerPadding": "0px",
                                    "anchor": "",
                                    "headingType": "h1",
                                    "fontWeight": 400,
                                    "fontSize": "48px",
                                    "color": "#ffffff",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_heading_1",
                                        "htmlClassNames": "u_content_heading"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "MacBook Pro",
                                    "_override": {
                                        "mobile": {
                                            "fontSize": "45px"
                                        }
                                    }
                                }
                            },
                            {
                                "id": "tfkkYtjur9",
                                "type": "heading",
                                "values": {
                                    "containerPadding": "0px",
                                    "anchor": "",
                                    "headingType": "h2",
                                    "fontSize": "28px",
                                    "color": "#ffffff",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_heading_2",
                                        "htmlClassNames": "u_content_heading"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "Mover. Maker. Boundary breaker.",
                                    "_override": {
                                        "mobile": {
                                            "fontSize": "19px"
                                        }
                                    }
                                }
                            },
                            {
                                "id": "7wzu4Z8K86",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "17px",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_2",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">From $1999 or $166.58/mo. for 12 mo.</p>",
                                    "_override": {
                                        "mobile": {
                                            "fontSize": "14px"
                                        }
                                    }
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_1",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    }
                ],
                "values": {
                    "displayCondition": null,
                    "columns": false,
                    "_styleGuide": null,
                    "backgroundColor": "",
                    "columnsBackgroundColor": "",
                    "backgroundImage": {
                        "url": "",
                        "fullWidth": true,
                        "repeat": "no-repeat",
                        "size": "custom",
                        "position": "center"
                    },
                    "padding": "0px",
                    "anchor": "",
                    "hideDesktop": false,
                    "_meta": {
                        "htmlID": "u_row_1",
                        "htmlClassNames": "u_row"
                    },
                    "selectable": true,
                    "draggable": true,
                    "duplicatable": true,
                    "deletable": true,
                    "hideable": true,
                    "locked": false
                }
            },
            {
                "id": "A-f41NTazI",
                "cells": [
                    1,
                    1
                ],
                "columns": [
                    {
                        "id": "SfLBIwDbWU",
                        "contents": [
                            {
                                "id": "vjfsdzgJRX",
                                "type": "button",
                                "values": {
                                    "href": {
                                        "name": "web",
                                        "values": {
                                            "href": "",
                                            "target": "_blank"
                                        }
                                    },
                                    "buttonColors": {
                                        "color": "#FFFFFF",
                                        "backgroundColor": "#0071e3",
                                        "hoverColor": "#FFFFFF",
                                        "hoverBackgroundColor": "#3AAEE0"
                                    },
                                    "size": {
                                        "autoWidth": true,
                                        "width": "100%"
                                    },
                                    "fontSize": "17px",
                                    "lineHeight": "120%",
                                    "textAlign": "right",
                                    "padding": "10px 20px",
                                    "border": {},
                                    "borderRadius": "25px",
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "_meta": {
                                        "htmlID": "u_content_button_2",
                                        "htmlClassNames": "u_content_button"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<span style=\"line-height: 20.4px;\">Buy</span>",
                                    "calculatedWidth": 69,
                                    "calculatedHeight": 40,
                                    "_override": {
                                        "mobile": {
                                            "textAlign": "center"
                                        }
                                    }
                                },
                                "hasDeprecatedFontControls": true
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_2",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "0px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    },
                    {
                        "id": "oHGVnfFNrL",
                        "contents": [
                            {
                                "id": "X9LHO8t95H",
                                "type": "text",
                                "values": {
                                    "containerPadding": "20px",
                                    "anchor": "",
                                    "fontSize": "17px",
                                    "color": "#0071e3",
                                    "textAlign": "left",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_3",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">Learn more </p>",
                                    "_override": {
                                        "mobile": {
                                            "textAlign": "center"
                                        }
                                    }
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_3",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "0px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    }
                ],
                "values": {
                    "displayCondition": null,
                    "columns": false,
                    "_styleGuide": null,
                    "backgroundColor": "",
                    "columnsBackgroundColor": "",
                    "backgroundImage": {
                        "url": "",
                        "fullWidth": true,
                        "repeat": "no-repeat",
                        "size": "custom",
                        "position": "center"
                    },
                    "padding": "0px",
                    "anchor": "",
                    "hideDesktop": false,
                    "_meta": {
                        "htmlID": "u_row_2",
                        "htmlClassNames": "u_row"
                    },
                    "selectable": true,
                    "draggable": true,
                    "duplicatable": true,
                    "deletable": true,
                    "hideable": true,
                    "locked": false
                }
            },
            {
                "id": "Rd4HAvqb8t",
                "cells": [
                    1
                ],
                "columns": [
                    {
                        "id": "_t6kskqCwL",
                        "contents": [
                            {
                                "id": "AF8ZpW__0i",
                                "type": "image",
                                "values": {
                                    "containerPadding": "0px",
                                    "anchor": "",
                                    "src": {
                                        "url": "https://assets.unlayer.com/projects/139/1676495949571-hero_2x.jpg",
                                        "width": 1424,
                                        "height": 880,
                                        "dynamic": true
                                    },
                                    "textAlign": "center",
                                    "altText": "",
                                    "action": {
                                        "name": "web",
                                        "values": {
                                            "href": "",
                                            "target": "_blank"
                                        }
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_image_2",
                                        "htmlClassNames": "u_content_image"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false
                                }
                            },
                            {
                                "id": "iEmfF6xJBD",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontWeight": 700,
                                    "fontSize": "21px",
                                    "color": "#9d9d9d",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_4",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">Supercharged by M2 Pro and M2 Max.</p>",
                                    "_override": {
                                        "mobile": {
                                            "lineHeight": "140%",
                                            "fontSize": "18px"
                                        }
                                    }
                                }
                            },
                            {
                                "id": "usZCBV0vIV",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontWeight": 700,
                                    "fontSize": "21px",
                                    "color": "#9d9d9d",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_7",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">Up to 22 hours of battery life.</p>",
                                    "_override": {
                                        "mobile": {
                                            "fontSize": "18px"
                                        }
                                    }
                                }
                            },
                            {
                                "id": "GvsqJNYPRO",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontWeight": 700,
                                    "fontSize": "21px",
                                    "color": "#9d9d9d",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_6",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">Stunning Liquid Retina XDR display.</p>",
                                    "_override": {
                                        "mobile": {
                                            "fontSize": "18px"
                                        }
                                    }
                                }
                            },
                            {
                                "id": "T_w1lypU3k",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontWeight": 700,
                                    "fontSize": "21px",
                                    "color": "#9d9d9d",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_5",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">All the ports you need and faster Wi-Fi 6E.3</p>",
                                    "_override": {
                                        "mobile": {
                                            "fontSize": "18px"
                                        }
                                    }
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_4",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "0px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    }
                ],
                "values": {
                    "displayCondition": null,
                    "columns": false,
                    "_styleGuide": null,
                    "backgroundColor": "",
                    "columnsBackgroundColor": "",
                    "backgroundImage": {
                        "url": "",
                        "fullWidth": true,
                        "repeat": "no-repeat",
                        "size": "custom",
                        "position": "center"
                    },
                    "padding": "15px 15px 70px",
                    "anchor": "",
                    "hideDesktop": false,
                    "_meta": {
                        "htmlID": "u_row_3",
                        "htmlClassNames": "u_row"
                    },
                    "selectable": true,
                    "draggable": true,
                    "duplicatable": true,
                    "deletable": true,
                    "hideable": true,
                    "locked": false
                }
            },
            {
                "id": "Wlvn-fimOW",
                "cells": [
                    1
                ],
                "columns": [
                    {
                        "id": "EmTZshrUgj",
                        "contents": [
                            {
                                "id": "KXAX-ozp-i",
                                "type": "heading",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "headingType": "h1",
                                    "fontSize": "32px",
                                    "color": "#ffffff",
                                    "textAlign": "center",
                                    "lineHeight": "120%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_heading_3",
                                        "htmlClassNames": "u_content_heading"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "Why Apple is the best place<br />to buy your new Mac.",
                                    "_override": {
                                        "mobile": {
                                            "fontSize": "28px"
                                        }
                                    }
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_5",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "0px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    }
                ],
                "values": {
                    "displayCondition": null,
                    "columns": false,
                    "_styleGuide": null,
                    "backgroundColor": "#1d1d1f",
                    "columnsBackgroundColor": "",
                    "backgroundImage": {
                        "url": "",
                        "fullWidth": true,
                        "repeat": "no-repeat",
                        "size": "custom",
                        "position": "center"
                    },
                    "padding": "50px",
                    "anchor": "",
                    "hideDesktop": false,
                    "_meta": {
                        "htmlID": "u_row_4",
                        "htmlClassNames": "u_row"
                    },
                    "selectable": true,
                    "draggable": true,
                    "duplicatable": true,
                    "deletable": true,
                    "hideable": true,
                    "locked": false
                }
            },
            {
                "id": "qRAvYBUrR3",
                "cells": [
                    1,
                    1
                ],
                "columns": [
                    {
                        "id": "MfyrG9rNcx",
                        "contents": [
                            {
                                "id": "qnuJUd79Ge",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "24px",
                                    "textAlign": "center",
                                    "lineHeight": "120%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_8",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 120%;\">Get credit toward</p>\n<p style=\"line-height: 120%;\">a new Mac.</p>"
                                }
                            },
                            {
                                "id": "RDIKTy_DOp",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "14px",
                                    "textAlign": "center",
                                    "lineHeight": "150%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_9",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 150%;\">With Apple Trade In, just give us your eligible Mac and get credit for a new one. It's good for you and the planet.</p>"
                                }
                            },
                            {
                                "id": "tnH6A8J6sD",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "14px",
                                    "color": "#0071e3",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_10",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">Find your trade-in value</p>"
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_6",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "33px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    },
                    {
                        "id": "jGDnuQs-ho",
                        "contents": [
                            {
                                "id": "Wbvl_87V-4",
                                "type": "image",
                                "values": {
                                    "containerPadding": "0px",
                                    "anchor": "",
                                    "src": {
                                        "url": "https://assets.unlayer.com/projects/139/1676496418898-credit_mac_2x.jpg",
                                        "width": 712,
                                        "height": 550,
                                        "dynamic": true
                                    },
                                    "textAlign": "center",
                                    "altText": "",
                                    "action": {
                                        "name": "web",
                                        "values": {
                                            "href": "",
                                            "target": "_blank"
                                        }
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_image_3",
                                        "htmlClassNames": "u_content_image"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_7",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "0px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    }
                ],
                "values": {
                    "displayCondition": null,
                    "columns": false,
                    "_styleGuide": null,
                    "backgroundColor": "#1d1d1f",
                    "columnsBackgroundColor": "#000000",
                    "backgroundImage": {
                        "url": "",
                        "fullWidth": true,
                        "repeat": "no-repeat",
                        "size": "custom",
                        "position": "center"
                    },
                    "padding": "5px",
                    "anchor": "",
                    "hideDesktop": false,
                    "_meta": {
                        "htmlID": "u_row_5",
                        "htmlClassNames": "u_row"
                    },
                    "selectable": true,
                    "draggable": true,
                    "duplicatable": true,
                    "deletable": true,
                    "hideable": true,
                    "locked": false
                }
            },
            {
                "id": "xsDeI6ThVX",
                "cells": [
                    1,
                    1
                ],
                "columns": [
                    {
                        "id": "PtkZbFNtjL",
                        "contents": [
                            {
                                "id": "JZtislN2W7",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "24px",
                                    "textAlign": "center",
                                    "lineHeight": "120%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_11",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 120%;\">Apple Card Monthly Installments.</p>"
                                }
                            },
                            {
                                "id": "9rqc5f7Vsk",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "14px",
                                    "textAlign": "center",
                                    "lineHeight": "150%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_24",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 150%;\">Pay over time, interest-free when you choose to check out with Apple Card Monthly Installments.</p>"
                                }
                            },
                            {
                                "id": "le8EzyAcDY",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "14px",
                                    "color": "#0071e3",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_13",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">Learn more</p>"
                                }
                            },
                            {
                                "id": "EZmcoOSqCd",
                                "type": "image",
                                "values": {
                                    "containerPadding": "0px",
                                    "anchor": "",
                                    "src": {
                                        "url": "https://assets.unlayer.com/projects/139/1676497065877-apple_card_2x.jpg",
                                        "width": 700,
                                        "height": 390,
                                        "dynamic": true
                                    },
                                    "textAlign": "center",
                                    "altText": "",
                                    "action": {
                                        "name": "web",
                                        "values": {
                                            "href": "",
                                            "target": "_blank"
                                        }
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_image_7",
                                        "htmlClassNames": "u_content_image"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_8",
                                "htmlClassNames": "u_column"
                            },
                            "border": {
                                "borderTopColor": "#CCC",
                                "borderTopStyle": "solid",
                                "borderTopWidth": "0px",
                                "borderLeftColor": "#CCC",
                                "borderLeftStyle": "solid",
                                "borderLeftWidth": "0px",
                                "borderRightColor": "#1d1d1f",
                                "borderRightStyle": "solid",
                                "borderRightWidth": "5px",
                                "borderBottomColor": "#CCC",
                                "borderBottomStyle": "solid",
                                "borderBottomWidth": "0px"
                            },
                            "padding": "33px 0px 0px",
                            "_override": {
                                "mobile": {
                                    "border": {
                                        "borderTopColor": "#CCC",
                                        "borderTopStyle": "solid",
                                        "borderTopWidth": "0px",
                                        "borderLeftColor": "#CCC",
                                        "borderLeftStyle": "solid",
                                        "borderLeftWidth": "0px",
                                        "borderRightColor": "#CCC",
                                        "borderRightStyle": "solid",
                                        "borderRightWidth": "0px",
                                        "borderBottomColor": "#CCC",
                                        "borderBottomStyle": "solid",
                                        "borderBottomWidth": "0px"
                                    }
                                }
                            },
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    },
                    {
                        "id": "jAFMuhCh-p",
                        "contents": [
                            {
                                "id": "tXUPtUC2gk",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "24px",
                                    "textAlign": "center",
                                    "lineHeight": "120%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_21",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 120%;\">Save on a new</p>\n<p style=\"line-height: 120%;\">Mac with Apple</p>\n<p style=\"line-height: 120%;\">education pricing.</p>"
                                }
                            },
                            {
                                "id": "fUoTe1sYhQ",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "14px",
                                    "color": "#0071e3",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_23",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">Shop</p>"
                                }
                            },
                            {
                                "id": "ij9PdsfvZQ",
                                "type": "image",
                                "values": {
                                    "containerPadding": "21px 0px 0px",
                                    "anchor": "",
                                    "src": {
                                        "url": "https://assets.unlayer.com/projects/139/1676497143860-edu_mac_2x.jpg",
                                        "width": 700,
                                        "height": 390,
                                        "dynamic": true
                                    },
                                    "textAlign": "center",
                                    "altText": "",
                                    "action": {
                                        "name": "web",
                                        "values": {
                                            "href": "",
                                            "target": "_blank"
                                        }
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_image_8",
                                        "htmlClassNames": "u_content_image"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_9",
                                "htmlClassNames": "u_column"
                            },
                            "border": {
                                "borderTopColor": "#CCC",
                                "borderTopStyle": "solid",
                                "borderTopWidth": "0px",
                                "borderLeftColor": "#1d1d1f",
                                "borderLeftStyle": "solid",
                                "borderLeftWidth": "5px",
                                "borderRightColor": "#CCC",
                                "borderRightStyle": "solid",
                                "borderRightWidth": "0px",
                                "borderBottomColor": "#CCC",
                                "borderBottomStyle": "solid",
                                "borderBottomWidth": "0px"
                            },
                            "padding": "33px 0px 0px",
                            "_override": {
                                "mobile": {
                                    "border": {
                                        "borderTopColor": "#CCC",
                                        "borderTopStyle": "solid",
                                        "borderTopWidth": "0px",
                                        "borderLeftColor": "#CCC",
                                        "borderLeftStyle": "solid",
                                        "borderLeftWidth": "0px",
                                        "borderRightColor": "#CCC",
                                        "borderRightStyle": "solid",
                                        "borderRightWidth": "0px",
                                        "borderBottomColor": "#CCC",
                                        "borderBottomStyle": "solid",
                                        "borderBottomWidth": "0px"
                                    }
                                }
                            },
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    }
                ],
                "values": {
                    "displayCondition": null,
                    "columns": false,
                    "_styleGuide": null,
                    "backgroundColor": "#1d1d1f",
                    "columnsBackgroundColor": "#000000",
                    "backgroundImage": {
                        "url": "",
                        "fullWidth": true,
                        "repeat": "no-repeat",
                        "size": "custom",
                        "position": "center"
                    },
                    "padding": "5px",
                    "anchor": "",
                    "hideDesktop": false,
                    "_meta": {
                        "htmlID": "u_row_6",
                        "htmlClassNames": "u_row"
                    },
                    "selectable": true,
                    "draggable": true,
                    "duplicatable": true,
                    "deletable": true,
                    "hideable": true,
                    "locked": false
                }
            },
            {
                "id": "GyxkKaDoVf",
                "cells": [
                    1,
                    1
                ],
                "columns": [
                    {
                        "id": "_QiC12awFa",
                        "contents": [
                            {
                                "id": "S_hqZ7HMSl",
                                "type": "image",
                                "values": {
                                    "containerPadding": "0px",
                                    "anchor": "",
                                    "src": {
                                        "url": "https://assets.unlayer.com/projects/139/1676496501021-specialist_2x.jpg",
                                        "width": 712,
                                        "height": 550,
                                        "dynamic": true
                                    },
                                    "textAlign": "center",
                                    "altText": "",
                                    "action": {
                                        "name": "web",
                                        "values": {
                                            "href": "",
                                            "target": "_blank"
                                        }
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_image_6",
                                        "htmlClassNames": "u_content_image"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_12",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "0px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    },
                    {
                        "id": "tBvHHdYsbP",
                        "contents": [
                            {
                                "id": "YBq_C6WCxM",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "24px",
                                    "textAlign": "center",
                                    "lineHeight": "120%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_18",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 120%;\">Shop one on one with</p>\n<p style=\"line-height: 120%;\">a Mac Specialist.</p>"
                                }
                            },
                            {
                                "id": "0DF1Wlu-f8",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "14px",
                                    "textAlign": "center",
                                    "lineHeight": "150%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_19",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 150%;\">Our Specialists can help you choose, configure, and buy the perfect Mac.</p>"
                                }
                            },
                            {
                                "id": "3PX82nq2MS",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "14px",
                                    "color": "#0071e3",
                                    "textAlign": "center",
                                    "lineHeight": "140%",
                                    "linkStyle": {
                                        "inherit": true,
                                        "linkColor": "#0000ee",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": true,
                                        "linkHoverUnderline": true
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_20",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 140%;\">Find a store</p>"
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_13",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "33px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    }
                ],
                "values": {
                    "displayCondition": null,
                    "columns": false,
                    "_styleGuide": null,
                    "backgroundColor": "#1d1d1f",
                    "columnsBackgroundColor": "#000000",
                    "backgroundImage": {
                        "url": "",
                        "fullWidth": true,
                        "repeat": "no-repeat",
                        "size": "custom",
                        "position": "center"
                    },
                    "padding": "5px",
                    "anchor": "",
                    "hideDesktop": false,
                    "_meta": {
                        "htmlID": "u_row_8",
                        "htmlClassNames": "u_row"
                    },
                    "selectable": true,
                    "draggable": true,
                    "duplicatable": true,
                    "deletable": true,
                    "hideable": true,
                    "locked": false
                }
            },
            {
                "id": "he9WBb_LIA",
                "cells": [
                    1
                ],
                "columns": [
                    {
                        "id": "9KxIY1TsoO",
                        "contents": [
                            {
                                "id": "TJ6qaeBuzl",
                                "type": "menu",
                                "values": {
                                    "containerPadding": "5px",
                                    "anchor": "",
                                    "menu": {
                                        "items": [
                                            {
                                                "key": "1676496571373",
                                                "link": {
                                                    "name": "web",
                                                    "attrs": {
                                                        "href": "{{href}}",
                                                        "target": "{{target}}"
                                                    },
                                                    "values": {
                                                        "href": "https://www.apple.com/",
                                                        "target": "_self"
                                                    }
                                                },
                                                "text": "Shop Online"
                                            },
                                            {
                                                "key": "1676496577930",
                                                "link": {
                                                    "name": "web",
                                                    "attrs": {
                                                        "href": "{{href}}",
                                                        "target": "{{target}}"
                                                    },
                                                    "values": {
                                                        "href": "https://www.apple.com/",
                                                        "target": "_self"
                                                    }
                                                },
                                                "text": "Find a Store"
                                            },
                                            {
                                                "key": "1676496581406",
                                                "link": {
                                                    "name": "web",
                                                    "attrs": {
                                                        "href": "{{href}}",
                                                        "target": "{{target}}"
                                                    },
                                                    "values": {
                                                        "href": "https://www.apple.com/",
                                                        "target": "_self"
                                                    }
                                                },
                                                "text": "1-800-MY-APPLE"
                                            },
                                            {
                                                "key": "1676496588057",
                                                "link": {
                                                    "name": "web",
                                                    "attrs": {
                                                        "href": "{{href}}",
                                                        "target": "{{target}}"
                                                    },
                                                    "values": {
                                                        "href": "https://www.apple.com/",
                                                        "target": "_self"
                                                    }
                                                },
                                                "text": "Get the Apple Store App"
                                            }
                                        ]
                                    },
                                    "fontSize": "14px",
                                    "textColor": "#424245",
                                    "linkColor": "#d2d2d7",
                                    "align": "center",
                                    "layout": "horizontal",
                                    "separator": "|",
                                    "padding": "5px 10px",
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_menu_1",
                                        "htmlClassNames": "u_content_menu"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "_override": {
                                        "mobile": {
                                            "layout": "vertical"
                                        }
                                    }
                                }
                            },
                            {
                                "id": "mNBB5zCn71",
                                "type": "divider",
                                "values": {
                                    "width": "100%",
                                    "border": {
                                        "borderTopWidth": "1px",
                                        "borderTopStyle": "solid",
                                        "borderTopColor": "#424245"
                                    },
                                    "textAlign": "center",
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_divider_1",
                                        "htmlClassNames": "u_content_divider"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false
                                }
                            },
                            {
                                "id": "bo4vg76emo",
                                "type": "text",
                                "values": {
                                    "containerPadding": "10px",
                                    "anchor": "",
                                    "fontSize": "12px",
                                    "color": "#86868b",
                                    "textAlign": "left",
                                    "lineHeight": "200%",
                                    "linkStyle": {
                                        "inherit": false,
                                        "linkColor": "#d2d2d7",
                                        "linkHoverColor": "#0000ee",
                                        "linkUnderline": false,
                                        "linkHoverUnderline": true,
                                        "body": false
                                    },
                                    "hideDesktop": false,
                                    "displayCondition": null,
                                    "_styleGuide": null,
                                    "_meta": {
                                        "htmlID": "u_content_text_17",
                                        "htmlClassNames": "u_content_text"
                                    },
                                    "selectable": true,
                                    "draggable": true,
                                    "duplicatable": true,
                                    "deletable": true,
                                    "hideable": true,
                                    "locked": false,
                                    "text": "<p style=\"line-height: 200%;\">If you reside in the U.S. territories, please call Goldman Sachs at 877-255-5923 with questions about Apple Card.</p>\n<p style=\"line-height: 200%;\">TM and © 2023 Apple Inc. One Apple Park Way, MS 96-DM, Cupertino, CA 95014.</p>\n<p style=\"line-height: 200%;\"><a rel=\"noopener\" href=\"https://www.apple.com/\" target=\"_blank\" data-u-link-value=\"eyJuYW1lIjoid2ViIiwiYXR0cnMiOnsiaHJlZiI6Int7aHJlZn19IiwidGFyZ2V0Ijoie3t0YXJnZXR9fSJ9LCJ2YWx1ZXMiOnsiaHJlZiI6Imh0dHBzOi8vd3d3LmFwcGxlLmNvbS8iLCJ0YXJnZXQiOiJfYmxhbmsifX0=\">All Rights Reserved</a>    |   <a rel=\"noopener\" href=\"https://www.apple.com/\" target=\"_blank\" data-u-link-value=\"eyJuYW1lIjoid2ViIiwiYXR0cnMiOnsiaHJlZiI6Int7aHJlZn19IiwidGFyZ2V0Ijoie3t0YXJnZXR9fSJ9LCJ2YWx1ZXMiOnsiaHJlZiI6Imh0dHBzOi8vd3d3LmFwcGxlLmNvbS8iLCJ0YXJnZXQiOiJfYmxhbmsifX0=\">Privacy Policy</a>    |   <a rel=\"noopener\" href=\"https://www.apple.com/\" target=\"_blank\" data-u-link-value=\"eyJuYW1lIjoid2ViIiwiYXR0cnMiOnsiaHJlZiI6Int7aHJlZn19IiwidGFyZ2V0Ijoie3t0YXJnZXR9fSJ9LCJ2YWx1ZXMiOnsiaHJlZiI6Imh0dHBzOi8vd3d3LmFwcGxlLmNvbS8iLCJ0YXJnZXQiOiJfYmxhbmsifX0=\">My Apple ID</a></p>\n<p style=\"line-height: 200%;\">If you prefer not to receive commercial email from Apple, or if you've changed your email address, please <a rel=\"noopener\" href=\"https://www.apple.com/\" target=\"_blank\" data-u-link-value=\"eyJuYW1lIjoid2ViIiwiYXR0cnMiOnsiaHJlZiI6Int7aHJlZn19IiwidGFyZ2V0Ijoie3t0YXJnZXR9fSJ9LCJ2YWx1ZXMiOnsiaHJlZiI6Imh0dHBzOi8vd3d3LmFwcGxlLmNvbS8iLCJ0YXJnZXQiOiJfYmxhbmsifX0=\">click here</a>.</p>"
                                }
                            }
                        ],
                        "values": {
                            "_meta": {
                                "htmlID": "u_column_10",
                                "htmlClassNames": "u_column"
                            },
                            "border": {},
                            "padding": "0px 30px",
                            "borderRadius": "0px",
                            "backgroundColor": "",
                            "deletable": true
                        }
                    }
                ],
                "values": {
                    "displayCondition": null,
                    "columns": false,
                    "_styleGuide": null,
                    "backgroundColor": "#1d1d1f",
                    "columnsBackgroundColor": "",
                    "backgroundImage": {
                        "url": "",
                        "fullWidth": true,
                        "repeat": "no-repeat",
                        "size": "custom",
                        "position": "center"
                    },
                    "padding": "10px 10px 50px",
                    "anchor": "",
                    "hideDesktop": false,
                    "_meta": {
                        "htmlID": "u_row_7",
                        "htmlClassNames": "u_row"
                    },
                    "selectable": true,
                    "draggable": true,
                    "duplicatable": true,
                    "deletable": true,
                    "hideable": true,
                    "locked": false
                }
            }
        ],
        "headers": [],
        "footers": [],
        "values": {
            "_styleGuide": null,
            "popupPosition": "center",
            "popupWidth": "600px",
            "popupHeight": "auto",
            "borderRadius": "10px",
            "contentAlign": "center",
            "contentVerticalAlign": "center",
            "contentWidth": 700,
            "fontFamily": {
                "label": "Helvetica",
                "value": "helvetica,sans-serif",
                "url": "",
                "weights": null,
                "defaultFont": true
            },
            "textColor": "#ffffff",
            "popupBackgroundColor": "#FFFFFF",
            "popupBackgroundImage": {
                "url": "",
                "fullWidth": true,
                "repeat": "no-repeat",
                "size": "cover",
                "position": "center"
            },
            "popupOverlay_backgroundColor": "rgba(0, 0, 0, 0.1)",
            "popupCloseButton_position": "top-right",
            "popupCloseButton_backgroundColor": "#DDDDDD",
            "popupCloseButton_iconColor": "#000000",
            "popupCloseButton_borderRadius": "0px",
            "popupCloseButton_margin": "0px",
            "popupCloseButton_action": {
                "name": "close_popup",
                "attrs": {
                    "onClick": "document.querySelector('.u-popup-container').style.display = 'none';"
                }
            },
            "language": {},
            "backgroundColor": "#000000",
            "preheaderText": "",
            "linkStyle": {
                "body": true,
                "linkColor": "#0071e3",
                "linkHoverColor": "#0000ee",
                "linkUnderline": true,
                "linkHoverUnderline": true,
                "inherit": false
            },
            "backgroundImage": {
                "url": "",
                "fullWidth": true,
                "repeat": "no-repeat",
                "size": "custom",
                "position": "center"
            },
            "_meta": {
                "htmlID": "u_body",
                "htmlClassNames": "u_body"
            }
        }
    },
    "schemaVersion": 21
}