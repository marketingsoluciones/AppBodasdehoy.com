'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface PromptTemplate {
  category: 'system' | 'user' | 'assistant' | 'commercial' | 'emotional' | 'technical';
  content: string;
  createdAt: string;
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  priority: number;
  updatedAt: string;
  variables: string[];
}

const getCategoryConfig = (category: string) => {
  const configs = {
    assistant: { color: 'bg-green-100 text-green-700', icon: '🤖', name: 'Asistente' },
    commercial: { color: 'bg-purple-100 text-purple-700', icon: '💰', name: 'Comercial' },
    emotional: { color: 'bg-pink-100 text-pink-700', icon: '❤️', name: 'Emocional' },
    system: { color: 'bg-gray-100 text-gray-700', icon: '⚙️', name: 'Sistema' },
    technical: { color: 'bg-orange-100 text-orange-700', icon: '🔧', name: 'Técnico' },
    user: { color: 'bg-blue-100 text-blue-700', icon: '👤', name: 'Usuario' },
  };
  return configs[category as keyof typeof configs] || configs.system;
};

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const loadPrompts = useCallback(() => {
    // Prompts de ejemplo
    const mockPrompts: PromptTemplate[] = [
      {
        category: 'system',
        content: `Eres un asistente especializado en organización de eventos. Tu objetivo es ayudar a los usuarios a planificar y gestionar sus eventos de manera eficiente y amigable.

CAPACIDADES:
- Crear y gestionar eventos (bodas, cumpleaños, corporativos)
- Gestionar invitados y confirmaciones
- Controlar presupuestos y gastos
- Organizar mesas y distribución
- Generar reportes y estadísticas

COMPORTAMIENTO:
- Sé amable, empático y profesional
- Usa lenguaje claro y conciso
- Anticipa necesidades del usuario
- Ofrece sugerencias proactivas
- Confirma acciones importantes`,
        createdAt: '2024-01-01T00:00:00Z',
        description: 'Prompt principal del sistema que define el comportamiento general de la IA',
        id: 'p1',
        isActive: true,
        name: 'Sistema Base',
        priority: 1,
        updatedAt: '2024-01-10T00:00:00Z',
        variables: [],
      },
      {
        category: 'commercial',
        content: `Hola! 👋

Gracias por tu interés en nuestro servicio de organización de eventos.

Tenemos diferentes planes según tus necesidades:

**Plan Básico** (Gratuito)
- Gestión de eventos ilimitados
- Hasta 50 invitados por evento
- Herramientas básicas de organización

**Plan Pro** (€19.99/mes)
- Invitados ilimitados
- Presupuesto avanzado
- Reportes y estadísticas
- Soporte prioritario

**Plan Enterprise** (Consultar)
- Todo lo del Plan Pro
- Múltiples organizadores
- Integraciones personalizadas
- Gestor de cuenta dedicado

¿Te gustaría más información sobre algún plan en particular?`,
        createdAt: '2024-01-05T00:00:00Z',
        description: 'Template para consultas sobre precios y planes',
        id: 'p2',
        isActive: true,
        name: 'Respuesta Comercial',
        priority: 2,
        updatedAt: '2024-01-05T00:00:00Z',
        variables: [],
      },
      {
        category: 'emotional',
        content: `Entiendo perfectamente cómo te sientes. Organizar {event_type} es un momento muy especial pero también puede ser estresante.

Estoy aquí para ayudarte a que este proceso sea más sencillo y disfrutable. Vamos paso a paso:

1. ¿Qué es lo que más te preocupa en este momento?
2. Podemos priorizar juntos las tareas más importantes
3. Te ayudaré a organizar todo de forma clara y manejable

No estás solo en esto. Cuéntame qué necesitas y lo resolvemos juntos. 💙`,
        createdAt: '2024-01-08T00:00:00Z',
        description: 'Para usuarios que expresan estrés o preocupación',
        id: 'p3',
        isActive: true,
        name: 'Soporte Emocional',
        priority: 3,
        updatedAt: '2024-01-08T00:00:00Z',
        variables: ['event_type'],
      },
    ];

    setPrompts(mockPrompts);
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleSave = useCallback(() => {
    if (!selectedPrompt) return;

    setPrompts((prev) =>
      prev.map((p) =>
        p.id === selectedPrompt.id ? { ...selectedPrompt, updatedAt: new Date().toISOString() } : p,
      ),
    );
    setIsEditing(false);
    alert('Prompt guardado exitosamente');
  }, [selectedPrompt]);

  const handleToggleActive = useCallback((id: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  }, []);

  const filteredPrompts = useMemo(
    () => (selectedCategory ? prompts.filter((p) => p.category === selectedCategory) : prompts),
    [selectedCategory, prompts],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💬 Configuración de Prompts</h1>
        <p className="mt-2 text-gray-600">
          Gestiona templates y comportamiento de la IA
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">Total Prompts</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{prompts.length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="text-sm text-gray-600">Activos</div>
          <div className="mt-2 text-2xl font-bold text-green-700">
            {prompts.filter(p => p.isActive).length}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="text-sm text-gray-600">Categorías</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">
            {new Set(prompts.map(p => p.category)).size}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="text-sm text-gray-600">Con Variables</div>
          <div className="mt-2 text-2xl font-bold text-purple-700">
            {prompts.filter(p => p.variables.length > 0).length}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setSelectedCategory('')}
          type="button"
        >
          Todas
        </button>
        {['system', 'commercial', 'emotional', 'technical'].map((cat) => {
          const config = getCategoryConfig(cat);
          return (
            <button
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              type="button"
            >
              <span>{config.icon}</span>
              <span>{config.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Prompts List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Templates Disponibles</h2>
          {filteredPrompts.map((prompt) => {
            const config = getCategoryConfig(prompt.category);
            return (
              <button
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  selectedPrompt?.id === prompt.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                key={prompt.id}
                onClick={() => {
                  setSelectedPrompt(prompt);
                  setIsEditing(false);
                }}
                type="button"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
                        {config.name}
                      </span>
                      {prompt.isActive && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          ✓ Activo
                        </span>
                      )}
                      {prompt.variables.length > 0 && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {prompt.variables.length} vars
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold text-gray-900">{prompt.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{prompt.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Prompt Editor */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {selectedPrompt ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedPrompt.name}</h2>
                <div className="flex gap-2">
                  <button
                    className={`rounded-lg px-3 py-1 text-sm font-medium ${
                      selectedPrompt.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => handleToggleActive(selectedPrompt.id)}
                    type="button"
                  >
                    {selectedPrompt.isActive ? '✓ Activo' : 'Inactivo'}
                  </button>
                  {isEditing ? (
                    <>
                      <button
                        className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                        onClick={handleSave}
                        type="button"
                      >
                        💾 Guardar
                      </button>
                      <button
                        className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsEditing(false)}
                        type="button"
                      >
                        ✕ Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsEditing(true)}
                      type="button"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contenido</label>
                {isEditing ? (
                  <textarea
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                    onChange={(e) => setSelectedPrompt({ ...selectedPrompt, content: e.target.value })}
                    rows={15}
                    value={selectedPrompt.content}
                  />
                ) : (
                  <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm">
                    {selectedPrompt.content}
                  </pre>
                )}
              </div>

              {selectedPrompt.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Variables</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedPrompt.variables.map((variable, i) => (
                      <span
                        className="rounded-full bg-purple-100 px-3 py-1 text-sm font-mono text-purple-700"
                        key={i}
                      >
                        {`{${variable}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <strong>Creado:</strong>{' '}
                  {new Date(selectedPrompt.createdAt).toLocaleString('es-ES')}
                </div>
                <div>
                  <strong>Actualizado:</strong>{' '}
                  {new Date(selectedPrompt.updatedAt).toLocaleString('es-ES')}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Selecciona un prompt para ver y editar su contenido
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

