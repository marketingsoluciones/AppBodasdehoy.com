import { useEffect } from 'react';

interface UseKeyboardOptions {
  onLeft?: () => void;
  onRight?: () => void;
  onEscape?: () => void;
}

export function useKeyboard({ onLeft, onRight, onEscape }: UseKeyboardOptions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onLeft?.();
      if (e.key === 'ArrowRight') onRight?.();
      if (e.key === 'Escape') onEscape?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onLeft, onRight, onEscape]);
}
