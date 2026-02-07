import React, { useState } from 'react';
import { Send, Mail, Loader2, Copy, Check } from 'lucide-react';

const EmailTemplateGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  // Contexto base que se añadirá a todos los prompts
  const baseContext = "Eres un experto en diseño de plantillas de correo electrónico HTML. Tu tarea es generar código HTML para plantillas de correo que incluyan etiquetas dinámicas para personalización. Las etiquetas dinámicas deben estar en formato {{variable}} para ser reemplazadas programáticamente. El HTML debe ser compatible con clientes de correo y usar estilos inline. Incluye estilos CSS inline para máxima compatibilidad. Haz el diseño atractivo y profesional. Solicitud del usuario: ";

  const callAnthropicAPI = async (userPrompt) => {
    if (!apiKey) {
      setError('Por favor ingresa tu API Key de Anthropic');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: baseContext + userPrompt
            }
          ]
        })
      });
      console.log(response)
      if (!response.ok) {
        throw new Error(`Error API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      let generatedTemplate = '';
      if (data && data.content && Array.isArray(data.content) && data.content[0]?.text) {
        generatedTemplate = data.content[0].text;
      } else if (typeof data.content === 'string') {
        generatedTemplate = data.content;
      } else {
        generatedTemplate = JSON.stringify(data);
      }
      setResponse(generatedTemplate);
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Error llamando a la API:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim()) {
      setError('Por favor ingresa una descripción de la plantilla');
      return;
    }
    callAnthropicAPI(prompt);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
    }
  };

  // Ejemplos de prompts predefinidos
  const examplePrompts = [
    "dame el codigo html para una plantilla de correo electronico para invitar a una boda que incluya las etiquetas dinamicas {{nombre_invitado}}, {{fecha}}, {{lugar}}",
    "crea una plantilla de correo para confirmación de compra que incluya {{nombre_cliente}}, {{numero_pedido}}, {{total}}, {{productos}}",
    "genera una plantilla de newsletter que incluya {{nombre_suscriptor}}, {{titulo_articulo}}, {{resumen}}, {{enlace}}",
    "diseña una plantilla de bienvenida que incluya {{nombre_usuario}}, {{empresa}}, {{beneficios}}"
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-8">
          <Mail className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">
            Generador de Plantillas de Correo
          </h1>
        </div>

        {/* API Key Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key de Anthropic
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Tu API Key de Anthropic"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tu API key se usa solo para esta sesión y no se almacena
          </p>
        </div>

        {/* Input Form */}
        <div className="mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe la plantilla de correo que necesitas
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ejemplo: dame el codigo html para una plantilla de correo electronico para invitar a una boda que incluya las etiquetas dinamicas {{nombre_invitado}}, {{fecha}}, {{lugar}}"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !apiKey}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>{loading ? 'Generando...' : 'Generar Plantilla'}</span>
          </button>
        </div>

        {/* Ejemplos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Ejemplos de prompts:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 border border-gray-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                Plantilla Generada
              </h3>
              <button
                onClick={copyToClipboard}
                disabled={!response}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {copied ? 'Copiado!' : 'Copiar'}
                </span>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-x-auto">
                {response}
              </pre>
            </div>

            {/* Preview (si el contenido es HTML) */}
            {(response.includes('<html>') || response.includes('<!DOCTYPE')) && (
              <div className="mt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Vista Previa
                </h4>
                <div className="border rounded-lg p-4 bg-white">
                  <iframe
                    srcDoc={response}
                    className="w-full h-96 border rounded"
                    title="Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            Cómo usar las etiquetas dinámicas:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Las etiquetas aparecen como <code>{"{{variable}}"}</code></li>
            <li>• Reemplázalas programáticamente con datos reales</li>
            {/* <li>• Ejemplo: <code>{"{{nombre_invitado}}"}</code>  "Juan Pérez"</li> */}
            <li>• Usa la plantilla generada en tu aplicación de correo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateGenerator;