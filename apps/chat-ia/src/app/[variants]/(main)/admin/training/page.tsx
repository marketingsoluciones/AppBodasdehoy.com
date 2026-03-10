'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface TrainingQuestion {
  category: 'basic' | 'emotional' | 'technical' | 'commercial';
  context?: string;
  createdAt: string;
  expectedAnswer: string;
  id: string;
  question: string;
  tags: string[];
}

const STORAGE_KEY = 'bodas_training_questions';

const defaultQuestions: TrainingQuestion[] = [
  {
    category: 'basic',
    context: 'Funcionalidad básica de creación',
    createdAt: new Date().toISOString(),
    expectedAnswer:
      'Para crear un evento, solo dime el tipo (boda, cumpleaños, etc), la fecha y el nombre. Yo me encargo del resto.',
    id: 'q1',
    question: '¿Cómo puedo crear un evento?',
    tags: ['eventos', 'crear', 'básico'],
  },
  {
    category: 'emotional',
    context: 'Soporte emocional',
    createdAt: new Date().toISOString(),
    expectedAnswer:
      'Entiendo perfectamente que puedes sentirte abrumado. Organizar una boda es un momento importante y puede generar estrés. Estoy aquí para ayudarte paso a paso y hacer este proceso más sencillo. ¿En qué puedo ayudarte primero?',
    id: 'q2',
    question: 'Estoy muy estresado con la organización de mi boda',
    tags: ['estrés', 'empatía', 'apoyo'],
  },
  {
    category: 'technical',
    context: 'Explicación técnica',
    createdAt: new Date().toISOString(),
    expectedAnswer:
      'MCP (Model Context Protocol) es un sistema que me permite acceder a herramientas específicas para gestionar eventos, invitados, presupuestos, etc. Funciona como extensiones que amplían mis capacidades.',
    id: 'q3',
    question: '¿Qué es un MCP y cómo funciona?',
    tags: ['mcp', 'técnico', 'arquitectura'],
  },
  {
    category: 'commercial',
    context: 'Consulta comercial',
    createdAt: new Date().toISOString(),
    expectedAnswer:
      'Nuestro servicio tiene diferentes planes según tus necesidades. El plan básico incluye gestión de eventos e invitados. ¿Te gustaría que te explique las opciones disponibles?',
    id: 'q4',
    question: '¿Cuánto cuesta vuestro servicio?',
    tags: ['precio', 'comercial', 'planes'],
  },
];

function loadFromStorage(): TrainingQuestion[] {
  if (typeof window === 'undefined') return defaultQuestions;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return defaultQuestions;
}

function saveToStorage(questions: TrainingQuestion[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  } catch { /* ignore */ }
}

const getCategoryConfig = (category: string) => {
  const configs = {
    basic: { color: 'bg-blue-100 text-blue-700', icon: '📚', name: 'Básicas' },
    commercial: { color: 'bg-green-100 text-green-700', icon: '💰', name: 'Comerciales' },
    emotional: { color: 'bg-pink-100 text-pink-700', icon: '❤️', name: 'Emocionales' },
    technical: { color: 'bg-purple-100 text-purple-700', icon: '⚙️', name: 'Técnicas' },
  };
  return configs[category as keyof typeof configs] || configs.basic;
};

export default function TrainingPage() {
  const [questions, setQuestions] = useState<TrainingQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState<{
    category: TrainingQuestion['category'];
    context: string;
    expectedAnswer: string;
    question: string;
    tags: string;
  }>({
    category: 'basic',
    context: '',
    expectedAnswer: '',
    question: '',
    tags: '',
  });

  const loadQuestions = useCallback(() => {
    setQuestions(loadFromStorage());
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAddQuestion = useCallback(() => {
    if (!newQuestion.question || !newQuestion.expectedAnswer) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const question: TrainingQuestion = {
      category: newQuestion.category,
      context: newQuestion.context,
      createdAt: new Date().toISOString(),
      expectedAnswer: newQuestion.expectedAnswer,
      id: `q_${Date.now()}`,
      question: newQuestion.question,
      tags: newQuestion.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    setQuestions((prev) => {
      const next = [...prev, question];
      saveToStorage(next);
      return next;
    });
    setNewQuestion({
      category: 'basic',
      context: '',
      expectedAnswer: '',
      question: '',
      tags: '',
    });
    setIsAddingNew(false);
  }, [newQuestion]);

  const handleDeleteQuestion = useCallback(
    (id: string) => {
      if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
        setQuestions((prev) => {
          const next = prev.filter((q) => q.id !== id);
          saveToStorage(next);
          return next;
        });
      }
    },
    []
  );

  const filteredQuestions = useMemo(
    () => (selectedCategory ? questions.filter((q) => q.category === selectedCategory) : questions),
    [questions, selectedCategory]
  );

  const categoryCounts = useMemo(
    () => ({
      basic: questions.filter((q) => q.category === 'basic').length,
      commercial: questions.filter((q) => q.category === 'commercial').length,
      emotional: questions.filter((q) => q.category === 'emotional').length,
      technical: questions.filter((q) => q.category === 'technical').length,
    }),
    [questions]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎓 Training Panel - Entrenamiento IA</h1>
          <p className="mt-2 text-gray-600">
            Gestiona preguntas y respuestas para mejorar el comportamiento de la IA
          </p>
        </div>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setIsAddingNew(true)}
          type="button"
        >
          ➕ Nueva Pregunta
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">Total Preguntas</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{questions.length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="text-sm text-gray-600">📚 Básicas</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">{categoryCounts.basic}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-pink-50 to-pink-100 p-4">
          <div className="text-sm text-gray-600">❤️ Emocionales</div>
          <div className="mt-1 text-2xl font-bold text-pink-700">{categoryCounts.emotional}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="text-sm text-gray-600">⚙️ Técnicas</div>
          <div className="mt-1 text-2xl font-bold text-purple-700">{categoryCounts.technical}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="text-sm text-gray-600">💰 Comerciales</div>
          <div className="mt-1 text-2xl font-bold text-green-700">{categoryCounts.commercial}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setSelectedCategory('')}
          type="button"
        >
          Todas ({questions.length})
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setSelectedCategory('basic')}
          type="button"
        >
          📚 Básicas ({categoryCounts.basic})
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === 'emotional' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setSelectedCategory('emotional')}
          type="button"
        >
          ❤️ Emocionales ({categoryCounts.emotional})
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === 'technical' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setSelectedCategory('technical')}
          type="button"
        >
          ⚙️ Técnicas ({categoryCounts.technical})
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === 'commercial' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setSelectedCategory('commercial')}
          type="button"
        >
          💰 Comerciales ({categoryCounts.commercial})
        </button>
      </div>

      {/* New Question Form */}
      {isAddingNew && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Nueva Pregunta de Entrenamiento</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    category: e.target.value as TrainingQuestion['category'],
                  })
                }
                value={newQuestion.category}
              >
                <option value="basic">📚 Básicas</option>
                <option value="emotional">❤️ Emocionales</option>
                <option value="technical">⚙️ Técnicas</option>
                <option value="commercial">💰 Comerciales</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Pregunta <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="¿Cómo puedo...?"
                type="text"
                value={newQuestion.question}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contexto (opcional)</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setNewQuestion({ ...newQuestion, context: e.target.value })}
                placeholder="Información adicional sobre cuándo aplicar esta respuesta"
                type="text"
                value={newQuestion.context}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Respuesta Esperada <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setNewQuestion({ ...newQuestion, expectedAnswer: e.target.value })}
                placeholder="La IA debería responder..."
                rows={4}
                value={newQuestion.expectedAnswer}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tags (separados por comas)
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                placeholder="eventos, crear, básico"
                type="text"
                value={newQuestion.tags}
              />
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={handleAddQuestion}
                type="button"
              >
                💾 Guardar Pregunta
              </button>
              <button
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsAddingNew(false)}
                type="button"
              >
                ✖️ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.map((question) => {
          const config = getCategoryConfig(question.category);
          return (
            <div className="rounded-lg border border-gray-200 bg-white p-4" key={question.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
                      {config.icon} {config.name}
                    </span>
                    {question.tags.map((tag, idx) => (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600" key={idx}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{question.question}</h3>
                  {question.context && (
                    <p className="mb-2 text-sm italic text-gray-500">Contexto: {question.context}</p>
                  )}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-700">Respuesta esperada:</p>
                    <p className="mt-1 text-sm text-gray-600">{question.expectedAnswer}</p>
                  </div>
                </div>
                <button
                  className="ml-4 rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteQuestion(question.id)}
                  type="button"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          );
        })}
        {filteredQuestions.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            No hay preguntas en esta categoría
          </div>
        )}
      </div>
    </div>
  );
}
