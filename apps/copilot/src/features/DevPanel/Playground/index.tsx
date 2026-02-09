'use client';

import { PlayCircle, RotateCcw, StopCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react';

import { buildAuthHeaders } from '@/utils/authToken';
import { fetchSSE } from '@/utils/fetch';
import { MOCK_QUESTIONS } from './mockQuestions';

interface TestQuestion {
  category: string;
  difficulty: string;
  expectedResponse: string;
  id: string;
  keywords: string[];
  question: string;
}

interface TestResult {
  analysis?: {
    keywords: string[];
    matches: number;
    passed: boolean;
    reasoning: string;
    score: number;
  };
  executionTime?: number;
  expectedResponse: string;
  isAnalyzing: boolean;
  question: string;
  questionId: string;
  response: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

const Playground = () => {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022');
  const [selectedProvider, setSelectedProvider] = useState('anthropic');

  // Cargar preguntas del backend
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      // 🔧 MODO DESARROLLO: Usar preguntas mock si estamos en localhost
      const isDevelopment = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isDevelopment) {
        console.log('🎮 Playground: Usando preguntas MOCK (desarrollo local)');
        console.log(`📋 Total preguntas cargadas: ${MOCK_QUESTIONS.length}`);
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));
        setQuestions(MOCK_QUESTIONS);
        setIsLoading(false);
        return;
      }

      // MODO PRODUCCIÓN: Cargar del backend Python
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-ia.bodasdehoy.com';
      const url = new URL('/api/admin/tests/questions', backendURL);

      url.searchParams.append('limit', '100'); // Cargar primeras 100 para empezar

      console.log('📡 Playground: Cargando preguntas desde backend:', url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          ...buildAuthHeaders(),
          'X-Development': 'bodasdehoy',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Preguntas cargadas del backend: ${data.length}`);
      setQuestions(data);
    } catch (error) {
      console.error('❌ Error loading questions:', error);
      console.warn('⚠️ Fallback a preguntas MOCK');
      setQuestions(MOCK_QUESTIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Ejecutar pregunta con streaming
  const runQuestion = useCallback(async (question: TestQuestion) => {
    const startTime = Date.now();
    setCurrentResponse('');
    setIsStreaming(true);

    // Crear resultado inicial
    const resultId = `result-${question.id}`;
    setResults(prev => [...prev, {
      expectedResponse: question.expectedResponse,
      isAnalyzing: false,
      question: question.question,
      questionId: question.id,
      response: '',
      status: 'running',
    }]);

    try {
      // ✅ Usar backend Python IA directamente
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-ia.bodasdehoy.com';
      const chatUrl = `${backendURL}/webapi/chat/auto`;

      abortControllerRef.current = new AbortController();
      let fullResponse = '';

      await fetchSSE(chatUrl, {
        body: JSON.stringify({
          messages: [{ content: question.question, role: 'user' }],
          model: selectedModel,
          provider: selectedProvider,
          stream: true,
        }),
        headers: {
          ...buildAuthHeaders(),
          'Content-Type': 'application/json',
          'X-Development': 'bodasdehoy',
        },
        method: 'POST',
        onErrorHandle: (error) => {
          setIsStreaming(false);
          setResults(prev => prev.map(r => 
            r.questionId === question.id 
              ? { ...r, isAnalyzing: false, status: 'error' }
              : r
          ));
        },
        onFinish: async () => {
          const executionTime = Date.now() - startTime;
          setIsStreaming(false);

          // Analizar respuesta
          const analysis = analyzeResponse(fullResponse, question);
          
          setResults(prev => prev.map(r => 
            r.questionId === question.id 
              ? { 
                  ...r, 
                  analysis,
                  executionTime,
                  isAnalyzing: false,
                  response: fullResponse,
                  status: 'completed',
                }
              : r
          ));
        },
        onMessageHandle: ({ text, type }) => {
          if (type === 'text' && text) {
            fullResponse += text;
            setCurrentResponse(fullResponse);
            
            // Actualizar resultado en tiempo real
            setResults(prev => prev.map(r => 
              r.questionId === question.id 
                ? { ...r, response: fullResponse }
                : r
            ));
          }
        },
        signal: abortControllerRef.current.signal,
      });
    } catch (error: any) {
      setIsStreaming(false);
      if (error.name !== 'AbortError') {
        setResults(prev => prev.map(r => 
          r.questionId === question.id 
            ? { ...r, isAnalyzing: false, status: 'error' }
            : r
        ));
      }
    }
  }, [selectedModel, selectedProvider]);

  // Analizar respuesta comparándola con la esperada
  const analyzeResponse = (response: string, question: TestQuestion) => {
    const responseLower = response.toLowerCase();
    const expectedLower = question.expectedResponse.toLowerCase();
    const keywords = question.keywords || [];

    // Contar keywords encontradas
    const matches = keywords.filter(kw => 
      responseLower.includes(kw.toLowerCase())
    ).length;

    // Calcular score (0-100)
    let score = 0;
    
    // Score por keywords (40%)
    if (keywords.length > 0) {
      score += (matches / keywords.length) * 40;
    }
    
    // Score por similitud de texto (60%)
    const similarity = calculateSimilarity(responseLower, expectedLower);
    score += similarity * 60;

    const passed = score >= 70; // Pasar si score >= 70

    return {
      keywords,
      matches,
      passed,
      reasoning: passed 
        ? `Respuesta cumple con los criterios (${matches}/${keywords.length} keywords, ${Math.round(similarity * 100)}% similitud)`
        : `Respuesta no cumple completamente (${matches}/${keywords.length} keywords, ${Math.round(similarity * 100)}% similitud)`,
      score: Math.round(score),
    };
  };

  // Calcular similitud simple entre dos textos
  const calculateSimilarity = (text1: string, text2: string): number => {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    const intersection = words1.filter(w => words2.includes(w));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  };

  // Ejecutar todas las preguntas seleccionadas
  const runAllSelected = useCallback(async () => {
    if (selectedQuestions.length === 0) {
      alert('Selecciona al menos una pregunta');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setCurrentQuestionIndex(0);

    const questionsToRun = questions.filter(q => selectedQuestions.includes(q.id));

    for (const [i, element] of questionsToRun.entries()) {
      if (!isRunning) break; // Permitir cancelar
      
      setCurrentQuestionIndex(i);
      await runQuestion(element);
      
      // Esperar un poco entre preguntas
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setCurrentQuestionIndex(0);
  }, [selectedQuestions, questions, isRunning, runQuestion]);

  // Detener ejecución
  const stopExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setIsStreaming(false);
  }, []);

  // Limpiar resultados
  const clearResults = useCallback(() => {
    setResults([]);
    setCurrentResponse('');
    setCurrentQuestionIndex(0);
  }, []);

  return (
    <div style={{ margin: '0 auto', maxWidth: '1400px', padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        🎮 Playground - Test en Tiempo Real
      </h1>

      {/* Configuración */}
      <div style={{ 
        background: '#f5f5f5', 
        borderRadius: '8px', 
        marginBottom: '24px', 
        padding: '16px' 
      }}>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Modelo:
            </label>
            <select
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}
              value={selectedModel}
            >
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gemini-pro">Gemini Pro</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Provider:
            </label>
            <select
              onChange={(e) => setSelectedProvider(e.target.value)}
              style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}
              value={selectedProvider}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="google">Google</option>
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <button
            disabled={isRunning || selectedQuestions.length === 0}
            onClick={runAllSelected}
            style={{
              alignItems: 'center',
              background: isRunning ? '#ccc' : '#4CAF50',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              gap: '8px',
              padding: '10px 20px',
            }}
          >
            {isRunning ? <Loader2 size={16} /> : <PlayCircle size={16} />}
            {isRunning ? 'Ejecutando...' : 'Ejecutar Seleccionadas'}
          </button>
          {isRunning && (
            <button
              onClick={stopExecution}
              style={{
                alignItems: 'center',
                background: '#f44336',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                gap: '8px',
                padding: '10px 20px',
              }}
            >
              <StopCircle size={16} />
              Detener
            </button>
          )}
          <button
            onClick={clearResults}
            style={{
              alignItems: 'center',
              background: '#2196F3',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              gap: '8px',
              padding: '10px 20px',
            }}
          >
            <RotateCcw size={16} />
            Limpiar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
        {/* Lista de Preguntas */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            Preguntas ({questions.length})
          </h2>
          
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <p>Cargando preguntas...</p>
            </div>
          ) : (
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              maxHeight: '600px', 
              overflowY: 'auto',
              padding: '8px'
            }}>
              {questions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestions(prev => 
                      prev.includes(q.id)
                        ? prev.filter(id => id !== q.id)
                        : [...prev, q.id]
                    );
                  }}
                  style={{
                    background: selectedQuestions.includes(q.id) ? '#e8f5e9' : 'white',
                    border: selectedQuestions.includes(q.id) 
                      ? '2px solid #4CAF50' 
                      : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ alignItems: 'start', display: 'flex', gap: '8px' }}>
                    <input
                      checked={selectedQuestions.includes(q.id)}
                      onChange={() => {}}
                      style={{ marginTop: '4px' }}
                      type="checkbox"
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        marginBottom: '4px' 
                      }}>
                        {q.question}
                      </div>
                      <div style={{ 
                        color: '#666', 
                        display: 'flex',
                        fontSize: '12px',
                        gap: '8px',
                        marginTop: '4px'
                      }}>
                        <span>[{q.category}]</span>
                        <span>[{q.difficulty}]</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resultados en Tiempo Real */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            Resultados en Tiempo Real
            {isRunning && (
              <span style={{ 
                color: '#4CAF50', 
                fontSize: '14px', 
                fontWeight: 'normal',
                marginLeft: '12px'
              }}>
                ({currentQuestionIndex + 1}/{selectedQuestions.length})
              </span>
            )}
          </h2>

          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            maxHeight: '600px', 
            overflowY: 'auto',
            padding: '16px'
          }}>
            {results.length === 0 ? (
              <div style={{ 
                color: '#999', 
                padding: '40px', 
                textAlign: 'center' 
              }}>
                <p>Selecciona preguntas y ejecuta para ver resultados</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  Verás cómo la IA escribe en tiempo real y el análisis automático
                </p>
              </div>
            ) : (
              results.map((result) => (
                <div
                  key={result.questionId}
                  style={{
                    background: result.status === 'completed' 
                      ? (result.analysis?.passed ? '#e8f5e9' : '#ffebee')
                      : result.status === 'running'
                      ? '#e3f2fd'
                      : 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    padding: '16px',
                  }}
                >
                  <div style={{ 
                    alignItems: 'center', 
                    display: 'flex', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    {result.status === 'running' && (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                    {result.status === 'completed' && (
                      result.analysis?.passed ? (
                        <CheckCircle2 color="#4CAF50" size={16} />
                      ) : (
                        <XCircle color="#f44336" size={16} />
                      )
                    )}
                    <strong style={{ fontSize: '14px' }}>{result.question}</strong>
                  </div>

                  {result.status === 'running' && (
                    <div style={{
                      background: '#f5f5f5',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      minHeight: '60px',
                      padding: '12px',
                    }}>
                      <div style={{ 
                        color: '#666', 
                        fontSize: '12px', 
                        marginBottom: '4px' 
                      }}>
                        ✍️ La IA está escribiendo...
                      </div>
                      <div style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {result.response || currentResponse}
                        {isStreaming && (
                          <span style={{ 
                            animation: 'blink 1s infinite',
                            marginLeft: '2px'
                          }}>▊</span>
                        )}
                      </div>
                    </div>
                  )}

                  {result.status === 'completed' && (
                    <>
                      <div style={{
                        background: '#f5f5f5',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        padding: '12px',
                      }}>
                        <div style={{ 
                          color: '#666', 
                          fontSize: '12px', 
                          fontWeight: '500',
                          marginBottom: '8px'
                        }}>
                          ✅ Respuesta de la IA:
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {result.response}
                        </div>
                      </div>

                      {result.analysis && (
                        <div style={{
                          background: result.analysis.passed ? '#e8f5e9' : '#ffebee',
                          border: `1px solid ${result.analysis.passed ? '#4CAF50' : '#f44336'}`,
                          borderRadius: '6px',
                          padding: '12px',
                        }}>
                          <div style={{ 
                            color: result.analysis.passed ? '#2e7d32' : '#c62828', 
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '8px'
                          }}>
                            📊 Análisis: {result.analysis.passed ? '✅ PASÓ' : '❌ FALLÓ'} 
                            (Score: {result.analysis.score}/100)
                          </div>
                          <div style={{ color: '#555', fontSize: '13px' }}>
                            {result.analysis.reasoning}
                          </div>
                          {result.executionTime && (
                            <div style={{ 
                              color: '#666', 
                              fontSize: '11px', 
                              marginTop: '8px' 
                            }}>
                              ⏱️ Tiempo: {result.executionTime}ms
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {result.status === 'error' && (
                    <div style={{
                      background: '#ffebee',
                      borderRadius: '6px',
                      color: '#c62828',
                      padding: '12px',
                    }}>
                      ❌ Error al procesar esta pregunta
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Playground;
