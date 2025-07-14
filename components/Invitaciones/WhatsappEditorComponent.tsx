import { FC, useEffect, useState } from 'react';

import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import i18next from "i18next";
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';
import { WhatsappPreview } from './WhatsappPreview';
import ButtonPrimary from './ButtonPrimary';


interface props {

}


export const WhatsappEditorComponent: FC<props> = ({ ...props }) => {
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();


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

    const [templateName, setTemplateName] = useState('');
    const [language, setLanguage] = useState('es');
    const [category, setCategory] = useState('UTILITY');
    const [headerType, setHeaderType] = useState('NONE'); // NONE, TEXT, IMAGE
    const [headerContent, setHeaderContent] = useState('');
    const [bodyContent, setBodyContent] = useState('');
    const [footerContent, setFooterContent] = useState('');
    const [buttons, setButtons] = useState([]);
    const [generatedJson, setGeneratedJson] = useState('');
    const [validationErrors, setValidationErrors] = useState<any>({});

    // Mapa para buscar información de variables por su 'value' (ej. "{{params.typeEvent}}")
    const [variableMap, setVariableMap] = useState<any>({});

    useEffect(() => {
        const map = {};
        variables.forEach(v => {
            map[v.value] = { id: v.id, name: v.name, sample: v.sample };
        });
        setVariableMap(map);
    }, []);


    const handleVariableSelect = (e) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            // Añade el 'value' de la variable (ej. {{params.typeEvent}}) al cuerpo
            setBodyContent(prev => prev + ` ${selectedValue}`);
            e.target.value = ""; // Resetea el select a la opción por defecto
        }
    };

    const addEmptyButton = (type) => {
        if (buttons.length >= 3) { // Meta permite hasta 3 botones de respuesta rápida o 2 de llamada a la acción/URL
            alert("Máximo 3 botones permitidos.");
            return;
        }
        setButtons(prev => {
            const newButton = { type, text: '', url: '', phoneNumber: '', example: '' };
            if (type === 'URL') newButton.url = 'https://example.com';
            if (type === 'PHONE_NUMBER') newButton.phoneNumber = '+1234567890';
            return [...prev, newButton];
        });
    };

    const updateButton = (index, field, value) => {
        setButtons(prev => prev.map((btn, i) =>
            i === index ? { ...btn, [field]: value } : btn
        ));
    };

    const removeButton = (index) => {
        setButtons(prev => prev.filter((_, i) => i !== index));
    };

    // Función de validación
    const validateForm = () => {
        const errors: any = {};
        if (!templateName.trim()) errors.templateName = 'El nombre de la plantilla es obligatorio.';
        if (!bodyContent.trim()) errors.bodyContent = 'El cuerpo del mensaje es obligatorio.';
        // Validar que las variables en el texto coincidan con las predefinidas
        const allTextVariables = [
            ...(bodyContent.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g) || []),
            ...(headerType === 'TEXT' ? (headerContent.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g) || []) : [])
        ];

        allTextVariables.forEach(v => {
            if (!variableMap[v]) {
                errors.variables = `La variable ${v} no está definida en la lista de variables permitidas.`;
            }
        });
        // Validar botones
        buttons.forEach((button, index) => {
            if (!button.text.trim()) {
                errors[`buttonText_${index}`] = 'El texto del botón es obligatorio.';
            }
            if (button.type === 'URL' && !button.url.trim()) {
                errors[`buttonUrl_${index}`] = 'La URL es obligatoria para botones de URL.';
            }
            if (button.type === 'PHONE_NUMBER' && !button.phoneNumber.trim()) {
                errors[`buttonPhone_${index}`] = 'El número de teléfono es obligatorio.';
            }
            // Validar variables en URL dinámica
            if (button.type === 'URL') {
                const urlVars = (button.url.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g) || []);
                urlVars.forEach(v => {
                    if (!variableMap[v]) {
                        errors[`buttonUrl_${index}`] = `La variable ${v} en la URL no está definida.`;
                    }
                });
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Función para generar el JSON de la plantilla
    const generateTemplateJson = () => {
        if (!validateForm()) {
            alert('Por favor, corrige los errores de validación antes de generar el JSON.');
            return;
        }
        const components = [];
        const collectedExamplesMap = {}; // Mapa para almacenar ejemplos por su ID de Meta (ej. {1: "sample1", 2: "sample2"})
        // Función auxiliar para procesar el contenido y reemplazar variables
        const processContentAndCollectExamples = (content) => {
            let newContent = content;
            const matches = content.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g);
            if (matches) {
                matches.forEach(match => {
                    const varInfo = variableMap[match];
                    if (varInfo) {
                        const metaPlaceholder = `{{${varInfo.id}}}`;
                        newContent = newContent.split(match).join(metaPlaceholder);
                        collectedExamplesMap[varInfo.id] = varInfo.sample; // Almacena el sample por su ID de Meta
                    }
                });
            }
            return newContent;
        };
        let finalHeaderContent = headerContent;
        if (headerType === 'TEXT') {
            finalHeaderContent = processContentAndCollectExamples(headerContent);
            components.push({
                type: 'HEADER',
                format: 'TEXT',
                text: finalHeaderContent,
            });
        } else if (headerType === 'IMAGE') {
            components.push({
                type: 'HEADER',
                format: 'IMAGE',
                example: {
                    header_handle: headerContent // Asume que headerContent es la URL o handle de la imagen
                }
            });
        }
        let finalBodyContent = processContentAndCollectExamples(bodyContent);
        components.push({
            type: 'BODY',
            text: finalBodyContent,
        });
        if (footerContent.trim()) {
            components.push({
                type: 'FOOTER',
                text: footerContent.trim(),
            });
        }
        if (buttons.length > 0) {
            const apiButtons = buttons.map(btn => {
                if (btn.type === 'URL') {
                    let processedUrl = btn.url;
                    const urlMatches = btn.url.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g);
                    if (urlMatches) {
                        urlMatches.forEach(match => {
                            const varInfo = variableMap[match];
                            if (varInfo) {
                                const metaPlaceholder = `{{${varInfo.id}}}`;
                                processedUrl = processedUrl.split(match).join(metaPlaceholder);
                                collectedExamplesMap[varInfo.id] = varInfo.sample; // Recopila el sample para la URL dinámica
                            }
                        });
                        return {
                            type: 'URL',
                            text: btn.text,
                            url: processedUrl, // URL con variables {{N}}
                            example: btn.example ? [btn.example] : undefined // Meta espera un array de ejemplos para URLs dinámicas
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
        // Crear el array final de ejemplos ordenado por ID de Meta
        const finalExamplesArray = [];
        const maxVarId = Math.max(...Object.keys(collectedExamplesMap).map(Number), 0);
        for (let i = 1; i <= maxVarId; i++) {
            finalExamplesArray.push(collectedExamplesMap[i] || `Ejemplo Variable ${i}`); // Fallback si falta un ID
        }
        const templateJson = {
            name: templateName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            language: language,
            category: category,
            components: components,
        };
        // Añadir los ejemplos al componente BODY o HEADER (si es texto)
        if (finalExamplesArray.length > 0) {
            const bodyComp = templateJson.components.find(comp => comp.type === 'BODY');
            if (bodyComp) {
                bodyComp.example = {
                    body_text: finalExamplesArray
                };
            }
            // Si el header es TEXTO y también tiene variables, sus ejemplos ya están en finalExamplesArray
            // Meta suele agrupar todos los ejemplos de texto en body_text.
        }
        setGeneratedJson(JSON.stringify(templateJson, null, 2));
    };

    return (
        <div className='relative w-full h-full'>

            <div className="min-h-screen bg-gray-100 p-8 font-inter flex flex-col md:flex-row gap-8">
                {/* Columna del Editor */}
                <div className="w-full md:w-1/2 bg-white p-8 rounded-xl shadow-lg">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800">Editor de Plantillas de WhatsApp</h1>
                        <p className="text-gray-600">Crea y genera el JSON para tus plantillas de mensaje de Meta.</p>
                    </header>

                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">Configuración de la Plantilla</h2>

                    {/* Mensajes de error de validación */}
                    {Object.keys(validationErrors).length > 0 && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">¡Errores de validación!</strong>
                            <ul className="mt-2 list-disc list-inside">
                                {Object.values(validationErrors).map((error, index) => (
                                    <li key={index}>{error as string}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label htmlFor="templateName" className="block text-xs font-medium text-gray-700 mb-1">Nombre de la Plantilla:</label>
                            <input
                                type="text"
                                id="templateName"
                                className={`w-full p-3 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.templateName ? 'border-red-500' : 'border-gray-300'}`}
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="ej. confirmacion_pedido"
                            />
                            {validationErrors.templateName && <p className="text-red-500 text-xs mt-1">{validationErrors.templateName}</p>}
                        </div>
                        <div>
                            <label htmlFor="language" className="block text-xs font-medium text-gray-700 mb-1">Idioma:</label>
                            <select
                                id="language"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="es">Español (es)</option>
                                <option value="en">Inglés (en)</option>
                                {/* Añadir más idiomas según sea necesario */}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-xs font-medium text-gray-700 mb-1">Categoría:</label>
                            <select
                                id="category"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="UTILITY">Utilidad</option>
                                <option value="MARKETING">Marketing</option>
                                <option value="AUTHENTICATION">Autenticación</option>
                            </select>
                        </div>
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-700 mb-6 mt-8">Contenido de la Plantilla</h2>

                    {/* Header */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <label htmlFor="headerType" className="block text-xs font-medium text-gray-700 mb-1">Tipo de Encabezado:</label>
                        <select
                            id="headerType"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                            value={headerType}
                            onChange={(e) => {
                                setHeaderType(e.target.value);
                                setHeaderContent(''); // Limpiar contenido al cambiar tipo
                            }}
                        >
                            <option value="NONE">Ninguno</option>
                            <option value="TEXT">Texto (con variables)</option>
                            <option value="IMAGE">Imagen (URL de ejemplo)</option>
                            {/* Puedes añadir VIDEO, DOCUMENT, LOCATION si tu editor los soporta */}
                        </select>

                        {headerType === 'TEXT' && (
                            <div>
                                <label htmlFor="headerContentText" className="block text-xs font-medium text-gray-700 mb-1">Contenido del Encabezado (Texto):</label>
                                <textarea
                                    id="headerContentText"
                                    className={`w-full p-3 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.headerContent ? 'border-red-500' : 'border-gray-300'}`}
                                    rows={2}
                                    value={headerContent}
                                    onChange={(e) => setHeaderContent(e.target.value)}
                                    placeholder="ej. ¡Hola {{params.nameGuest}}!"
                                ></textarea>
                                {validationErrors.headerContent && <p className="text-red-500 text-xs mt-1">{validationErrors.headerContent}</p>}
                            </div>
                        )}
                        {headerType === 'IMAGE' && (
                            <div>
                                <label htmlFor="headerContentImage" className="block text-xs font-medium text-gray-700 mb-1">URL de la Imagen (ejemplo):</label>
                                <input
                                    type="text"
                                    id="headerContentImage"
                                    className={`w-full p-3 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.headerContent ? 'border-red-500' : 'border-gray-300'}`}
                                    value={headerContent}
                                    onChange={(e) => setHeaderContent(e.target.value)}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                                <p className="text-gray-500 text-xs mt-1">Nota: En la API real, deberás subir la imagen a Meta y usar un `handle` o `uri`.</p>
                                {validationErrors.headerContent && <p className="text-red-500 text-xs mt-1">{validationErrors.headerContent}</p>}
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="mb-6">
                        <label htmlFor="bodyContent" className="block text-xs font-medium text-gray-700 mb-1">Cuerpo del Mensaje:</label>
                        <textarea
                            id="bodyContent"
                            className={`w-full p-3 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.bodyContent ? 'border-red-500' : 'border-gray-300'}`}
                            rows={5}
                            value={bodyContent}
                            onChange={(e) => setBodyContent(e.target.value)}
                            placeholder="ej. Su pedido #{{params.nameEvent}} ha sido confirmado y será enviado el {{params.dateEvent}}. ¡Gracias por su compra!"
                        ></textarea>
                        {validationErrors.bodyContent && <p className="text-red-500 text-xs mt-1">{validationErrors.bodyContent}</p>}
                        <div className="mt-2 flex items-center gap-2">
                            <label htmlFor="variableSelect" className="text-xs font-medium text-gray-700">Añadir Variable:</label>
                            <select
                                id="variableSelect"
                                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                onChange={handleVariableSelect}
                                value="" // Valor vacío para que siempre se pueda seleccionar la primera opción
                            >
                                <option value="" disabled>Selecciona una variable</option>
                                {variables.map(v => (
                                    <option key={v.id} value={v.value}>
                                        {v.name} ({v.value})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mb-6">
                        <label htmlFor="footerContent" className="block text-xs font-medium text-gray-700 mb-1">Pie de Página (Opcional):</label>
                        <textarea
                            id="footerContent"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            rows={2}
                            value={footerContent}
                            onChange={(e) => setFooterContent(e.target.value)}
                            placeholder="ej. Gracias por su preferencia."
                        ></textarea>
                        <p className="text-gray-500 text-xs mt-1">El pie de página no puede contener variables.</p>
                    </div>

                    {/* Buttons */}
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6 mt-8">Botones (Opcional)</h2>
                    <div className="mb-6">
                        <div className="flex space-x-2 mb-4">
                            <button
                                onClick={() => addEmptyButton('QUICK_REPLY')}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                            >
                                Añadir Respuesta Rápida
                            </button>
                            <button
                                onClick={() => addEmptyButton('URL')}
                                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                            >
                                Añadir Botón URL
                            </button>
                            <button
                                onClick={() => addEmptyButton('PHONE_NUMBER')}
                                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                            >
                                Añadir Botón de Llamada
                            </button>
                        </div>

                        {buttons.map((button, index) => (
                            <div key={index} className="mb-4 p-4 border border-gray-300 rounded-md bg-blue-50 relative">
                                <button
                                    onClick={() => removeButton(index)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    title="Eliminar botón"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 3a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">Botón {index + 1} ({button.type.replace('_', ' ')})</h3>
                                <div className="mb-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Texto del Botón:</label>
                                    <input
                                        type="text"
                                        className={`w-full p-2 border rounded-md ${validationErrors[`buttonText_${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                                        value={button.text}
                                        onChange={(e) => updateButton(index, 'text', e.target.value)}
                                        placeholder="ej. Ver Detalles"
                                    />
                                    {validationErrors[`buttonText_${index}`] && <p className="text-red-500 text-xs mt-1">{validationErrors[`buttonText_${index}`]}</p>}
                                </div>
                                {button.type === 'URL' && (
                                    <div className="mb-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">URL:</label>
                                        <input
                                            type="text"
                                            id="urlInput"
                                            className={`w-full p-2 border rounded-md ${validationErrors[`buttonUrl_${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                                            value={button.url}
                                            onChange={(e) => updateButton(index, 'url', e.target.value)}
                                            placeholder="ej. https://tudominio.com/pedido/{{params.nameEvent}}"
                                        />
                                        {validationErrors[`buttonUrl_${index}`] && <p className="text-red-500 text-xs mt-1">{validationErrors[`buttonUrl_${index}`]}</p>}
                                        <p className="text-gray-500 text-xs mt-1">Puedes usar variables como {'{{params.nameEvent}}'} para URLs dinámicas.</p>
                                        {/* Mostrar ejemplo de URL dinámica si contiene variables */}
                                        {button.url.includes('{{params.') && (
                                            <div className="mt-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Ejemplo de URL Dinámica:</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border border-gray-300 rounded-md text-xs"
                                                    value={button.example}
                                                    onChange={(e) => updateButton(index, 'example', e.target.value)}
                                                    placeholder="ej. https://tudominio.com/pedido/12345"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {button.type === 'PHONE_NUMBER' && (
                                    <div className="mb-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Número de Teléfono:</label>
                                        <input
                                            type="text"
                                            className={`w-full p-2 border rounded-md ${validationErrors[`buttonPhone_${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                                            value={button.phoneNumber}
                                            onChange={(e) => updateButton(index, 'phoneNumber', e.target.value)}
                                            placeholder="ej. +1234567890"
                                        />
                                        {validationErrors[`buttonPhone_${index}`] && <p className="text-red-500 text-xs mt-1">{validationErrors[`buttonPhone_${index}`]}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <ButtonPrimary onClick={generateTemplateJson} >
                        Generar JSON de Plantilla1
                    </ButtonPrimary>
                    {/* Área de visualización del JSON */}
                    {generatedJson && (
                        <div className="mt-8 pt-8 border-t-2 border-gray-200">
                            <h2 className="text-2xl font-semibold text-gray-700 mb-4">JSON Generado:</h2>
                            <pre className="bg-gray-800 text-white p-4 rounded-md text-xs overflow-x-auto">
                                <code>{generatedJson}</code>
                            </pre>
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedJson).then(() => alert('JSON copiado al portapapeles!'))}
                                className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                                Copiar JSON
                            </button>
                        </div>
                    )}
                </div>

                {/* Columna de la Vista Previa */}
                <WhatsappPreview
                    headerType={headerType}
                    headerContent={headerContent}
                    bodyContent={bodyContent}
                    footerContent={footerContent}
                    buttons={buttons}
                    variableMap={variableMap} // Pasamos el mapa de variables a la vista previa
                />
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
