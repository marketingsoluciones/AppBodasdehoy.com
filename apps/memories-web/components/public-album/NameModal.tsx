import { useEffect, useRef, useState } from 'react';

export default function NameModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus input + trap focus + Escape to close
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-modal-title"
    >
      <div ref={dialogRef} className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
        <div className="text-4xl mb-3" aria-hidden="true">📸</div>
        <h2 id="name-modal-title" className="text-xl font-bold text-gray-900 mb-1">¿Cómo te llamas?</h2>
        <p className="text-sm text-gray-500 mb-5">
          Tu nombre aparecerá junto a las fotos que subas.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = name.trim();
            if (trimmed.length >= 2) onConfirm(trimmed);
          }}
          className="space-y-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            aria-label="Tu nombre"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full bg-rose-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-600 disabled:opacity-40 transition"
          >
            Subir foto →
          </button>
          <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition">
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
