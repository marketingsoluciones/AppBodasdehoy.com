'use client';

import { useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';
import { buildAuthHeaders } from '@/utils/authToken';

const TrainingPanel = () => {
  const [userIdentifier, setUserIdentifier] = useState('bodasdehoy.com@gmail.com');
  const [development, setDevelopment] = useState('bodasdehoy');
  const [testType, setTestType] = useState('quick');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ failed: 0, passed: 0, total: 0 });

  const questions = [
    "¿Cuántos eventos tengo?",
    "Crear evento de boda para el 15/06/2025",
    "Agregar invitado Juan Pérez con email juan@test.com",
    "Ver presupuesto del evento",
    "¿Cuántos invitados confirmados tengo?",
    "Listar todos mis eventos",
    "Modificar fecha del evento al 20/06/2025",
    "Crear tarea 'Reservar salón' para mañana",
    "Exportar lista de invitados",
    "Ver estadísticas de asistencia"
  ];

  const startTest = async () => {
    if (!userIdentifier || !development) {
      alert('Por favor, completa usuario y development');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setStats({ failed: 0, passed: 0, total: 0 });

    const numQuestions = testType === 'quick' ? 5 : testType === 'medium' ? 20 : 50;

    for (let i = 0; i < numQuestions && isRunning; i++) {
      const question = questions[i % questions.length];

      try {
        const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';

        // ✅ CORRECCIÓN: Construir URL correctamente
        let url: URL;
        if (backendURL.startsWith('/')) {
          url = new URL(`${backendURL}/api/chat/send`, window.location.origin);
        } else {
          url = new URL('/api/chat/send', backendURL);
        }

        const response = await fetch(url.toString(), {
          body: JSON.stringify({
            ai_model: 'claude-3-5-sonnet-20241022',
            ai_provider: 'anthropic',
            development: development,
            message: question,
            user_identifier: userIdentifier
          }),
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          method: 'POST'
        });

        const data = await response.json();

        const result = {
          question,
          response: data.message || 'Sin respuesta',
          success: data.success,
          timestamp: new Date().toISOString()
        };

        setResults(prev => [...prev, result]);

        if (data.success) {
          setStats(prev => ({ ...prev, passed: prev.passed + 1, total: prev.total + 1 }));
        } else {
          setStats(prev => ({ ...prev, failed: prev.failed + 1, total: prev.total + 1 }));
        }

        setProgress(((i + 1) / numQuestions) * 100);
      } catch (error) {
        setResults(prev => [...prev, {
          question,
          response: `Error: ${error}`,
          success: false,
          timestamp: new Date().toISOString()
        }]);
        setStats(prev => ({ ...prev, failed: prev.failed + 1, total: prev.total + 1 }));
      }

      await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, 800); });
    }

    setIsRunning(false);
  };

  const stopTest = () => {
    setIsRunning(false);
  };

  const successRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  return (
    <Flexbox gap={16} padding={16} style={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          🧪 Sistema de Entrenamiento
        </h2>
      </Flexbox>

      {/* Configuration */}
      <Flexbox gap={12}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
            Usuario (Email/Teléfono):
          </label>
          <input
            disabled={isRunning}
            onChange={(e) => setUserIdentifier(e.target.value)}
            placeholder="bodasdehoy.com@gmail.com"
            style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px', width: '100%' }}
            type="text"
            value={userIdentifier}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
            Development:
          </label>
          <select
            disabled={isRunning}
            onChange={(e) => setDevelopment(e.target.value)}
            style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px', width: '100%' }}
            title="Seleccionar development"
            value={development}
          >
            <option value="bodasdehoy">Bodas De Hoy</option>
            <option value="eventosorganizador">Eventos Organizador</option>
            <option value="fiestas_especiales">Fiestas Especiales</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
            Tipo de Test:
          </label>
          <select
            disabled={isRunning}
            onChange={(e) => setTestType(e.target.value)}
            style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px', width: '100%' }}
            title="Seleccionar tipo de test"
            value={testType}
          >
            <option value="quick">Rápido - 5 preguntas</option>
            <option value="medium">Mediano - 20 preguntas</option>
            <option value="full">Completo - 50 preguntas</option>
          </select>
        </div>
      </Flexbox>

      {/* Controls */}
      <Flexbox gap={8} horizontal>
        <button
          disabled={isRunning}
          onClick={startTest}
          style={{
            backgroundColor: isRunning ? '#ccc' : '#667eea',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            padding: '10px 20px'
          }}
          type="button"
        >
          {isRunning ? '⏳ Ejecutando...' : '▶️ Ejecutar Test'}
        </button>
        <button
          disabled={!isRunning}
          onClick={stopTest}
          style={{
            backgroundColor: !isRunning ? '#ccc' : '#dc3545',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: !isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            padding: '10px 20px'
          }}
          type="button"
        >
          ⏹️ Detener
        </button>
      </Flexbox>

      {/* Progress */}
      {isRunning && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Progreso:</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{
            backgroundColor: '#e0e0e0',
            borderRadius: '10px',
            height: '20px',
            overflow: 'hidden',
            width: '100%'
          }}>
            <div style={{
              alignItems: 'center',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              fontSize: '12px',
              fontWeight: 'bold',
              height: '100%',
              justifyContent: 'center',
              transition: 'width 0.3s',
              width: `${progress}%`
            }}>
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <Flexbox gap={16} horizontal>
        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', flex: 1, padding: '12px' }}>
          <div style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>
            {stats.total}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>Tests Ejecutados</div>
        </div>
        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', flex: 1, padding: '12px' }}>
          <div style={{ color: '#28a745', fontSize: '24px', fontWeight: 'bold' }}>
            {successRate}%
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>Tasa de Éxito</div>
        </div>
      </Flexbox>

      {/* Results */}
      <div style={{ backgroundColor: '#1e1e1e', borderRadius: '8px', flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ color: '#00ff00', fontFamily: 'monospace', fontSize: '12px' }}>
          {results.length === 0 && <div>Esperando inicio de test...</div>}
          {results.map((result, index) => (
            <div key={index} style={{
              backgroundColor: result.success ? '#28a74520' : '#dc354520',
              borderRadius: '4px',
              color: result.success ? '#28a745' : '#dc3545',
              marginBottom: '8px',
              padding: '8px'
            }}>
              [{new Date(result.timestamp).toLocaleTimeString()}] 🧪 {result.question}
              <br />
              {result.success ? '✅' : '❌'} {result.response.slice(0, 100)}
            </div>
          ))}
        </div>
      </div>
    </Flexbox>
  );
};

export default TrainingPanel;
