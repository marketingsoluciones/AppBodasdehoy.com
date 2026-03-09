'use client';

import { PlayCircle, RotateCcw, StopCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';
import { useChatStore } from '@/store/chat';
import { buildAuthHeaders } from '@/utils/authToken';

interface TestQuestion {
  actualResponse?: string;
  category: string;
  difficulty: string;
  executionTime?: number;
  expectedResponse: string;
  id: string;
  keywords: string[];
  question: string;
  score?: number;
  status: string;
}

interface TestResult {
  actualResponse: string;
  error?: string;
  executionTime: number;
  passed: boolean;
  score: number;
  testId: string;
}

interface TestStats {
  avgScore: number;
  avgTime: number;
  byCategory: Record<string, { failed: number; passed: number; total: number }>;
  failed: number;
  passed: number;
  pending: number;
  total: number;
  totalRuns: number;
}

// Función para obtener color de texto según status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'passed': {
      return '#10b981'; // green-600
    }
    case 'failed': {
      return '#ef4444'; // red-600
    }
    case 'running': {
      return '#3b82f6'; // blue-600
    }
    default: {
      return '#6b7280'; // gray-600
    }
  }
};

// Función para obtener color de fondo según status
const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'passed': {
      return '#ecfdf5'; // green-50
    }
    case 'failed': {
      return '#fef2f2'; // red-50
    }
    case 'running': {
      return '#eff6ff'; // blue-50
    }
    default: {
      return '#f9fafb'; // gray-50
    }
  }
};

const TestSuite = () => {
  const [tests, setTests] = useState<TestQuestion[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ✅ NUEVO: Estado de carga inicial
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null); // ✅ NUEVO: Progreso de carga
  const [results, setResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [filter, setFilter] = useState<{ category?: string; difficulty?: string; search?: string }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    category: 'general',
    difficulty: 'medium',
    expectedResponse: '',
    keywords: [] as string[],
    question: '',
  });
  const [keywordsInput, setKeywordsInput] = useState('');
  // ✅ NUEVO: Estado para comparación de modelos
  const [enableModelComparison, setEnableModelComparison] = useState(false); // Por defecto: auto (sin comparación)
  const [selectedModels, setSelectedModels] = useState<Array<{model: string, provider: string;}>>([
    {model: 'qwen2.5:7b', provider: 'ollama'},
    {model: 'phi3.5:latest', provider: 'ollama'},
    {model: 'deepseek-r1:8b', provider: 'ollama'},
  ]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  // ✅ NUEVO: Modelos disponibles (auto-detectados)
  const [availableModels, setAvailableModels] = useState<Array<{costPer1kTokens?: number, name: string, provider: string, size?: string}>>([]);

  // ✅ NUEVO: Sistema de votación
  const [modelVotes, setModelVotes] = useState<Record<string, { category?: string, votes: number; }>>({});
  const [votingEnabled, setVotingEnabled] = useState(false);

  // ✅ NUEVO: Estado para colapsar secciones y ahorrar espacio
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // ✅ NUEVO: Cargar modelos disponibles (API + Ollama vía backend)
  const loadAvailableModels = useCallback(async () => {
    // Modelos de API con costos estimados ($/1k tokens de salida) - siempre disponibles
    const apiModels = [
      { costPer1kTokens: 0.015, name: 'claude-3-5-sonnet-20241022', provider: 'anthropic', size: 'API' },
      { costPer1kTokens: 0.001_25, name: 'claude-3-haiku-20240307', provider: 'anthropic', size: 'API' },
      { costPer1kTokens: 0.0006, name: 'gpt-4o-mini', provider: 'openai', size: 'API' },
      { costPer1kTokens: 0.015, name: 'gpt-4o', provider: 'openai', size: 'API' },
      { costPer1kTokens: 0.0003, name: 'gemini-1.5-flash', provider: 'google', size: 'API' },
      { costPer1kTokens: 0.0004, name: 'gemini-2.0-flash-exp', provider: 'google', size: 'API' },
      { costPer1kTokens: 0.000_79, name: 'llama-3.3-70b-versatile', provider: 'groq', size: 'API' },
      { costPer1kTokens: 0.000_24, name: 'mixtral-8x7b-32768', provider: 'groq', size: 'API' },
    ];

    // Modelos de Ollama conocidos (fallback estático) - costo $0
    const ollamaFallback = [
      { costPer1kTokens: 0, name: 'qwen2.5:7b', provider: 'ollama', size: '4.7GB' },
      { costPer1kTokens: 0, name: 'phi3.5:latest', provider: 'ollama', size: '2.2GB' },
      { costPer1kTokens: 0, name: 'deepseek-r1:8b', provider: 'ollama', size: '5.2GB' },
      { costPer1kTokens: 0, name: 'qwen2.5-coder:7b', provider: 'ollama', size: '4.7GB' },
      { costPer1kTokens: 0, name: 'deepseek-r1:14b', provider: 'ollama', size: '9GB' },
    ];

    try {
      // ✅ FIX: Intentar cargar modelos de Ollama vía backend (no directamente desde navegador)
      const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';
      let ollamaModels: Array<{costPer1kTokens?: number, name: string, provider: string, size?: string}> = [];

      // Construir URL correctamente
      let url: string;
      if (backendURL.startsWith('/')) {
        url = `${backendURL}/api/ollama/models`;
      } else {
        url = `${backendURL}/api/ollama/models`;
      }

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // Timeout de 3 segundos
      });

      if (response.ok) {
        const data = await response.json();
        ollamaModels = (data.models || []).map((m: any) => ({
          costPer1kTokens: 0,
          name: m.name,
          provider: 'ollama',
          size: m.size ? `${(m.size / 1e9).toFixed(1)}GB` : undefined,
        }));
      }

      // Si obtuvimos modelos de Ollama vía backend, usarlos; si no, usar fallback
      setAvailableModels([...(ollamaModels.length > 0 ? ollamaModels : ollamaFallback), ...apiModels]);
    } catch {
      // ✅ Silenciar error - usar modelos fallback sin mostrar error en consola
      // Es esperado que falle si el backend no tiene endpoint de Ollama
      setAvailableModels([...ollamaFallback, ...apiModels]);
    }
  }, []);

  const loadTests = useCallback(async () => {
    setIsLoading(true); // ✅ Mostrar indicador de carga
    try {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.difficulty) params.append('difficulty', filter.difficulty);
      if (filter.search) params.append('search', filter.search);

      const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';

      // ✅ CORRECCIÓN: Construir URL correctamente
      let url: URL;
      if (backendURL.startsWith('/')) {
        // Es una ruta relativa (proxy de Next.js: /api/backend)
        url = new URL(`${backendURL}/api/admin/tests/questions`, window.location.origin);
      } else {
        // Es una URL absoluta (http://localhost:8030)
        url = new URL('/api/admin/tests/questions', backendURL);
      }

      if (params.toString()) {
        url.search = params.toString();
      }

      console.log('[TestSuite] 🔄 Cargando tests desde:', url.toString());
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('[TestSuite] ✅ Tests cargados:', data.length);
      setTests(data);
      setLoadingProgress({ current: data.length, total: data.length });
    } catch (error) {
      console.error('[TestSuite] ❌ Error loading tests:', error);
      setTests([]); // Mostrar lista vacía en caso de error
    } finally {
      setIsLoading(false); // ✅ Ocultar indicador de carga
    }
  }, [filter]);

  const loadStats = useCallback(async () => {
    try {
      const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';

      // ✅ CORRECCIÓN: Construir URL correctamente
      let url: URL;
      if (backendURL.startsWith('/')) {
        url = new URL(`${backendURL}/api/admin/tests/stats`, window.location.origin);
      } else {
        url = new URL('/api/admin/tests/stats', backendURL);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null); // No mostrar stats en caso de error
    }
  }, []);

  useEffect(() => {
    loadTests();
    loadStats();
    loadAvailableModels();
  }, [loadTests, loadStats, loadAvailableModels]);

  // ✅ CORRECCIÓN: useChatStore puede no estar disponible en admin o durante SSR
  // Usar el hook siempre (regla de React), pero con selector seguro
  const chatStoreResult = useChatStore((s) => {
    // Selector seguro: si el store no está inicializado, retornar undefined
    if (!s) {
      return { activeId: undefined, sendMessage: undefined };
    }
    return {
      activeId: s.activeId,
      sendMessage: s.sendMessage,
    };
  });
  const sendMessage = chatStoreResult?.sendMessage;
  const activeId = chatStoreResult?.activeId;

  const runSelectedTests = useCallback(async () => {
    if (selectedTests.length === 0) {
      alert('Selecciona al menos un test');
      return;
    }

    // ✅ NUEVO: Si está habilitada la comparación de modelos, ejecutar comparación
    if (enableModelComparison) {
      if (selectedModels.length === 0) {
        alert('Selecciona al menos un modelo para comparar');
        return;
      }

      setIsComparing(true);
      setResults([]);

      try {
        const backendURL = 
          process.env.NEXT_PUBLIC_BACKEND_URL || 
          EVENTOS_API_CONFIG.BACKEND_URL || 
          'http://localhost:8030';

        let url: string;
        if (backendURL.startsWith('/')) {
          url = `${backendURL}/api/admin/tests/compare`;
        } else if (backendURL.startsWith('http://') || backendURL.startsWith('https://')) {
          url = `${backendURL}/api/admin/tests/compare`;
        } else {
          url = `http://${backendURL}/api/admin/tests/compare`;
        }

        // Ejecutar comparación para el primer test seleccionado (o todos si quieres)
        const firstTestId = selectedTests[0];
        const test = tests.find(t => t.id === firstTestId);
        if (!test) {
          alert('Test no encontrado');
          setIsComparing(false);
          return;
        }

        const response = await fetch(url.toString(), {
          body: JSON.stringify({
            models: selectedModels,
            question: test.question,
            testId: firstTestId,
          }),
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          setComparisonResults(data);
          setShowComparisonModal(true);
        } else {
          throw new Error(data.error || 'Error ejecutando comparación');
        }

        await loadTests();
        await loadStats();
      } catch (error) {
        console.error('Error running comparison:', error);
        alert(`Error ejecutando comparación: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsComparing(false);
      }
      return;
    }

    // ✅ EJECUCIÓN NORMAL (sin comparación - Auto)
    setIsRunning(true);
    setResults([]);

    try {
      const backendURL = 
        process.env.NEXT_PUBLIC_BACKEND_URL || 
        EVENTOS_API_CONFIG.BACKEND_URL || 
        'http://localhost:8030';

      let url: string;
      if (backendURL.startsWith('/')) {
        url = `${backendURL}/api/admin/tests/run`;
      } else if (backendURL.startsWith('http://') || backendURL.startsWith('https://')) {
        url = `${backendURL}/api/admin/tests/run`;
      } else {
        url = `http://${backendURL}/api/admin/tests/run`;
      }

      // ✅ NUEVO: Enviar preguntas al chat ANTES de ejecutar tests
      const selectedTestQuestions = tests.filter((t) => selectedTests.includes(t.id));
      
      if (activeId && sendMessage) {
        for (const test of selectedTestQuestions) {
          try {
            await sendMessage({
              files: [],
              isWelcomeQuestion: false,
              message: test.question, 
              onlyAddUserMessage: false,
            });
            await new Promise<void>((resolve) => {
              setTimeout(() => resolve(), 1000);
            });
          } catch (error) {
            console.error(`Error enviando pregunta al chat: ${error}`);
          }
        }
      }

      // Ejecutar tests en el backend (modo normal)
      const response = await fetch(url.toString(), {
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
          testIds: selectedTests,
        }),
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        await loadTests();
        await loadStats();
      } else {
        throw new Error(data.error || 'Error ejecutando tests');
      }
    } catch (error) {
      console.error('Error running tests:', error);
      alert(`Error ejecutando tests: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  }, [selectedTests, loadTests, loadStats, tests, sendMessage, activeId, enableModelComparison, selectedModels]);

  const resetTests = useCallback(async () => {
    try {
      // ✅ CORRECCIÓN: Usar NEXT_PUBLIC_BACKEND_URL o fallback
      const backendURL = 
        process.env.NEXT_PUBLIC_BACKEND_URL || 
        EVENTOS_API_CONFIG.BACKEND_URL || 
        'http://localhost:8030';

      // ✅ CORRECCIÓN: Construir URL correctamente
      let url: string;
      if (backendURL.startsWith('/')) {
        // Es una ruta relativa (proxy de Next.js)
        url = `${backendURL}/api/admin/tests/reset`;
      } else if (backendURL.startsWith('http://') || backendURL.startsWith('https://')) {
        // Es una URL absoluta
        url = `${backendURL}/api/admin/tests/reset`;
      } else {
        // Fallback: asumir que es una URL completa
        url = `http://${backendURL}/api/admin/tests/reset`;
      }

      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await loadTests();
      await loadStats();
      setResults([]);
      setSelectedTests([]);
    } catch (error) {
      console.error('Error resetting tests:', error);
      alert(`Error reseteando tests: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [loadTests, loadStats]);

  const toggleTestSelection = useCallback((testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId],
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedTests(tests.map((t) => t.id));
  }, [tests]);

  const deselectAll = useCallback(() => {
    setSelectedTests([]);
  }, []);

  const handleAddQuestion = useCallback(async () => {
    try {
      const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';
      let url: string;
      if (backendURL.startsWith('/')) {
        url = `${backendURL}/api/admin/tests/questions`;
      } else {
        url = `${backendURL}/api/admin/tests/questions`;
      }

      const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);

      const response = await fetch(url, {
        body: JSON.stringify({
          category: newQuestion.category,
          difficulty: newQuestion.difficulty,
          expectedResponse: newQuestion.expectedResponse,
          keywords: keywords.length > 0 ? keywords : newQuestion.keywords,
          question: newQuestion.question,
        }),
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Resetear formulario
      setNewQuestion({
        category: 'general',
        difficulty: 'medium',
        expectedResponse: '',
        keywords: [],
        question: '',
      });
      setKeywordsInput('');
      setShowAddModal(false);

      // Recargar tests
      await loadTests();
      alert('✅ Pregunta agregada correctamente');
    } catch (error) {
      console.error('Error adding question:', error);
      alert(`Error agregando pregunta: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [newQuestion, keywordsInput, loadTests]);

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: '#10b981',
      hard: '#ef4444',
      medium: '#f59e0b',
    };
    return (
      <span
        style={{
          backgroundColor: `${colors[difficulty as keyof typeof colors]}20`,
          borderRadius: '4px',
          color: colors[difficulty as keyof typeof colors],
          fontSize: '11px',
          fontWeight: 500,
          padding: '2px 8px',
        }}
      >
        {difficulty}
      </span>
    );
  };

  return (
    <Flexbox gap={16} padding={16} style={{ height: '100%', overflow: 'auto' }}>
      {/* ✅ NUEVO: Indicador de carga inicial */}
      {isLoading && tests.length === 0 && (
        <div style={{
          alignItems: 'center',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          justifyContent: 'center',
          padding: '32px',
        }}>
          <div style={{
            animation: 'spin 1s linear infinite',
            border: '3px solid #e5e7eb',
            borderRadius: '50%',
            borderTop: '3px solid #667eea',
            height: '40px',
            width: '40px',
          }} />
          <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>
            Cargando tests...
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
            Conectando con el backend...
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Indicador de progreso cuando tests están corriendo */}
      {isRunning && (
        <div style={{
          alignItems: 'center',
          background: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          display: 'flex',
          gap: '12px',
          padding: '12px 16px',
        }}>
          <div style={{
            animation: 'spin 1s linear infinite',
            border: '2px solid #e5e7eb',
            borderRadius: '50%',
            borderTop: '2px solid #3b82f6',
            height: '20px',
            width: '20px',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#1e40af', fontSize: '14px', fontWeight: 600 }}>
              🚀 Ejecutando tests...
            </div>
            {loadingProgress && (
              <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>
                Progreso: {loadingProgress.current} / {loadingProgress.total}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Test Suite</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>
            {tests.length > 0 ? `${tests.length} tests disponibles` : 'Batería de tests de calidad para IA'}
          </p>
        </div>
        <Flexbox gap={8} horizontal>
          <button
            disabled={isRunning}
            onClick={resetTests}
            style={{
              alignItems: 'center',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              fontSize: '13px',
              gap: '4px',
              opacity: isRunning ? 0.5 : 1,
              padding: '6px 12px',
            }}
            type="button"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            disabled={(!isRunning && !isComparing) && selectedTests.length === 0}
            onClick={(isRunning || isComparing) ? () => { setIsRunning(false); setIsComparing(false); } : runSelectedTests}
            style={{
              alignItems: 'center',
              background: (isRunning || isComparing) ? '#ef4444' : enableModelComparison ? '#10b981' : '#667eea',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: selectedTests.length === 0 && !isRunning && !isComparing ? 'not-allowed' : 'pointer',
              display: 'flex',
              fontSize: '13px',
              fontWeight: 500,
              gap: '4px',
              opacity: selectedTests.length === 0 && !isRunning && !isComparing ? 0.5 : 1,
              padding: '6px 16px',
            }}
            type="button"
          >
            {(isRunning || isComparing) ? (
              <>
                <StopCircle size={14} />
                Stop
              </>
            ) : (
              <>
                <PlayCircle size={14} />
                {enableModelComparison ? `Comparar (${selectedTests.length})` : `Run Tests (${selectedTests.length})`}
              </>
            )}
          </button>
        </Flexbox>
      </Flexbox>

      {/* ✅ COMPACTO: Checkbox + selector de modelos en línea */}
      <Flexbox gap={8} horizontal style={{ alignItems: 'center', background: enableModelComparison ? '#f0f9ff' : '#f9fafb', border: `1px solid ${enableModelComparison ? '#3b82f6' : '#e5e7eb'}`, borderRadius: '8px', flexWrap: 'wrap', padding: '8px 12px' }}>
        <label style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', fontSize: '13px', gap: '6px' }}>
          <input
            checked={enableModelComparison}
            onChange={(e) => setEnableModelComparison(e.target.checked)}
            style={{ cursor: 'pointer' }}
            type="checkbox"
          />
          <span style={{ fontWeight: 600 }}>🔄 Comparar</span>
        </label>

        {enableModelComparison ? (
          <>
            {/* Modelos seleccionados - compacto */}
            <Flexbox gap={4} horizontal style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              {selectedModels.map((model, index) => (
                <span
                  key={index}
                  style={{
                    alignItems: 'center',
                    background: '#fff',
                    border: '1px solid #3b82f6',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    fontSize: '11px',
                    gap: '4px',
                    padding: '2px 6px',
                  }}
                >
                  {model.model.split(':')[0]}
                  <button
                    onClick={() => selectedModels.length > 1 && setSelectedModels(selectedModels.filter((_, i) => i !== index))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                    type="button"
                  >×</button>
                </span>
              ))}
            </Flexbox>

            {/* Botón para expandir/colapsar selector completo */}
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              style={{
                background: '#3b82f6',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '4px 8px',
              }}
              type="button"
            >
              {showModelSelector ? '▲ Menos' : `+ Modelos (${availableModels.length})`}
            </button>
          </>
        ) : (
          <span style={{ color: '#6b7280', fontSize: '11px' }}>Auto: el sistema escoge el modelo</span>
        )}
      </Flexbox>

      {/* Selector expandido de modelos - solo cuando se solicita */}
      {enableModelComparison && showModelSelector && (
        <Flexbox gap={8} horizontal style={{ alignItems: 'center', background: '#f0f9ff', border: '1px solid #3b82f6', borderRadius: '6px', flexWrap: 'wrap', padding: '8px' }}>
          <select
            onChange={(e) => {
              if (e.target.value) {
                const [provider, ...modelParts] = e.target.value.split('|');
                const modelName = modelParts.join('|');
                if (!selectedModels.some(m => m.provider === provider && m.model === modelName)) {
                  setSelectedModels([...selectedModels, { model: modelName, provider }]);
                }
                e.target.value = '';
              }
            }}
            style={{ border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '12px', padding: '4px 8px', width: '280px' }}
            value=""
          >
            <option value="">+ Agregar modelo...</option>
            <optgroup label="🖥️ Ollama (Gratis)">
              {availableModels.filter(m => m.provider === 'ollama').map(m => (
                <option key={`${m.provider}|${m.name}`} value={`${m.provider}|${m.name}`}>{m.name}</option>
              ))}
            </optgroup>
            <optgroup label="🔷 Anthropic">
              {availableModels.filter(m => m.provider === 'anthropic').map(m => (
                <option key={`${m.provider}|${m.name}`} value={`${m.provider}|${m.name}`}>{m.name}</option>
              ))}
            </optgroup>
            <optgroup label="🟢 OpenAI">
              {availableModels.filter(m => m.provider === 'openai').map(m => (
                <option key={`${m.provider}|${m.name}`} value={`${m.provider}|${m.name}`}>{m.name}</option>
              ))}
            </optgroup>
            <optgroup label="🔵 Google">
              {availableModels.filter(m => m.provider === 'google').map(m => (
                <option key={`${m.provider}|${m.name}`} value={`${m.provider}|${m.name}`}>{m.name}</option>
              ))}
            </optgroup>
            <optgroup label="⚡ Groq">
              {availableModels.filter(m => m.provider === 'groq').map(m => (
                <option key={`${m.provider}|${m.name}`} value={`${m.provider}|${m.name}`}>{m.name}</option>
              ))}
            </optgroup>
          </select>
          <button
            onClick={() => setSelectedModels([])}
            style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}
            type="button"
          >
            Limpiar
          </button>
        </Flexbox>
      )}

      {/* Stats Cards - Compactas y colapsables */}
      {stats && (
        <Flexbox gap={8} horizontal style={{ alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', flexWrap: 'wrap', padding: '6px 10px' }}>
          <button
            onClick={() => setShowStats(!showStats)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: 0 }}
            type="button"
          >
            {showStats ? '▼' : '▶'} Stats:
          </button>
          {showStats ? (
            <>
              <span style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', padding: '2px 8px' }}>
                📊 Total: <strong>{stats.total}</strong>
              </span>
              <span style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '4px', color: '#059669', fontSize: '12px', padding: '2px 8px' }}>
                ✓ {stats.passed}
              </span>
              <span style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '12px', padding: '2px 8px' }}>
                ✗ {stats.failed}
              </span>
              <span style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', padding: '2px 8px' }}>
                Score: <strong>{Math.round(stats.avgScore)}%</strong>
              </span>
              <span style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', padding: '2px 8px' }}>
                ⏱ {Math.round(stats.avgTime)}ms
              </span>
            </>
          ) : (
            <span style={{ color: '#6b7280', fontSize: '11px' }}>
              {stats.passed}/{stats.total} passed ({Math.round(stats.avgScore)}%)
            </span>
          )}
        </Flexbox>
      )}

      {/* Filters */}
      <Flexbox gap={8} horizontal>
        <input
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, search: e.target.value || undefined }))
          }
          placeholder="🔍 Buscar pregunta..."
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            flex: 1,
            fontSize: '13px',
            padding: '6px 12px',
          }}
          type="text"
          value={filter.search || ''}
        />
        <select
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, category: e.target.value || undefined }))
          }
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            padding: '6px 12px',
          }}
          value={filter.category || ''}
        >
          <option value="">Todas las categorías</option>
          <option value="eventos">Eventos</option>
          <option value="invitados">Invitados</option>
          <option value="presupuesto">Presupuesto</option>
          <option value="mesas">Mesas</option>
          <option value="general">General</option>
        </select>
        <select
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, difficulty: e.target.value || undefined }))
          }
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            padding: '6px 12px',
          }}
          value={filter.difficulty || ''}
        >
          <option value="">Todas las dificultades</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button
          onClick={selectAll}
          style={{ cursor: 'pointer', fontSize: '12px', padding: '4px 8px' }}
          type="button"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          style={{ cursor: 'pointer', fontSize: '12px', padding: '4px 8px' }}
          type="button"
        >
          Deselect All
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#10b981',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            padding: '6px 12px',
          }}
          type="button"
        >
          + Agregar Pregunta
        </button>
      </Flexbox>

      {/* Tests Table */}
      {tests.length === 0 && !isLoading ? (
        <div style={{
          alignItems: 'center',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          justifyContent: 'center',
          padding: '32px',
          textAlign: 'center',
        }}>
          <div style={{ color: '#9ca3af', fontSize: '48px' }}>📋</div>
          <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>
            No hay tests disponibles
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
            Verifica la conexión con el backend o agrega nuevos tests
          </div>
        </div>
      ) : (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            maxHeight: '500px',
            overflow: 'auto',
            overflowX: 'auto', // Permitir scroll horizontal si es necesario
            width: '100%',
          }}
        >
        <table style={{ borderCollapse: 'collapse', fontSize: '13px', width: '100%' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ fontWeight: 500, padding: '8px', textAlign: 'left', width: '40px' }}>
                <input
                  checked={selectedTests.length === tests.length && tests.length > 0}
                  onChange={() =>
                    selectedTests.length === tests.length ? deselectAll() : selectAll()
                  }
                  type="checkbox"
                />
              </th>
              <th style={{ fontWeight: 500, padding: '8px', textAlign: 'left' }}>Question</th>
              <th style={{ fontWeight: 500, padding: '8px', textAlign: 'left', width: '100px' }}>
                Category
              </th>
              <th style={{ fontWeight: 500, padding: '8px', textAlign: 'center', width: '90px' }}>
                Difficulty
              </th>
              <th style={{ fontWeight: 500, padding: '8px', textAlign: 'center', width: '80px' }}>
                Status
              </th>
              <th style={{ fontWeight: 500, padding: '8px', textAlign: 'center', width: '80px' }}>
                Score
              </th>
              <th style={{ fontWeight: 500, padding: '8px', textAlign: 'center', width: '80px' }}>
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr
                key={test.id}
                style={{
                  background: selectedTests.includes(test.id) ? '#f0f9ff' : '#fff',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <td style={{ padding: '8px' }}>
                  <input
                    checked={selectedTests.includes(test.id)}
                    onChange={() => toggleTestSelection(test.id)}
                    type="checkbox"
                  />
                </td>
                <td style={{ padding: '8px' }}>{test.question}</td>
                <td style={{ padding: '8px' }}>
                  <span
                    style={{
                      background: '#f3f4f6',
                      borderRadius: '4px',
                      color: '#374151',
                      fontSize: '11px',
                      padding: '2px 8px',
                    }}
                  >
                    {test.category}
                  </span>
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {getDifficultyBadge(test.difficulty)}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <span
                    style={{
                      backgroundColor: getStatusBgColor(test.status),
                      border: `1px solid ${getStatusColor(test.status)}40`,
                      borderRadius: '4px',
                      color: getStatusColor(test.status),
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '2px 8px',
                    }}
                  >
                    {test.status}
                  </span>
                </td>
                <td style={{ fontWeight: 500, padding: '8px', textAlign: 'center' }}>
                  {test.score !== undefined ? `${Math.round(test.score)}%` : '-'}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {test.executionTime ? `${test.executionTime}ms` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Flexbox gap={8}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Last Run Results</h3>
          <div
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              maxHeight: '300px',
              overflow: 'auto',
              padding: '12px',
            }}
          >
            {results.map((result, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: `1px solid ${result.passed ? '#d1fae5' : '#fecaca'}`,
                  borderRadius: '6px',
                  marginBottom: '8px',
                  padding: '8px',
                }}
              >
                <Flexbox gap={4}>
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <strong style={{ fontSize: '13px' }}>Test {result.testId}</strong>
                    <span
                      style={{
                        background: result.passed ? '#ecfdf5' : '#fef2f2',
                        borderRadius: '4px',
                        color: result.passed ? '#10b981' : '#ef4444',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '2px 6px',
                      }}
                    >
                      {result.passed ? '✓ PASSED' : '✗ FAILED'}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    Score: {Math.round(result.score)}% | Time: {result.executionTime}ms
                  </div>
                  {result.error && (
                    <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px' }}>
                      Error: {result.error}
                    </div>
                  )}
                </Flexbox>
              </div>
            ))}
          </div>
        </Flexbox>
      )}

      {/* Modal para agregar pregunta */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            left: 0,
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              maxHeight: '90vh',
              maxWidth: '600px',
              overflow: 'auto',
              padding: '24px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>
              Agregar Nueva Pregunta
            </h3>
            <Flexbox gap={12} style={{ flexDirection: 'column' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Pregunta *
                </label>
                <textarea
                  onChange={(e) => setNewQuestion((prev) => ({ ...prev, question: e.target.value }))}
                  placeholder="Ej: presupuesto de pastelería por evento totalizado y desglosado"
                  required
                  rows={3}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    padding: '8px',
                    width: '100%',
                  }}
                  value={newQuestion.question}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Categoría *
                </label>
                <select
                  onChange={(e) => setNewQuestion((prev) => ({ ...prev, category: e.target.value }))}
                  required
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    padding: '6px 12px',
                    width: '100%',
                  }}
                  value={newQuestion.category}
                >
                  <option value="eventos">Eventos</option>
                  <option value="invitados">Invitados</option>
                  <option value="presupuesto">Presupuesto</option>
                  <option value="mesas">Mesas</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Dificultad *
                </label>
                <select
                  onChange={(e) => setNewQuestion((prev) => ({ ...prev, difficulty: e.target.value }))}
                  required
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    padding: '6px 12px',
                    width: '100%',
                  }}
                  value={newQuestion.difficulty}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Respuesta Esperada *
                </label>
                <textarea
                  onChange={(e) => setNewQuestion((prev) => ({ ...prev, expectedResponse: e.target.value }))}
                  placeholder="Ej: Presupuestos con gastos de pastelería, totalizado y desglosado por evento"
                  required
                  rows={2}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    padding: '8px',
                    width: '100%',
                  }}
                  value={newQuestion.expectedResponse}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Keywords (separadas por comas)
                </label>
                <input
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="presupuesto, pastelería, totalizado, desglosado"
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    padding: '6px 12px',
                    width: '100%',
                  }}
                  type="text"
                  value={keywordsInput}
                />
              </div>
              <Flexbox gap={8} horizontal justify="flex-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '8px 16px',
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  disabled={!newQuestion.question || !newQuestion.expectedResponse}
                  onClick={handleAddQuestion}
                  style={{
                    background: !newQuestion.question || !newQuestion.expectedResponse ? '#d1d5db' : '#667eea',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: !newQuestion.question || !newQuestion.expectedResponse ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '8px 16px',
                  }}
                  type="button"
                >
                  Agregar
                </button>
              </Flexbox>
            </Flexbox>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Modal de Comparación de Modelos */}
      {showComparisonModal && comparisonResults && (
        <div
          onClick={() => setShowComparisonModal(false)}
          style={{
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            left: 0,
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              maxHeight: '90vh',
              maxWidth: '1200px',
              overflow: 'auto',
              padding: '24px',
              width: '90%',
            }}
          >
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
                📊 Comparación de Modelos
              </h3>
              <button
                onClick={() => setShowComparisonModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                  padding: '0',
                }}
                type="button"
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>Pregunta:</div>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{comparisonResults.question}</div>
            </div>

            {/* Resumen */}
            {comparisonResults.summary && (
              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'grid',
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  marginBottom: '24px',
                  padding: '16px',
                }}
              >
                <div>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>⚡ Más Rápido</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {comparisonResults.summary.fastest.provider}/{comparisonResults.summary.fastest.model}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    {comparisonResults.summary.fastest.time}ms
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>🏆 Mejor Score</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {comparisonResults.summary.bestScore.provider}/{comparisonResults.summary.bestScore.model}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    {Math.round(comparisonResults.summary.bestScore.score)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>⏱️ Tiempo Promedio</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {comparisonResults.summary.avgTime}ms
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>📊 Score Promedio</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {comparisonResults.summary.avgScore}%
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>✅ Exitosos</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {comparisonResults.summary.successfulModels}/{comparisonResults.summary.totalModels}
                  </div>
                </div>
              </div>
            )}

            {/* Resultados por Modelo - Ordenados por Score (mejor primero) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Flexbox align="center" horizontal justify="space-between">
                <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0' }}>
                  Resultados por Modelo (ordenados por score):
                </h4>
                <label style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', fontSize: '13px', gap: '6px' }}>
                  <input
                    checked={votingEnabled}
                    onChange={(e) => setVotingEnabled(e.target.checked)}
                    type="checkbox"
                  />
                  🗳️ Habilitar votación
                </label>
              </Flexbox>
              {comparisonResults.results && [...comparisonResults.results]
                .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
                .map((result: any, index: number) => {
                  const modelKey = `${result.provider}|${result.model}`;
                  const votes = modelVotes[modelKey]?.votes || 0;
                  const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

                  return (
                    <div
                      key={index}
                      style={{
                        background: index === 0 ? '#fef3c7' : result.error ? '#fef2f2' : result.passed ? '#ecfdf5' : '#fff',
                        border: `2px solid ${index === 0 ? '#f59e0b' : result.error ? '#fecaca' : result.passed ? '#d1fae5' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        padding: '16px',
                        position: 'relative',
                      }}
                    >
                      {/* Badge de ranking */}
                      <div style={{
                        background: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7f32' : '#6b7280',
                        borderRadius: '50%',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 700,
                        height: '28px',
                        left: '-10px',
                        lineHeight: '28px',
                        position: 'absolute',
                        textAlign: 'center',
                        top: '-10px',
                        width: '28px',
                      }}>
                        {index + 1}
                      </div>

                      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ marginLeft: '20px' }}>
                          <div style={{ alignItems: 'center', display: 'flex', fontSize: '15px', fontWeight: 600, gap: '8px' }}>
                            {rankEmoji} {result.provider}/{result.model}
                            {index === 0 && <span style={{ background: '#10b981', borderRadius: '4px', color: '#fff', fontSize: '10px', padding: '2px 6px' }}>MEJOR</span>}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                            ⏱️ {result.executionTime || 0}ms | 📊 Score: {Math.round(result.score || 0)}%
                            {result.tokens && ` | 🔤 ${result.tokens} tokens`}
                            {result.passed && ' | ✅ PASSED'}
                            {result.error && ' | ❌ ERROR'}
                          </div>
                        </div>

                        {/* Botones de votación */}
                        {votingEnabled && !result.error && (
                          <Flexbox gap={8} horizontal>
                            <button
                              onClick={() => {
                                setModelVotes(prev => ({
                                  ...prev,
                                  [modelKey]: {
                                    category: comparisonResults.category || 'general',
                                    votes: (prev[modelKey]?.votes || 0) + 1,
                                  }
                                }));
                              }}
                              style={{
                                alignItems: 'center',
                                background: '#10b981',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                fontSize: '12px',
                                fontWeight: 600,
                                gap: '4px',
                                padding: '6px 12px',
                              }}
                              type="button"
                            >
                              👍 Votar ({votes})
                            </button>
                            <button
                              onClick={() => {
                                setModelVotes(prev => ({
                                  ...prev,
                                  [modelKey]: {
                                    category: comparisonResults.category || 'general',
                                    votes: Math.max(0, (prev[modelKey]?.votes || 0) - 1),
                                  }
                                }));
                              }}
                              style={{
                                background: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '6px 12px',
                              }}
                              type="button"
                            >
                              👎
                            </button>
                          </Flexbox>
                        )}

                        {result.error && (
                          <span
                            style={{
                              background: '#fef2f2',
                              borderRadius: '4px',
                              color: '#dc2626',
                              fontSize: '11px',
                              padding: '4px 8px',
                            }}
                          >
                            ERROR
                          </span>
                        )}
                      </div>
                      {result.error ? (
                        <div style={{ color: '#dc2626', fontSize: '13px', marginLeft: '20px' }}>❌ {result.error}</div>
                      ) : (
                        <div
                          style={{
                            background: '#f9fafb',
                            borderRadius: '6px',
                            color: '#374151',
                            fontSize: '13px',
                            marginLeft: '20px',
                            maxHeight: '200px',
                            overflow: 'auto',
                            padding: '12px',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {result.response || result.actualResponse || '(Sin respuesta)'}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Resumen de votos */}
            {votingEnabled && Object.keys(modelVotes).length > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', marginTop: '16px', padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>🗳️ Resumen de Votos:</h4>
                <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
                  {Object.entries(modelVotes)
                    .sort(([, a], [, b]) => b.votes - a.votes)
                    .map(([key, data]) => (
                      <div
                        key={key}
                        style={{
                          background: '#fff',
                          border: '1px solid #86efac',
                          borderRadius: '6px',
                          fontSize: '12px',
                          padding: '8px 12px',
                        }}
                      >
                        <strong>{key.replace('|', '/')}</strong>: {data.votes} votos
                      </div>
                    ))}
                </Flexbox>
                <div style={{ color: '#059669', fontSize: '11px', marginTop: '8px' }}>
                  💡 Los votos ayudan al sistema a aprender qué modelo funciona mejor para cada tipo de pregunta.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ✅ NUEVO: Estilos CSS para animación de spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Flexbox>
  );
};

export default TestSuite;
