import { Form, Formik, FormikValues, useField, useFormikContext } from "formik";
import { FC, useEffect, useState } from 'react';
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
}

interface ButtonOption {
    title: string;
    description: string;
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'WHATSAPP';
}

export interface TemplateWathsappValues {
    _id?: string;
    templateName: string;
    language: { _id: "es" | "en", title: string };
    category: { _id: "UTILITY" | "WEDDING", title: string };
    headerType: { _id: "none" | "text" | "image" | "video", title: string };
    headerContent: string;
    bodyContent: string;
    footerContent: string;
    buttons: Button[];
    createdAt?: Date;
    updatedAt?: Date;
}

interface props {
    setShowEditorModal: (value: boolean) => void
}

export const WhatsappBusinessEditorComponent: FC<props> = ({ setShowEditorModal, ...props }) => {
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const toast = useToast();
    const [values, setValues] = useState<TemplateWathsappValues>()
    const [cursorPosition, setCursorPosition] = useState(0)

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

    const buttonOptions: ButtonOption[] = [{
        title: t("Go to website"),
        description: t("2 buttons maximum"),
        type: "URL",
    },
    {
        title: t("Call on WhatsApp"),
        description: t("1 button maximum"),
        type: "WHATSAPP",
    },
    {
        title: t("Call phone number"),
        description: t("1 button maximum"),
        type: "PHONE_NUMBER",
    },
    {
        title: t("Quick reply"),
        description: t("5 buttons maximum"),
        type: "QUICK_REPLY",
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
        templateName: yup.string().required(t("Name required")),
        bodyContent: yup.string().required(t("Message body is required")),
        headerContent: yup.string().when('headerType', {
            is: (headerType: string) => headerType === 'TEXT' || headerType === 'IMAGE',
            then: (schema) => schema.required(t("Header content is required")),
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

    const initialValues: TemplateWathsappValues = {
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
            const currentContent = values?.[fieldName] || '';
            const beforeCursor = currentContent.substring(0, cursorPosition);
            const afterCursor = currentContent.substring(cursorPosition);
            const newContent = beforeCursor + selectedValue + afterCursor;
            setFieldValue(fieldName, newContent);
            // Actualizar la posición del cursor después de insertar la variable
            setCursorPosition(cursorPosition + selectedValue.length);
            e.target.value = "";
        }
    };

    const addEmptyButton = (type: Button['type'], setFieldValue: any) => {
        if (values?.buttons.length >= 5) {
            toast("error", t("Maximum 5 buttons allowed"));
            return;
        }

        // Encontrar el título correspondiente al tipo de botón
        const buttonOption = buttonOptions.find(option => option.type === type);
        const buttonTitle = buttonOption ? buttonOption.title : '';

        const newButton: Button = { type, text: buttonTitle };
        if (type === 'URL') newButton.url = 'https://example.com';
        if (type === 'PHONE_NUMBER') newButton.phoneNumber = '+1234567890';
        if (type === 'WHATSAPP') newButton.phoneNumber = '+1234567890';
        setFieldValue('buttons', [...values?.buttons || [], newButton])
    };

    const isButtonDisabled = (buttonType: string) => {
        const currentButtons = values?.buttons || [];
        const buttonCount = currentButtons.filter(btn => btn.type === buttonType).length;

        switch (buttonType) {
            case 'URL':
                return buttonCount >= 2; // Máximo 2 botones URL
            case 'WHATSAPP':
                return buttonCount >= 1; // Máximo 1 botón WhatsApp
            case 'PHONE_NUMBER':
                return buttonCount >= 1; // Máximo 1 botón PHONE_NUMBER
            case 'QUICK_REPLY':
                return buttonCount >= 5; // Máximo 5 botones QUICK_REPLY
            default:
                return false;
        }
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

    const generateTemplateJson = (values: TemplateWathsappValues) => {
        values = { ...values, templateName: values.templateName.trim() }
        console.log(100038, values)
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
        if (values.headerType._id === 'text') {
            const finalHeaderContent = processContentAndCollectExamples(values.headerContent);
            components.push({
                type: 'HEADER',
                format: 'TEXT',
                text: finalHeaderContent,
            });
        } else if (values.headerType._id === 'image') {
            components.push({
                type: 'HEADER',
                format: 'IMAGE',
                example: {
                    header_handle: values.headerContent
                }
            });
        } else if (values.headerType._id === 'video') {
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
                                            name="language"
                                            label={t("Language")}
                                            options={[{ _id: "es", title: "ES" }, { _id: "en", title: "EN" }]}
                                            className="text-xs"
                                        />
                                        <SelectField
                                            name="category"
                                            label={t("Category")}
                                            options={[{ _id: "utility", title: t("Utility") }, { _id: "marketing", title: t("Marketing") }, { _id: "authentication", title: t("Authentication") }]}
                                            className="text-xs"
                                        />
                                    </div>
                                    {/* Header */}
                                    <div className="mb-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                                        <SelectField
                                            name="headerType"
                                            label={t("Header Type")}
                                            options={[{ _id: "none", title: t("NONE") }, { _id: "text", title: t("TEXT") }, { _id: "image", title: t("IMAGE") }, { _id: "video", title: t("VIDEO") }]}
                                            className="text-xs"
                                        />

                                        {values.headerType._id === 'text' && (
                                            <div>
                                                <InputField
                                                    name="headerContent"
                                                    placeholder={t("Enter header content")}
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
                                                        disabled={values.headerContent.includes('{{params.')}
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
                                        {values.headerType._id === 'image' && (
                                            <div className="mt-2">
                                                <InputField
                                                    name="headerContent"
                                                    label={t("Image URL (example)")}
                                                    type="text"
                                                    placeholder={t("https://example.com/image.jpg")}
                                                    className="text-xs"
                                                />
                                                <p className="text-gray-500 text-[11px] mt-1">{t("Note: In the real API, you will need to upload the image to Meta and use a handle or uri.")}</p>
                                            </div>
                                        )}
                                        {values.headerType._id === 'video' && (
                                            <div className="mt-2">
                                                <InputField
                                                    name="headerContent"
                                                    label={t("Video URL (example)")}
                                                    type="text"
                                                    placeholder={t("https://example.com/video.mp4")}
                                                    className="text-xs"
                                                />
                                                <p className="text-gray-500 text-[11px] mt-1">{t("Note: In the real API, you will need to upload the video to Meta and use a handle or uri.")}</p>
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
                                            placeholder={t("e.g. Your order #{{params.nameEvent}} has been confirmed and will be shipped on {{params.dateEvent}}. Thank you for your purchase!")}
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
                                                disabled={values?.bodyContent?.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g).length > 5}
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
                                            placeholder={t("Enter header content")}
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
                                            <span className="text-[11px] text-gray-500">{t("You can add up to 5 buttons")}</span>
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
                                                const isDisabled = isButtonDisabled(buttonOption.type);
                                                const disabledColor = 'bg-gray-400 cursor-not-allowed opacity-50';
                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => !isDisabled && addEmptyButton(buttonOption.type, setFieldValue)}
                                                        disabled={isDisabled}
                                                        className={`w-1/3 flex flex-col items-center justify-center px-1 md:px-2 py-2 text-white rounded-md transition-colors text-[10px] md:text-[11px] ${isDisabled ? disabledColor : getButtonColor(buttonOption.type)
                                                            }`}
                                                        title={isDisabled ? t("Maximum limit reached for this button type") : buttonOption.description}
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