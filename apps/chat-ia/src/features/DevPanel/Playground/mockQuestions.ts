/**
 * Mock de preguntas para el Playground del Copilot
 * Basado en test-copilot-battery.js y análisis de tests existentes
 */

export interface MockTestQuestion {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedResponse: string;
  id: string;
  keywords: string[];
  question: string;
  requiresAuth: boolean;
  requiresEventContext: boolean;
  shouldContain?: string[];
  shouldNotContain?: string[];
}

export const MOCK_QUESTIONS: MockTestQuestion[] = [
  {
    category: "general",
    difficulty: "easy",
    expectedResponse: "Saludo cordial sin errores técnicos",
    id: "T01",
    keywords: ["hola", "saludo", "bienvenido"],
    question: "Hola",
    requiresAuth: false,
    requiresEventContext: false,
    shouldContain: [],
    shouldNotContain: ["error", "RequestId", "herramienta", "get_user_events", "ejecutar"]
  },
  {
    category: "invitados",
    difficulty: "medium",
    expectedResponse: "25 invitados en la Boda de Paco y Pico",
    id: "T02",
    keywords: ["25", "invitados", "total"],
    question: "¿Cuántos invitados tengo?",
    requiresAuth: true,
    requiresEventContext: true,
    shouldContain: ["25", "invitado"],
    shouldNotContain: ["ejecutar", "get_event_guests", "herramienta"]
  },
  {
    category: "presupuesto",
    difficulty: "medium",
    expectedResponse: "5000 EUR de 15000 EUR total",
    id: "T03",
    keywords: ["5000", "5.000", "presupuesto", "pagado", "15000"],
    question: "¿Cuánto llevo pagado del presupuesto?",
    requiresAuth: true,
    requiresEventContext: true,
    shouldContain: ["5", "presupuesto"],
    shouldNotContain: ["ejecutar", "herramienta", "no tengo acceso"]
  },
  {
    category: "navegacion",
    difficulty: "easy",
    expectedResponse: "Link a /invitados",
    id: "T04",
    keywords: ["invitados", "link", "ver", "/invitados"],
    question: "Quiero ver mis invitados",
    requiresAuth: true,
    requiresEventContext: false,
    shouldContain: ["/invitados"],
    shouldNotContain: ["error"]
  },
  {
    category: "navegacion",
    difficulty: "easy",
    expectedResponse: "Link a /presupuesto",
    id: "T05",
    keywords: ["presupuesto", "link", "navega", "/presupuesto"],
    question: "Llévame al presupuesto",
    requiresAuth: true,
    requiresEventContext: false,
    shouldContain: ["/presupuesto"],
    shouldNotContain: ["error"]
  },
  {
    category: "evento",
    difficulty: "easy",
    expectedResponse: "Boda de Paco y Pico",
    id: "T06",
    keywords: ["Paco", "Pico", "nombre", "evento", "boda"],
    question: "¿Cómo se llama mi evento?",
    requiresAuth: true,
    requiresEventContext: true,
    shouldContain: ["Paco", "Pico"],
    shouldNotContain: ["no tengo", "ejecutar"]
  },
  {
    category: "mesas",
    difficulty: "easy",
    expectedResponse: "5 mesas",
    id: "T07",
    keywords: ["5", "mesas", "seating"],
    question: "¿Cuántas mesas tengo?",
    requiresAuth: true,
    requiresEventContext: true,
    shouldContain: ["5", "mesa"],
    shouldNotContain: ["ejecutar", "herramienta"]
  },
  {
    category: "general",
    difficulty: "medium",
    expectedResponse: "Lista de consejos generales para bodas",
    id: "T08",
    keywords: ["consejos", "organizar", "boda", "tips", "recomendaciones"],
    question: "Dime 3 consejos para organizar una boda",
    requiresAuth: false,
    requiresEventContext: false,
    shouldContain: [],
    shouldNotContain: ["error", "RequestId"]
  },
  {
    category: "resumen",
    difficulty: "hard",
    expectedResponse: "Resumen con datos de múltiples módulos",
    id: "T09",
    keywords: ["resumen", "completo", "evento", "Paco", "Pico", "invitados", "presupuesto"],
    question: "Dame un resumen completo de mi evento",
    requiresAuth: true,
    requiresEventContext: true,
    shouldContain: ["Paco", "Pico"],
    shouldNotContain: ["get_user_events", "get_event_guests", "ejecutar", "herramienta", "función"]
  },
  {
    category: "function_calling",
    difficulty: "hard",
    expectedResponse: "Confirmación de creación de invitados con function calling",
    id: "T10",
    keywords: ["Jose Garcia", "Jose Morales", "agregado", "invitado", "creado"],
    question: "Agrega a Jose Garcia y Jose Morales como invitados a mi evento",
    requiresAuth: true,
    requiresEventContext: true,
    shouldContain: ["Jose"],
    shouldNotContain: ["error", "herramienta", "ejecutar", "función"]
  },
  {
    category: "evento",
    difficulty: "medium",
    expectedResponse: "Cálculo de días restantes hasta 2026-06-15",
    id: "T11",
    keywords: ["días", "faltan", "fecha", "junio", "2026"],
    question: "¿Cuántos días faltan para mi boda?",
    requiresAuth: true,
    requiresEventContext: true,
    shouldContain: ["día"],
    shouldNotContain: ["error"]
  }
];

/**
 * Obtener preguntas filtradas
 */
export function getQuestionsByCategory(category: string): MockTestQuestion[] {
  return MOCK_QUESTIONS.filter(q => q.category === category);
}

export function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): MockTestQuestion[] {
  return MOCK_QUESTIONS.filter(q => q.difficulty === difficulty);
}

export function getQuestionById(id: string): MockTestQuestion | undefined {
  return MOCK_QUESTIONS.find(q => q.id === id);
}
