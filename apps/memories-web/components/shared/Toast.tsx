import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: 'success' | 'error' | 'info';
}

export default function Toast({ message, onClose, duration = 2500, variant = 'success' }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icon = variant === 'success' ? '✓' : variant === 'error' ? '✗' : 'ℹ';
  const bg = variant === 'error' ? 'bg-red-600' : 'bg-gray-900';

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${bg} text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50`}>
      {icon} {message}
    </div>
  );
}
