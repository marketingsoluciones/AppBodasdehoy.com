import { useState } from 'react';

// Intentar importar el Editor
let Editor: any = null;
let editorError: any = null;

try {
  const editorModule = require('@lobehub/editor/react');
  Editor = editorModule.Editor;
  console.log('[TestEditor] Editor importado exitosamente:', !!Editor);
} catch (err) {
  editorError = err;
  console.error('[TestEditor] Error importando Editor:', err);
}

export default function TestLobeHubEditor() {
  const [value, setValue] = useState('');
  const [editorInstance, setEditorInstance] = useState<any>(null);

  if (editorError) {
    return (
      <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
        <h1>❌ Error al importar @lobehub/editor</h1>
        <pre style={{
          background: '#fee',
          padding: 20,
          borderRadius: 8,
          overflow: 'auto'
        }}>
          {JSON.stringify({
            message: editorError.message,
            stack: editorError.stack?.split('\n').slice(0, 10),
          }, null, 2)}
        </pre>
      </div>
    );
  }

  if (!Editor) {
    return (
      <div style={{ padding: 40 }}>
        <h1>⚠️ Editor no disponible</h1>
        <p>El Editor se importó pero es null o undefined</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <h1>✅ Test del Editor de @lobehub/editor</h1>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 20,
        marginTop: 20,
        minHeight: 200,
      }}>
        <h3>Editor:</h3>
        <Editor
          autoFocus
          content={value}
          onInit={(editor: any) => {
            console.log('[TestEditor] Editor inicializado:', editor);
            setEditorInstance(editor);
          }}
          onChange={() => {
            if (editorInstance) {
              const newValue = editorInstance.getMarkdown?.() || '';
              setValue(newValue);
            }
          }}
          placeholder="Escribe aquí para probar..."
          markdownOption={{
            bold: true,
            italic: true,
            strikethrough: true,
            underline: true,
            code: true,
            header: true,
            quote: true,
          }}
          enablePasteMarkdown={true}
          slashOption={{ enable: true }}
          type="text"
          variant="chat"
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Valor actual (markdown):</h3>
        <pre style={{
          background: '#f5f5f5',
          padding: 10,
          borderRadius: 4,
          overflow: 'auto'
        }}>
          {value || '(vacío)'}
        </pre>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Estado del editor:</h3>
        <ul>
          <li>Editor importado: ✅</li>
          <li>Editor inicializado: {editorInstance ? '✅' : '⏳ Pendiente'}</li>
          <li>Tiene getMarkdown: {editorInstance?.getMarkdown ? '✅' : '❌'}</li>
          <li>Tiene clear: {editorInstance?.clear ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  );
}
