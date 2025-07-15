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

interface Button {
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
    example?: string;
}

interface TemplateFormValues {
    templateName: string;
    language: { _id: string, title: string };
    category: { _id: string, title: string };
    headerType: { _id: string, title: string };
    headerContent: string;
    bodyContent: string;
    footerContent: string;
    buttons: Button[];
}

interface props {
    // Props específicas si las hay
}

export const WhatsappEditorComponent: FC<props> = ({ ...props }) => {
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const toast = useToast();
    const [values, setValues] = useState<TemplateFormValues>()
    const [cursorPosition, setCursorPosition] = useState(0)

    const variables = [
        { id: 1, name: "tipo de evento", value: "{{params.typeEvent}}", sample: "CUMPLEAÑOS" },
        { id: 2, name: "nombre del evento", value: "{{params.nameEvent}}", sample: "FIESTA DE JAFET" },
        { id: 3, name: "invitado", value: "{{params.nameGuest}}", sample: "Juan Pérez" },
        { id: 4, name: "fecha", value: "{{params.dateEvent}}", sample: "25/12/2025" },
        { id: 5, name: "estilo", value: "{{params.styleEvent}}", sample: "MODERNO" },
        { id: 6, name: "tematica", value: "{{params.themeEvent}}", sample: "NAVIDAD" },
        { id: 7, name: "usuario_nombre", value: "{{params.userEvent}}", sample: "Jafet" },
        { id: 8, name: "imgEvento", value: "{{params.imgEvent}}", sample: "https://placehold.co/600x200/ADD8E6/000000?text=Imagen+del+Evento" },
        { id: 9, name: "lugar", value: "{{params.placeEvent}}", sample: "Salón de Fiestas 'El Gran Salón'" },
    ];

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
        templateName: yup.string().required(t("El nombre de la plantilla es obligatorio")),
        bodyContent: yup.string().required(t("El cuerpo del mensaje es obligatorio")),
        headerContent: yup.string().when('headerType', {
            is: (headerType: string) => headerType === 'TEXT' || headerType === 'IMAGE',
            then: (schema) => schema.required(t("El contenido del encabezado es obligatorio")),
            otherwise: (schema) => schema.optional(),
        }),
        buttons: yup.array().of(
            yup.object().shape({
                text: yup.string().required(t("El texto del botón es obligatorio")),
                url: yup.string().when('type', {
                    is: 'URL',
                    then: (schema) => schema.required(t("La URL es obligatoria para botones de URL")),
                    otherwise: (schema) => schema.optional(),
                }),
                phoneNumber: yup.string().when('type', {
                    is: 'PHONE_NUMBER',
                    then: (schema) => schema.required(t("El número de teléfono es obligatorio")),
                    otherwise: (schema) => schema.optional(),
                }),
            })
        ),
    });

    const initialValues: TemplateFormValues = {
        templateName: '',
        language: { _id: "es", title: "ES" },
        category: { _id: "UTILITY", title: "UTILITY" },
        headerType: { _id: "none", title: "NONE" },
        headerContent: '',
        bodyContent: '',
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
        if (values?.buttons.length >= 3) {
            toast("error", t("Máximo 3 botones permitidos"));
            return;
        }
        const newButton: Button = { type, text: '', example: '' };
        if (type === 'URL') newButton.url = 'https://example.com';
        if (type === 'PHONE_NUMBER') newButton.phoneNumber = '+1234567890';
        setFieldValue('buttons', [...values?.buttons || [], newButton])
    };

    const removeButton = (index: number, setFieldValue: any) => {
        values?.buttons.splice(index, 1)
        setFieldValue('buttons', [...values?.buttons || []])
    };

    const updateButton = (index: number, field: string, value: string, setFieldValue: any) => {
        setFieldValue(`buttons.${index}.${field}`, value);
    };

    const generateTemplateJson = (values: TemplateFormValues) => {
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
        toast("success", t("JSON de plantilla generado exitosamente"));
    };

    const handleSubmit = async (values: TemplateFormValues, actions: any) => {
        try {
            generateTemplateJson(values);
        } catch (error) {
            toast("error", `${t("Ha ocurrido un error")} ${error}`);
            console.log(error);
        } finally {
            actions.setSubmitting(false);
        }
    };

    useEffect(() => {
        console.log(100039, values?.buttons)
    }, [values?.buttons])


    return (
        <div className='relative w-full h-full flex flex-col'>
            <div className="w-full h-[38px] bg-white border-b-[1px] border-gray-300">
                algo
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
                                {/* <div className="border-l-2 border-gray-100 pl-3 my-2 w-full">
                                    <h2 className="font-display text-3xl capitalize text-primary font-light">
                                        {t("create")}
                                    </h2>
                                    <h2 className="font-display text-5xl capitalize text-gray-500 font-medium">
                                        {t("WhatsApp Template")}
                                    </h2>
                                </div> */}

                                <div className="text-gray-500 font-body flex flex-col gap-2 w-full">
                                    {/* Configuración de la Plantilla */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <InputField
                                            name="templateName"
                                            label={t("Template Name")}
                                            type="text"
                                            placeholder="ej. confirmacion_pedido"
                                        />
                                        <SelectField
                                            name="language"
                                            label={t("Language")}
                                            options={[{ _id: "es", title: "ES" }, { _id: "en", title: "EN" }]}
                                        />
                                        <SelectField
                                            name="category"
                                            label={t("Category")}
                                            options={[{ _id: "utility", title: t("Utility") }, { _id: "marketing", title: t("Marketing") }, { _id: "authentication", title: t("Authentication") }]}
                                        />
                                    </div>

                                    {/* Header */}
                                    <div className="mb-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                                        <SelectField
                                            name="headerType"
                                            label={t("Header Type")}
                                            options={[{ _id: "none", title: t("NONE") }, { _id: "text", title: t("TEXT") }, { _id: "image", title: t("IMAGE") }]}
                                        />

                                        {values.headerType._id === 'text' && (
                                            <div>
                                                <label className="font-display text-sm text-primary w-full">{t("Header Content (Text)")}</label>
                                                <textarea
                                                    name="headerContent"
                                                    rows={2}
                                                    placeholder="ej. ¡Hola {{params.nameGuest}}!"
                                                    className="font-display text-sm text-gray-500 border border-gray-200 focus:border-gray-400 focus:ring-0 transition w-full py-2 px-4 rounded-xl focus:outline-none"
                                                    value={values?.headerContent || ''}
                                                    onChange={(e) => setFieldValue('headerContent', e.target.value)}
                                                    onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                                    onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                                    onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-medium text-gray-700">{t("Add Variable")}:</label>
                                                    <select
                                                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        onChange={(e) => handleVariableSelect(e, setFieldValue, 'headerContent')}
                                                        value=""
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
                                                    placeholder="https://ejemplo.com/imagen.jpg"
                                                />
                                                <p className="text-gray-500 text-xs mt-1">{t("Note: In the real API, you will need to upload the image to Meta and use a handle or uri.")}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="mb-2">
                                        <label className="font-display text-sm text-primary w-full">{t("Message Body")}</label>
                                        <textarea
                                            name="bodyContent"
                                            rows={5}
                                            placeholder="ej. Su pedido #{{params.nameEvent}} ha sido confirmado y será enviado el {{params.dateEvent}}. ¡Gracias por su compra!"
                                            className="font-display text-sm text-gray-500 border border-gray-200 focus:border-gray-400 focus:ring-0 transition w-full py-2 px-4 rounded-xl focus:outline-none"
                                            value={values?.bodyContent || ''}
                                            onChange={(e) => setFieldValue('bodyContent', e.target.value)}
                                            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                            onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                                        />
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-gray-700">{t("Add Variable")}:</label>
                                            <select
                                                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                onChange={(e) => handleVariableSelect(e, setFieldValue, 'bodyContent')}
                                                value=""
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
                                        <label className="font-display text-sm text-primary w-full">{t("Footer (Optional)")}</label>
                                        <textarea
                                            name="footerContent"
                                            rows={2}
                                            placeholder="ej. Gracias por su preferencia."
                                            className="font-display text-sm text-gray-500 border border-gray-200 focus:border-gray-400 focus:ring-0 transition w-full py-2 px-4 rounded-xl focus:outline-none"
                                            value={values?.footerContent || ''}
                                            onChange={(e) => setFieldValue('footerContent', e.target.value)}
                                        />
                                        <p className="text-gray-500 text-xs mt-1">{t("The footer cannot contain variables.")}</p>
                                    </div>

                                    {/* Buttons */}
                                    <div className="mb-2">
                                        <h2 className="text-2xl font-semibold text-gray-700 mb-4 mt-8">{t("Buttons (Optional)")}</h2>
                                        <div className="flex space-x-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => addEmptyButton('QUICK_REPLY', setFieldValue)}
                                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                            >
                                                {t("Add Quick Reply")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addEmptyButton('URL', setFieldValue)}
                                                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                                            >
                                                {t("Add URL Button")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addEmptyButton('PHONE_NUMBER', setFieldValue)}
                                                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                                            >
                                                {t("Add Call Button")}
                                            </button>
                                        </div>

                                        {values.buttons.map((button, index) => (
                                            <div key={index} className="mb-2 p-4 border border-gray-300 rounded-md bg-blue-50 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => removeButton(index, setFieldValue)}
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                                    title={t("Remove button")}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 3a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <h3 className="text-lg font-medium text-gray-800 mb-2">{t("Button")} {index + 1} ({button.type.replace('_', ' ')})</h3>

                                                <div className="mb-2">
                                                    <InputField
                                                        name={`buttons.${index}.text`}
                                                        label={t("Button Text")}
                                                        type="text"
                                                        placeholder="ej. Ver Detalles"
                                                    />
                                                </div>

                                                {button.type === 'URL' && (
                                                    <div className="mb-2">
                                                        <InputField
                                                            name={`buttons.${index}.url`}
                                                            label={t("URL")}
                                                            type="text"
                                                            placeholder="ej. https://tudominio.com/pedido/{{params.nameEvent}}"
                                                        />
                                                        <p className="text-gray-500 text-xs mt-1">{t("You can use variables like {{params.nameEvent}} for dynamic URLs.")}</p>

                                                        {button.url?.includes('{{params.') && (
                                                            <div className="mt-2">
                                                                <InputField
                                                                    name={`buttons.${index}.example`}
                                                                    label={t("Dynamic URL Example")}
                                                                    type="text"
                                                                    placeholder="ej. https://tudominio.com/pedido/12345"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {button.type === 'PHONE_NUMBER' && (
                                                    <div className="mb-2">
                                                        <InputField
                                                            name={`buttons.${index}.phoneNumber`}
                                                            label={t("Phone Number")}
                                                            type="text"
                                                            placeholder="ej. +1234567890"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
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
                                onClick={() => navigator.clipboard.writeText(generatedJson).then(() => toast("success", t("JSON copied to clipboard!")))}
                                className="mt-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                                {t("Copy JSON")}
                            </button>
                        </div>
                    )}
                </div>

                {/* Columna de la Vista Previa */}
                {values && (
                    <div className="flex-1 h-full hidden md:flex justify-center items-center">
                        <WhatsappPreview
                            headerType={values.headerType ?? 'NONE'}
                            headerContent={values.headerContent ?? ''}
                            bodyContent={values.bodyContent ?? ''}
                            footerContent={values.footerContent ?? ''}
                            buttons={values.buttons ?? []}
                            variableMap={variableMap}
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