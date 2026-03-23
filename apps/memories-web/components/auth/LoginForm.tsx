import { useState } from 'react';
import Link from 'next/link';

export default function LoginForm({ onLogin }: { onLogin: (userId: string) => void }) {
  const [email, setEmail] = useState('');
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">📸</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Memories</h1>
        <p className="text-gray-500 text-sm mb-8">Introduce tu email para acceder a tus álbumes.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) onLogin(email.trim());
          }}
          className="space-y-4"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
          />
          <button
            type="submit"
            className="w-full bg-rose-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-600 transition"
          >
            Acceder →
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
