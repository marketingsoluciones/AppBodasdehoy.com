import { useState } from 'react';
import Link from 'next/link';

export default function LoginForm({ onLogin }: { onLogin: (userId: string) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      await onLogin(email.trim());
      // No resetear loading — el componente se desmontará cuando el parent detecte userId
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">📸</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Memories</h1>
        <p className="text-gray-500 text-sm mb-8">Introduce tu email para acceder a tus álbumes.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoFocus
            disabled={loading}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-600 disabled:opacity-70 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Accediendo…
              </>
            ) : 'Acceder →'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/" className="text-rose-500 hover:underline">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
