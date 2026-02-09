/**
 * Página de prueba para verificar que @lobehub/editor funciona
 */
import { useState } from 'react';
import CopilotInputEditorAdvanced from '../components/Copilot/CopilotInputEditorAdvanced';

export default function TestEditor() {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    console.log('Enviando mensaje:', value);
    setIsLoading(true);
    setTimeout(() => {
      setValue('');
      setIsLoading(false);
    }, 1000);
  };

  const handleStop = () => {
    setIsLoading(false);
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    }}>
      <h1 style={{ marginBottom: '20px', color: '#111827' }}>
        Test del Editor Avanzado (@lobehub/editor)
      </h1>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <CopilotInputEditorAdvanced
          value={value}
          onChange={setValue}
          onSend={handleSend}
          onStop={handleStop}
          isLoading={isLoading}
          placeholder="Escribe algo aquí para probar el editor..."
        />
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h3>Valor actual:</h3>
        <pre style={{ backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {value || '(vacío)'}
        </pre>
      </div>
    </div>
  );
}
