import { Form, Formik, FormikValues, useField, useFormikContext } from "formik";
import { FC, useEffect, useState, useRef, useMemo } from 'react';
import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import { WhatsappPreview } from './WhatsappPreview';
import ButtonPrimary from './ButtonPrimary';
import InputField from '../Forms/InputField';
import SelectField from '../Forms/SelectField';
import * as yup from "yup";
import { GoArrowLeft } from "react-icons/go";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import Picker, { EmojiStyle, SuggestionMode, } from 'emoji-picker-react';
import ClickAwayListener from 'react-click-away-listener';
import { GrEmoji } from "react-icons/gr";

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
});


export interface TemplateWathsappValues {
    _id?: string;
    templateName: string;
    category: { _id: "INVITATION" | "REMINDER" | "CONFIRMATION" | "CUSTOM", title: string };
    mediaType: { _id: "none" | "image" | "video", title: string };
    mediaUrl: string;
    bodyContent: string;
    buttons?: any[]; // Opcional para compatibilidad con preview
    createdAt?: Date;
    updatedAt?: Date;
}

interface props {
    setShowEditorModal: (value: boolean) => void
}

export const WhatsappEditorComponent: FC<props> = ({ setShowEditorModal, ...props }) => {
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const toast = useToast();
    const [values, setValues] = useState<TemplateWathsappValues>()
    const [cursorPosition, setCursorPosition] = useState(0)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [enableEditor, setEnableEditor] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const divEditableRef = useRef(null)

    const variables = [
        { id: 1, name: "tipo de evento", value: "{{params.typeEvent}}", sample: [`event`][`tipo`] },
        { id: 2, name: "nombre del evento", value: "{{params.nameEvent}}", sample: event?.nombre },
        { id: 3, name: "invitado", value: "{{params.nameGuest}}", sample: event?.invitados_array[0]?.nombre },
        { id: 4, name: "fecha", value: "{{params.dateEvent}}", sample: new Date(parseInt(event?.fecha)).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
        { id: 5, name: "estilo", value: "{{params.styleEvent}}", sample: event?.estilo },
        { id: 6, name: "tematica", value: "{{params.themeEvent}}", sample: event?.tematica },
        { id: 7, name: "usuario_nombre", value: "{{params.userEvent}}", sample: event?.usuario_nombre },
        { id: 8, name: "imgEvento", value: "{{params.imgEvent}}", sample: event?.imgEvento?.i640 ? `https://apiapp.bodasdehoy.com/${event?.imgEvento?.i640}` : "sin imagen cargada" },
        { id: 9, name: "lugar", value: "{{params.placeEvent}}", sample: event?.lugar?.title },
    ];


    const [generatedJson, setGeneratedJson] = useState('');
    const [variableMap, setVariableMap] = useState<any>({});

    const quillModules = useMemo(
        () => ({
            history: {
                delay: 1000,
                maxStack: 100,
                userOnly: false
            },
            toolbar: {
                container: [
                    ['bold', 'italic', 'underline', 'strike', { color: [] }],
                ],
                'emoji-toolbar': true,
                'emoji-textarea': true,
                'emoji-shortname': true
            },
            keyboard: {
                bindings: false
            }
        }),
        [],
    );

    const handleEmojiClick = (emojiObject: any, setFieldValue: any) => {
        const elem = document.getElementById("selected")
        if (elem) {
            const content = elem?.textContent
            const cursorPosition = parseInt(elem.getAttribute("focusOffset"))
            let value = ""
            if (cursorPosition > 0) {
                if (cursorPosition < content.length) {
                    value = content.slice(0, cursorPosition) + emojiObject.emoji + content.slice(cursorPosition)
                } else {
                    value = content + emojiObject.emoji
                }
            } else {
                if (content.length === 0) {
                    value = emojiObject.emoji
                } else {
                    value = emojiObject.emoji + content
                }
            }
            elem.textContent = value
            setFieldValue('bodyContent', value)
            const newCP = cursorPosition + 2
            elem.setAttribute("focusOffset", newCP.toString())
        }
    };

    useEffect(() => {
        const map = {};
        variables.forEach(v => {
            map[v.value] = { id: v.id, name: v.name, sample: v.sample };
        });
        setVariableMap(map);
    }, []);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true)
        }
        return () => {
            setIsMounted(false)
        }
    }, [])

    useEffect(() => {
        if (isMounted) {
            setEnableEditor(true)
        }
    }, [isMounted])

    const validationSchema = yup.object().shape({
        templateName: yup.string().required(t("Name required")),
        bodyContent: yup.string().required(t("Message body is required")),
        mediaUrl: yup.string().when('mediaType', {
            is: (mediaType: string) => mediaType === 'image' || mediaType === 'video',
            then: (schema) => schema.required(t("Media URL is required")),
            otherwise: (schema) => schema.optional(),
        }),
    });

    const initialValues: TemplateWathsappValues = {
        templateName: '',
        category: { _id: "INVITATION", title: "INVITATION" },
        mediaType: { _id: "none", title: "NONE" },
        mediaUrl: '',
        bodyContent: t("hello") + " {{params.nameGuest}}",
        buttons: [], // Array vacío para compatibilidad con preview
    };

    const handleVariableSelect = (e: React.ChangeEvent<HTMLSelectElement>, setFieldValue: any, fieldName: string) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            if (fieldName === 'bodyContent') {
                // Para el editor Quill, insertar la variable en el contenido actual
                const currentContent = values?.[fieldName] || '';
                const plainTextContent = currentContent.replace(/<[^>]*>/g, '');
                const newContent = currentContent + selectedValue;
                setFieldValue(fieldName, newContent);
            } else {
                // Para otros campos, usar la lógica original
                const currentContent = values?.[fieldName] || '';
                const beforeCursor = currentContent.substring(0, cursorPosition);
                const afterCursor = currentContent.substring(cursorPosition);
                const newContent = beforeCursor + selectedValue + afterCursor;
                setFieldValue(fieldName, newContent);
                setCursorPosition(cursorPosition + selectedValue.length);
            }
            e.target.value = "";
        }
    };




    const generateTemplateJson = (values: TemplateWathsappValues) => {
        values = { ...values, templateName: values.templateName.trim() }
        console.log(100038, values)

        // Guardar plantilla en el backend para uso interno
        fetchApiEventos({
            query: queries.createWhatsappInvitationTemplate,
            variables: {
                evento_id: event?._id,
                data: values
            }
        }).then((res: any) => {
            toast("success", t("Template created successfully"));
        })

        setValues({ ...values })

        // Generar plantilla simple para WhatsApp normal
        const templateData = {
            name: values.templateName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            category: values.category._id,
            message: values.bodyContent,
            media: values.mediaType._id !== 'none' ? {
                type: values.mediaType._id,
                url: values.mediaUrl
            } : undefined,
            variables: variables.map(v => ({
                name: v.name,
                placeholder: v.value,
                sample: v.sample
            }))
        };

        setGeneratedJson(JSON.stringify(templateData, null, 2));
        toast("success", t("Template JSON generated successfully"));
    };

    useEffect(() => {
        console.log("generatedJson", generatedJson)
    }, [generatedJson])


    const handleSubmit = async (values: TemplateWathsappValues, actions: any) => {
        try {
            generateTemplateJson(values);
        } catch (error) {
            toast("error", `${t("An error has occurred")} ${error}`);
            console.log(error);
        } finally {
            actions.setSubmitting(false);
        }
    };

    const handleCloseEditor = () => {
        setShowEditorModal(false)
    };


    return (
        <div className='relative w-full h-full flex flex-col overflow-hidden'>
            <div className="w-full h-[38px] bg-white border-b-[1px] border-gray-300 overflow-hidden relative">
                <div className='absolute flex w-[604px]'>
                    <div onClick={handleCloseEditor} className={"flex w-16 h-[38px] flex-col items-center justify-center cursor-pointer border-l hover:bg-[#F4F4F4]"} >
                        <div className='pt-[2px]'>
                            <GoArrowLeft className='h-5 w-5' />
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-[calc(100%-38px)] bg-gray-100 font-inter flex flex-col md:flex-row">
                {/* Columna del Editor */}
                <div className="w-full h-full md:max-h-screen md:w-[55%] px-4 md:px-10 pt-3 pb-8 rounded-xl shadow-lg overflow-y-auto">
                    <Formik
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        validationSchema={validationSchema}
                    >
                        {({ isSubmitting, values, setFieldValue, errors, touched }) => values ? (
                            <Form className="w-full flex flex-col">
                                <AutoSubmitToken setValues={setValues} />
                                <div className="text-gray-500 font-body flex flex-col gap-2 w-full">
                                    {/* Configuración de la Plantilla */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                                        <InputField
                                            name="templateName"
                                            label={t("templateName")}
                                            type="text"
                                            placeholder={t("templateName")}
                                            className="text-xs"
                                            size={6}
                                        />
                                        <SelectField
                                            name="category"
                                            label={t("Category")}
                                            options={[{ _id: "INVITATION", title: t("Invitation") }, { _id: "REMINDER", title: t("Reminder") }, { _id: "CONFIRMATION", title: t("Confirmation") }, { _id: "CUSTOM", title: t("Custom") }]}
                                            className="text-xs"
                                        />
                                    </div>
                                    {/* Media */}
                                    <div className="mb-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                                        <SelectField
                                            name="mediaType"
                                            label={t("Media Type")}
                                            options={[{ _id: "none", title: t("None") }, { _id: "image", title: t("Image") }, { _id: "video", title: t("Video") }]}
                                            className="text-xs"
                                        />

                                        {values.mediaType._id === 'image' && (
                                            <div className="mt-2">
                                                <InputField
                                                    name="mediaUrl"
                                                    label={t("Image URL")}
                                                    type="url"
                                                    placeholder={t("https://example.com/image.jpg")}
                                                    className="text-xs"
                                                />
                                                <p className="text-gray-500 text-[11px] mt-1">{t("Enter the URL of the image to include in the message")}</p>
                                            </div>
                                        )}

                                        {values.mediaType._id === 'video' && (
                                            <div className="mt-2">
                                                <InputField
                                                    name="mediaUrl"
                                                    label={t("Video URL")}
                                                    type="url"
                                                    placeholder={t("https://example.com/video.mp4")}
                                                    className="text-xs"
                                                />
                                                <p className="text-gray-500 text-[11px] mt-1">{t("Enter the URL of the video to include in the message")}</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Body */}
                                    <div className="mb-2">
                                        <label className="font-display text-sm text-primary w-full mb-2 block">{t("Message Body")}</label>

                                        {/* Quill Editor with Emoji Picker */}
                                        <div className='flex w-full items-center space-x-2 border border-gray-200 rounded-xl p-2 bg-white'>
                                            <div className='flex'>
                                                <div className='flex justify-center items-center select-none'>
                                                    <ClickAwayListener onClickAway={() => { setShowEmojiPicker(false) }}>
                                                        <div className='w-full relative cursor-pointer'>
                                                            <div onClick={() => {
                                                                const elemFather = divEditableRef?.current?.getElementsByClassName("ql-editor")[0]
                                                                const elem = elemFather?.childNodes[elemFather?.childNodes.length - 1] as HTMLElement
                                                                const cPString = elem?.getAttribute("focusOffset")
                                                                const elemLats = document.getElementById("selected")
                                                                !!elemLats && elemLats.setAttribute("id", "")
                                                                !cPString && elem?.setAttribute("focusOffset", "0")
                                                                elem?.setAttribute("id", "selected")
                                                                setTimeout(() => {
                                                                    const position = elem?.getAttribute("focusOffset")
                                                                    const range = document.createRange();
                                                                    const sel = window.getSelection();
                                                                    if (elem?.firstChild) {
                                                                        range.setStart(elem.firstChild, elem.textContent ? parseInt(position || "0") : 0)
                                                                        range.collapse(true);
                                                                        sel?.removeAllRanges();
                                                                        sel?.addRange(range);
                                                                    }
                                                                    setShowEmojiPicker(!showEmojiPicker)
                                                                }, 50);
                                                            }} className='w-10 h-10 flex justify-center items-center hover:bg-gray-100 rounded-full'>
                                                                <GrEmoji className='w-6 h-6' />
                                                            </div>
                                                            {showEmojiPicker && (
                                                                <div className='absolute -translate-x-[110px] -translate-y-[418px] scale-[70%] z-50 shadow-md'>
                                                                    <Picker
                                                                        onEmojiClick={(emojiObject) => handleEmojiClick(emojiObject, setFieldValue)}
                                                                        emojiStyle={'apple' as EmojiStyle}
                                                                        searchDisabled={true}
                                                                        skinTonesDisabled={true}
                                                                        suggestedEmojisMode={'recent' as SuggestionMode}
                                                                        allowExpandReactions={false}
                                                                        width={480}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ClickAwayListener>
                                                </div>
                                            </div>
                                            <div ref={divEditableRef} className="bg-white min-h-[42.45px] flex-1">
                                                {enableEditor && <ReactQuill
                                                    theme="bubble"
                                                    value={values?.bodyContent || ''}
                                                    onChange={(value) => {
                                                        setFieldValue('bodyContent', value)
                                                    }}
                                                    modules={quillModules}
                                                    className='whatsapp-editor'
                                                    placeholder={t("e.g. Your order #{{params.nameEvent}} has been confirmed and will be shipped on {{params.dateEvent}}. Thank you for your purchase!")}
                                                />}
                                            </div>
                                        </div>

                                        {/* Variable Selector */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <label className="text-[11px] font-medium text-gray-700">{t("Add Variable")}:</label>
                                            <select
                                                className="p-2 flex-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
                                                onChange={(e) => handleVariableSelect(e, setFieldValue, 'bodyContent')}
                                                value=""
                                                disabled={values?.bodyContent?.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g)?.length > 5}
                                            >
                                                <option value="" disabled>{t("Select a variable")}</option>
                                                {variables.map(v => (
                                                    <option key={v.id} value={v.value}>
                                                        {v.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Character Count */}
                                        <div className="flex justify-end mt-1">
                                            <span className="text-gray-500 text-xs">
                                                {(values?.bodyContent || '').replace(/<[^>]*>/g, '').length}/1048
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className={`font-display rounded-full py-2 px-6 text-white font-medium transition w-full hover:opacity-70 ${isSubmitting ? "bg-secondary" : "bg-primary"}`}
                                        disabled={isSubmitting}
                                        type="submit"
                                    >
                                        {isSubmitting ? t("Generating...") : t("Generate Template JSON")}
                                    </button>
                                </div>
                            </Form>
                        ) : null}
                    </Formik>
                    {/* Área de visualización del JSON */}
                    {generatedJson && (
                        <div className="mt-8 pt-8 border-t-2 border-gray-200">
                            <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t("Generated JSON")}:</h2>
                            <pre className="bg-gray-800 text-white p-4 rounded-md text-xs overflow-x-auto">
                                <code>{generatedJson}</code>
                            </pre>
                            <button
                                onClick={() => {
                                    console.log("generatedJson")
                                    navigator.clipboard.writeText(generatedJson).then(() => toast("success", t("JSON copied to clipboard!")))
                                }}
                                className="mt-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                                {t("Copy JSON")}
                            </button>
                        </div>
                    )}
                </div>
                {/* Columna de la Vista Previa */}
                {values && (
                    <div className="flex-1 hidden md:flex justify-center overflow-auto">
                        <WhatsappPreview values={{ ...values }} variableMap={variableMap}
                        />
                    </div>
                )}
            </div>
            <style jsx>
                {`
                    .loader {
                        border-top-color: ${config?.theme?.primaryColor};
                        -webkit-animation: spinner 1.5s linear infinite;
                        animation: spinner 1.5s linear infinite;
                    }
                    @-webkit-keyframes spinner {
                        0% { -webkit-transform: rotate(0deg); }
                        100% { -webkit-transform: rotate(360deg); }
                    }
                    @keyframes spinner {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .whatsapp-editor .ql-editor {
                        min-height: 60px !important;
                        max-height: 150px !important;
                        word-break: break-all;
                        scrollbar-width: none;
                        font-size: 14px;
                        line-height: 1.4;
                        padding: 8px 12px;
                    }
                    .whatsapp-editor .ql-tooltip {
                        transform: translateY(-220%) !important;
                    }
                    .whatsapp-editor .ql-tooltip-arrow {
                        visibility: hidden;
                    }
                    .whatsapp-editor .ql-bubble .ql-editor {
                        border: none !important;
                        outline: none !important;
                    }
                    .whatsapp-editor .ql-bubble .ql-toolbar {
                        display: none;
                    }
                `}
            </style>
        </div>
    );
};

const AutoSubmitToken = ({ setValues }) => {
    const { values } = useFormikContext();

    useEffect(() => {
        setValues(values)
    }, [values])

    return null;
};