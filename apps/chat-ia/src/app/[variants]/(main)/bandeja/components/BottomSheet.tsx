'use client';

/**
 * BottomSheet — overlay 75% altura desde abajo (móvil < md).
 * Diseño handoff v2 (24-jun): sidebar derecho info contacto NO existe en
 * móvil — botón ℹ en header del hilo → abre este sheet.
 *
 * Características:
 *   - Backdrop semitransparente clicable para cerrar
 *   - Drag handle visual (gris ⎯)
 *   - ESC para cerrar
 *   - Atrapa scroll dentro
 *   - Solo se renderiza si open=true (evita reflow innecesario)
 *   - body overflow hidden mientras está abierto
 */
import { useEffect, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Altura como porcentaje del viewport. Default 75. */
  heightPct?: number;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  heightPct = 75,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Bloquea scroll body
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden" role="dialog" aria-modal>
      {/* Backdrop */}
      <button
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        type="button"
      />
      {/* Sheet */}
      <div
        className="relative flex flex-col rounded-t-2xl bg-white shadow-xl"
        style={{ height: `${heightPct}vh` }}
      >
        {/* Drag handle visual */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        {/* Header */}
        {(title || true) && (
          <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-2">
            <span className="text-sm font-semibold text-gray-800">{title ?? 'Detalles'}</span>
            <button
              aria-label="Cerrar"
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>
        )}
        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
