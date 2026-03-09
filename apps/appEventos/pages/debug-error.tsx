import { useEffect, useState } from 'react';

export default function DebugError() {
  const [errors, setErrors] = useState<any[]>([]);
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    // Capturar errores globales
    const handleError = (event: ErrorEvent) => {
      setErrors(prev => [...prev, {
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
        stack: event.error?.stack
      }]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setErrors(prev => [...prev, {
        type: 'unhandledRejection',
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      }]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Info del entorno
    setInfo({
      hostname: window.location.hostname,
      href: window.location.href,
      userAgent: navigator.userAgent,
      nextPublicDirectory: process.env.NEXT_PUBLIC_DIRECTORY,
      nextPublicChat: process.env.NEXT_PUBLIC_CHAT,
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Debug Error Page</h1>

      <h2>Environment Info</h2>
      <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(info, null, 2)}
      </pre>

      <h2>Errors Captured ({errors.length})</h2>
      {errors.length === 0 ? (
        <p>No errors captured yet</p>
      ) : (
        errors.map((error, i) => (
          <div key={i} style={{ background: '#ffe0e0', padding: '10px', marginBottom: '10px', border: '1px solid red' }}>
            <strong>Error #{i + 1} ({error.type})</strong>
            <pre style={{ overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        ))
      )}
    </div>
  );
}
