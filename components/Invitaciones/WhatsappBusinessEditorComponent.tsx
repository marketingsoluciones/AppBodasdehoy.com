import { Form, Formik, FormikValues, useField, useFormikContext } from "formik";
import { FC, useEffect, useState } from 'react';
import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import { WhatsappBusinessPreview } from './WhatsappBusinessPreview';
import ButtonPrimary from './ButtonPrimary';
import InputField from '../Forms/InputField';
import InputFieldVideoAndImage from '../Forms/InputFieldVideoAndImage';
import SelectField from '../Forms/SelectField';
import * as yup from "yup";
import { GoArrowLeft } from "react-icons/go";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, } from '@dnd-kit/core';
import { SortableButton } from './SortableButton';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, } from '@dnd-kit/sortable';
import { useSortable, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Button {
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'WHATSAPP';
    text: string;
    url?: string;
    phoneNumber?: string;
    example?: string;
    buttonId?: string; // Identificador único para cada tipo específico de botón
}

interface ButtonOption {
    title: string;
    description: string;
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'WHATSAPP';
    buttonId: string; // Identificador único para cada botón específico
}

export interface HeaderMediaContent {
    file: File | null;
    preview: string | null;
}

export interface TemplateWathsappBusinessValues {
    _id?: string;
    templateName: string;
    language: { _id: "es" | "en", title: string };
    category: { _id: "UTILITY" | "WEDDING", title: string };
    headerType: { _id: "none" | "text" | "image" | "image_event" | "video", title: string };
    headerContent: string;
    bodyContent: string;
    footerContent: string;
    buttons: Button[];
    createdAt?: Date;
    updatedAt?: Date;
}

interface props {
    setShowEditorModal: (value: boolean) => void
    variablesTemplatesInvitaciones: any[]
}

export const WhatsappBusinessEditorComponent: FC<props> = ({ setShowEditorModal, variablesTemplatesInvitaciones, ...props }) => {
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const toast = useToast();
    const [values, setValues] = useState<TemplateWathsappBusinessValues>()
    const [cursorPosition, setCursorPosition] = useState(0)

    const variables = variablesTemplatesInvitaciones;

    const buttonOptions: ButtonOption[] = [{
        title: t("Go to website"),
        description: t("Max 2 URL buttons"),
        type: "URL",
        buttonId: "go_to_website",
    },
    {
        title: t("confirm attendance SRVP"),
        description: t("Max 2 URL buttons"),
        type: "URL",
        buttonId: "confirm_attendance_rsvp",
    },
    {
        title: t("Quick reply"),
        description: t("Max 3 Quick Reply or 2 mixed"),
        type: "QUICK_REPLY",
        buttonId: "quick_reply",
    },
    ]

    const [generatedJson, setGeneratedJson] = useState('');
    const [variableMap, setVariableMap] = useState<any>({});

    useEffect(() => {
        const map = {};
        variables.forEach(v => {
            map[v.value] = { id: v.id, name: v.name, sample: v.sample };
        });
        setVariableMap(map);
    }, []);

    const validationSchema = yup.object().shape({
        templateName: yup.string()
            .required(t("Name required"))
            .test(
                'alphanumeric-underscore',
                t("Template name must contain only letters, numbers and underscores"),
                (value: string | undefined) => {
                    if (!value) return false;
                    const regex = /^[a-zA-Z0-9_ ]+$/;
                    return regex.test(value);
                }
            ),
        bodyContent: yup.string().required(t("Message body is required")),
        headerContent: yup.string().when('headerType', {
            is: (headerType: any) => {
                const type = headerType?._id;
                return type === 'text' || type === 'image' || type === 'video' || type === 'image_event';
            },
            then: (schema) => {
                return schema.test('header-content-validation', function (value) {
                    const headerType = this.parent.headerType?._id;

                    if (headerType === 'image_event') {
                        // Para image_event, validar que el evento tenga imagen
                        if (!value || value.trim() === '') {
                            return this.createError({
                                message: t("El evento no tiene imagen configurada"),
                                path: this.path
                            });
                        }
                        return true;
                    } else {
                        // Para text, image, video validar que no esté vacío
                        if (!value || value.trim() === '') {
                            return this.createError({
                                message: t("Header content is required"),
                                path: this.path
                            });
                        }
                        return true;
                    }
                });
            },
            otherwise: (schema) => schema.optional(),
        }),
        buttons: yup.array().of(
            yup.object().shape({
                text: yup.string().required(t("Button text is required")),
                url: yup.string().when('type', {
                    is: 'URL',
                    then: (schema) => schema.required(t("URL is required for URL buttons")),
                    otherwise: (schema) => schema.optional(),
                }),
                phoneNumber: yup.string().when('type', {
                    is: 'PHONE_NUMBER',
                    then: (schema) => schema.required(t("Phone number is required")),
                    otherwise: (schema) => schema.optional(),
                }),
            })
        ),
    });

    const initialValues: TemplateWathsappBusinessValues = {
        templateName: '',
        language: { _id: "es", title: "ES" },
        category: { _id: "UTILITY", title: "UTILITY" },
        headerType: { _id: "none", title: "NONE" },
        headerContent: '',
        bodyContent: t("hello") + " {{params.nameGuest}}",
        footerContent: '',
        buttons: [],
    };

    const handleVariableSelect = (e: React.ChangeEvent<HTMLSelectElement>, setFieldValue: any, fieldName: string) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            const fieldValue = values?.[fieldName];
            // Asegurarse de que el campo actual sea un string
            const currentContent = typeof fieldValue === 'string' ? fieldValue : '';
            const beforeCursor = currentContent.substring(0, cursorPosition);
            const afterCursor = currentContent.substring(cursorPosition);
            const newContent = beforeCursor + selectedValue + afterCursor;
            setFieldValue(fieldName, newContent);
            // Actualizar la posición del cursor después de insertar la variable
            setCursorPosition(cursorPosition + selectedValue.length);
            e.target.value = "";
        }
    };

    const addEmptyButton = (buttonId: string, setFieldValue: any) => {
        if (values?.buttons.length >= 5) {
            toast("error", t("Maximum 5 buttons allowed"));
            return;
        }

        // Encontrar la opción de botón por buttonId
        const buttonOption = buttonOptions.find(option => option.buttonId === buttonId);
        if (!buttonOption) {
            toast("error", t("Button type not found"));
            return;
        }

        const newButton: Button = {
            type: buttonOption.type,
            text: buttonOption.title,
            buttonId: buttonOption.buttonId
        };

        if (buttonOption.type === 'URL') {
            if (buttonOption.buttonId === 'confirm_attendance_rsvp') {
                // URL específica para RSVP
                newButton.url = `${window?.location?.origin}?pGuestEvent={{1}}`;
            } else {
                newButton.url = 'https://example.com';
            }
        }
        if (buttonOption.type === 'PHONE_NUMBER') newButton.phoneNumber = '+1234567890';
        if (buttonOption.type === 'WHATSAPP') newButton.phoneNumber = '+1234567890';

        setFieldValue('buttons', [...values?.buttons || [], newButton])
    };

    const isButtonDisabled = (buttonId: string) => {
        const currentButtons = values?.buttons || [];

        // Verificar si ya existe un botón con este buttonId específico
        // Solo para botones únicos (no quick_reply que se puede repetir)
        if (buttonId !== 'quick_reply') {
            const buttonExists = currentButtons.some(btn => btn.buttonId === buttonId);
            if (buttonExists) {
                return true; // Ya existe, deshabilitar
            }
        }

        // Obtener conteos por tipo
        const urlCount = currentButtons.filter(btn => btn.type === 'URL').length;
        const quickReplyCount = currentButtons.filter(btn => btn.type === 'QUICK_REPLY').length;
        const totalCount = currentButtons.length;

        // Reglas de combinaciones permitidas
        if (buttonId === 'quick_reply') {
            // Solo Quick Reply: máximo 3
            if (urlCount === 0 && quickReplyCount >= 3) {
                return true;
            }
            // Mezcla: máximo 2 total Y máximo 1 Quick Reply
            if (urlCount > 0 && (totalCount >= 2 || quickReplyCount >= 1)) {
                return true;
            }
        }

        if (buttonId === 'go_to_website' || buttonId === 'confirm_attendance_rsvp') {
            // Solo URL: máximo 2
            if (quickReplyCount === 0 && urlCount >= 2) {
                return true;
            }
            // Mezcla: máximo 2 total Y máximo 1 URL
            if (quickReplyCount > 0 && (totalCount >= 2 || urlCount >= 1)) {
                return true;
            }
        }

        return false;
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent, setFieldValue: any) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = active.id as number;
            const newIndex = over?.id as number;

            const currentButtons = [...(values?.buttons || [])];
            const newButtons = arrayMove(currentButtons, oldIndex, newIndex);
            setFieldValue('buttons', newButtons);
            toast("success", t("Button order updated"));
        }
    };

    const removeButton = (index: number, setFieldValue: any) => {
        values?.buttons.splice(index, 1)
        setFieldValue('buttons', [...values?.buttons || []])
    };

    const updateButton = (index: number, field: string, value: string, setFieldValue: any) => {
        setFieldValue(`buttons.${index}.${field}`, value);
    };


    const generateTemplateJson = (values: TemplateWathsappBusinessValues) => {
        values = { ...values, templateName: values.templateName.trim() }

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
        const components = [];
        const collectedExamplesMap: any = {};
        const processContentAndCollectExamples = (content: string) => {
            let newContent = content;
            const matches = content.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g);
            if (matches) {
                matches.forEach(match => {
                    const varInfo = variableMap[match];
                    if (varInfo) {
                        const metaPlaceholder = `{{${varInfo.id}}}`;
                        newContent = newContent.split(match).join(metaPlaceholder);
                        collectedExamplesMap[varInfo.id] = varInfo.sample;
                    }
                });
            }
            return newContent;
        };
        // Header
        if (values?.headerType?._id === 'text') {
            const finalHeaderContent = processContentAndCollectExamples(values.headerContent);
            components.push({
                type: 'HEADER',
                format: 'TEXT',
                text: finalHeaderContent,
            });
        } else if (values?.headerType?._id === 'image') {
            components.push({
                type: 'HEADER',
                format: 'IMAGE',
                example: {
                    header_handle: values.headerContent
                }
            });
        } else if (values?.headerType?._id === 'video') {
            components.push({
                type: 'HEADER',
                format: 'VIDEO',
                example: {
                    header_handle: values.headerContent
                }
            });
        }
        // Body
        const finalBodyContent = processContentAndCollectExamples(values.bodyContent);
        components.push({
            type: 'BODY',
            text: finalBodyContent,
        });
        // Footer
        if (values.footerContent.trim()) {
            components.push({
                type: 'FOOTER',
                text: values.footerContent.trim(),
            });
        }
        // Buttons
        if (values.buttons.length > 0) {
            const apiButtons = values.buttons.map(btn => {
                if (btn.type === 'URL') {
                    let processedUrl = btn.url || '';
                    const urlMatches = btn.url?.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g);
                    if (urlMatches) {
                        urlMatches.forEach(match => {
                            const varInfo = variableMap[match];
                            if (varInfo) {
                                const metaPlaceholder = `{{${varInfo.id}}}`;
                                processedUrl = processedUrl.split(match).join(metaPlaceholder);
                                collectedExamplesMap[varInfo.id] = varInfo.sample;
                            }
                        });
                        return {
                            type: 'URL',
                            text: btn.text,
                            url: processedUrl,
                            example: btn.example ? [btn.example] : undefined
                        };
                    } else {
                        return {
                            type: 'URL',
                            text: btn.text,
                            url: btn.url,
                        };
                    }
                } else if (btn.type === 'PHONE_NUMBER') {
                    return {
                        type: 'PHONE_NUMBER',
                        text: btn.text,
                        phone_number: btn.phoneNumber,
                    };
                } else if (btn.type === 'QUICK_REPLY') {
                    return {
                        type: 'QUICK_REPLY',
                        text: btn.text,
                    };
                } else if (btn.type === 'WHATSAPP') {
                    return {
                        type: 'PHONE_NUMBER',
                        text: btn.text,
                        phone_number: btn.phoneNumber,
                    };
                }
                return null;
            }).filter(Boolean);
            if (apiButtons.length > 0) {
                components.push({
                    type: 'BUTTONS',
                    buttons: apiButtons,
                });
            }
        }
        // Final examples array
        const finalExamplesArray = [];
        const maxVarId = Math.max(...Object.keys(collectedExamplesMap).map(Number), 0);
        for (let i = 1; i <= maxVarId; i++) {
            finalExamplesArray.push(collectedExamplesMap[i] || `Ejemplo Variable ${i}`);
        }
        const templateJson = {
            name: values.templateName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            language: values.language,
            category: values.category,
            components: components,
        };
        if (finalExamplesArray.length > 0) {
            const bodyComp = templateJson.components.find(comp => comp.type === 'BODY');
            if (bodyComp) {
                bodyComp.example = {
                    body_text: finalExamplesArray
                };
            }
        }
        setGeneratedJson(JSON.stringify(templateJson, null, 2));
        toast("success", t("Template JSON generated successfully"));
    };

    const handleSubmit = (values: TemplateWathsappBusinessValues, actions: any) => {
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
                                <HeaderTypeWatcher />
                                <TemplateNameWatcher />
                                <div className="text-gray-500 font-body flex flex-col gap-2 w-full">
                                    {/* Configuración de la Plantilla */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                                        <InputField
                                            name="templateName"
                                            label={t("templateName")}
                                            type="text"
                                            className="text-xs"
                                            size={6}
                                        />
                                        <SelectField
                                            name="language"
                                            label={t("Language")}
                                            options={[{ _id: "es", title: "ES" }, { _id: "en", title: "EN" }]}
                                            className="text-xs"
                                        />
                                        {/* <SelectField
                                            name="category"
                                            label={t("Category")}
                                            options={[{ _id: "utility", title: t("Utility") }, { _id: "marketing", title: t("Marketing") }, { _id: "authentication", title: t("Authentication") }]}
                                            className="text-xs"
                                        /> */}
                                    </div>
                                    {/* Header */}
                                    <div className="mb-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                                        <SelectField
                                            name="headerType"
                                            label={t("Header Type")}
                                            options={[
                                                { _id: "none", title: t("NONE") },
                                                { _id: "text", title: t("TEXT") },
                                                { _id: "image", title: t("IMAGE") },
                                                { _id: "image_event", title: t("IMAGE EVENT") },
                                                { _id: "video", title: t("VIDEO") }]}
                                            className="text-xs"
                                        />

                                        {values?.headerType?._id === 'text' && typeof values?.headerContent === 'string' && (
                                            <div>
                                                <InputField
                                                    name="headerContent"
                                                    label={t("Header Content (Text)")}
                                                    type="text"
                                                    maxLength={60}
                                                    className="text-xs"
                                                />

                                                <div className="flex items-center gap-2 mt-2">
                                                    <label className="text-[11px] font-medium text-gray-700">{t("Add Variable")}:</label>
                                                    <select
                                                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
                                                        onChange={(e) => handleVariableSelect(e, setFieldValue, 'headerContent')}
                                                        value=""
                                                        disabled={typeof values.headerContent === 'string' && values.headerContent.includes('{{params.')}
                                                    >
                                                        <option value="" disabled>{t("Select a variable")}</option>
                                                        {variables.map(v => (
                                                            <option key={v.id} value={v.value}>
                                                                {v.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                        {values?.headerType?._id === 'image' && (
                                            <div className="mt-2">
                                                <InputField
                                                    name="headerContent"
                                                    label={t("Image URL")}
                                                    type="text"
                                                    className="text-xs"
                                                />
                                            </div>
                                        )}
                                        {values?.headerType?._id === 'image_event' && (
                                            <div className="mt-2">
                                                <InputField
                                                    name="headerContent"
                                                    label={t("Image Event URL")}
                                                    type="text"
                                                    className="text-xs"
                                                    disabled={true}
                                                />
                                            </div>
                                        )}
                                        {values?.headerType?._id === 'video' && (
                                            <div className="mt-2">
                                                <InputField
                                                    name="headerContent"
                                                    label={t("Video URL")}
                                                    type="text"
                                                    className="text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {/* Body */}
                                    <div className="mb-2 relative">
                                        <label className="font-display text-sm text-primary w-full">{t("Message Body")}</label>
                                        <textarea
                                            name="bodyContent"
                                            rows={5}
                                            maxLength={1048}
                                            className="font-display text-xs text-gray-500 border border-gray-200 focus:border-gray-400 focus:ring-0 transition w-full py-2 px-4 rounded-xl focus:outline-none"
                                            value={values?.bodyContent || ''}
                                            onChange={(e) => setFieldValue('bodyContent', e.target.value)}
                                            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                            onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                        />
                                        <div className={`h-10 absolute bottom-9 right-2 flex items-center justify-center`}>
                                            <span id='masStr' className={`text-gray-500 text-xs`}>
                                                {values?.bodyContent?.length}/{1048}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[11px] font-medium text-gray-700">{t("Add Variable")}:</label>
                                            <select
                                                className="p-2 flex-1 md:mr-20 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                                    </div>
                                    {/* Footer */}
                                    <div className="mb-2">
                                        <InputField
                                            name="footerContent"
                                            label={t("Footer (Optional)")}
                                            type="text"
                                            maxLength={60}
                                            className="text-xs"
                                        />
                                        <p className="text-gray-500 text-[11px] mt-1">{t("The footer cannot contain variables.")}</p>
                                    </div>
                                    {/* Buttons */}
                                    <div className="mb-2">
                                        <div className="flex gap-2 items-end mb-4">
                                            <h2 className="text-sm font-semibold text-primary">{t("Buttons (Optional)")}</h2>
                                            <span className="text-[11px] text-gray-500">{t("Button combination rules")}</span>
                                        </div>
                                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <h3 className="text-xs font-semibold text-blue-800 mb-2">{t("Allowed combinations:")}</h3>
                                            <ul className="text-xs text-blue-700 space-y-1">
                                                <li>• {t("Only Quick Reply: max 3 buttons")}</li>
                                                <li>• {t("Only URL: max 2 buttons")}</li>
                                                <li>• {t("Mixed (URL + Quick Reply): max 2 buttons total")}</li>
                                            </ul>
                                        </div>
                                        <div id="buttons-container" className="flex space-x-2 mb-2">
                                            {buttonOptions.map((buttonOption, index) => {
                                                const getButtonColor = (type: string) => {
                                                    switch (type) {
                                                        case 'QUICK_REPLY':
                                                            return 'bg-emerald-500 hover:bg-emerald-600';
                                                        case 'URL':
                                                            return 'bg-sky-500 hover:bg-sky-600';
                                                        case 'PHONE_NUMBER':
                                                            return 'bg-amber-500 hover:bg-amber-600';
                                                        case 'WHATSAPP':
                                                            return 'bg-teal-500 hover:bg-teal-600';
                                                        default:
                                                            return 'bg-gray-500 hover:bg-gray-600';
                                                    }
                                                };
                                                const isDisabled = isButtonDisabled(buttonOption.buttonId);
                                                const disabledColor = 'bg-gray-400 cursor-not-allowed opacity-50';
                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => !isDisabled && addEmptyButton(buttonOption.buttonId, setFieldValue)}
                                                        disabled={isDisabled}
                                                        className={`w-1/3 flex flex-col items-center justify-center px-1 md:px-2 py-2 text-white rounded-md transition-colors text-[10px] md:text-[11px] ${isDisabled ? disabledColor : getButtonColor(buttonOption.type)
                                                            }`}
                                                        title={isDisabled ? t("Button combination limit reached") : buttonOption.description}
                                                    >
                                                        <span className="text-center text-[11px]">{buttonOption.title}</span>
                                                        <span className="text-center text-[10px]">{buttonOption.description}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={(event) => handleDragEnd(event, setFieldValue)}
                                        >
                                            <SortableContext
                                                items={values.buttons.map((_, index) => index)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {values.buttons.map((button, index) => (
                                                    <SortableButton
                                                        key={index}
                                                        button={button}
                                                        index={index}
                                                        setFieldValue={setFieldValue}
                                                        removeButton={removeButton}
                                                        t={t}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>
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
                        <WhatsappBusinessPreview values={{ ...values }} variableMap={variableMap} />
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
                `}
            </style>
        </div>
    );
};

const AutoSubmitToken = ({ setValues }) => {
    const { values } = useFormikContext<TemplateWathsappBusinessValues>();

    useEffect(() => {
        setValues(values)
    }, [values])

    return null;
};

const TemplateNameWatcher = () => {
    const { values, setFieldValue } = useFormikContext<TemplateWathsappBusinessValues>();
    useEffect(() => {
        const currentName = values.templateName || '';

        // Verificar si hay espacios
        if (currentName.includes(' ')) {
            const cleanedName = currentName.replace(" ", '_');
            setTimeout(() => {
                setFieldValue('templateName', cleanedName, false);
            }, 10);
        }
    }, [values.templateName, setFieldValue]);

    return null;
};

const HeaderTypeWatcher = () => {
    const { values, setFieldValue } = useFormikContext<TemplateWathsappBusinessValues>();
    const [prevHeaderType, setPrevHeaderType] = useState(values?.headerType?._id);
    const { event } = EventContextProvider();

    useEffect(() => {
        const currentHeaderType = values?.headerType?._id;

        // Si cambió el tipo de header
        if (currentHeaderType !== prevHeaderType) {
            // Limpiar headerContent cuando cambie el tipo
            setPrevHeaderType(currentHeaderType);
            setTimeout(() => {
                setFieldValue('headerContent', currentHeaderType === 'image_event' ? event?.imgEvento?.i1024 ? `${process.env.NEXT_PUBLIC_BASE_URL}${event?.imgEvento?.i1024}` : '' : '');
            }, 10);
        }
    }, [values?.headerType?._id, setFieldValue]);

    return null;
};