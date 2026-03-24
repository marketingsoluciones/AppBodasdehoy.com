'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface ConnectChannelDrawerProps {
  onClose: () => void;
  open: boolean;
}

const CHANNELS = [
  {
    description: 'Recibe y responde mensajes de WhatsApp',
    href: '/settings/integrations#whatsapp',
    icon: '📱',
    key: 'whatsapp',
    label: 'WhatsApp',
  },
  {
    description: 'Conecta tu cuenta de Instagram',
    href: '/settings/integrations#instagram',
    icon: '📷',
    key: 'instagram',
    label: 'Instagram',
  },
  {
    description: 'Conecta tu página de Facebook',
    href: '/settings/integrations#facebook',
    icon: '📘',
    key: 'facebook',
    label: 'Facebook',
  },
  {
    description: 'Conecta un bot de Telegram',
    href: '/settings/integrations#telegram',
    icon: '✈️',
    key: 'telegram',
    label: 'Telegram',
  },
  {
    description: 'Recibe consultas por email',
    href: '/settings/integrations#email',
    icon: '📧',
    key: 'email',
    label: 'Email',
  },
  {
    description: 'Chat web en tu web de boda',
    href: '/settings/integrations#web',
    icon: '🌐',
    key: 'web',
    label: 'Chat Web',
  },
];

export function ConnectChannelDrawer({ onClose, open }: ConnectChannelDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <span className="text-sm font-semibold text-gray-900">Conectar canal</span>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
            type="button"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-3 text-[11px] text-gray-400">
            Conecta tus redes sociales para gestionar todos tus mensajes desde un solo lugar.
          </p>
          <div className="space-y-2">
            {CHANNELS.map((ch) => (
              <Link
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-left transition-colors hover:border-purple-200 hover:bg-purple-50"
                href={ch.href}
                key={ch.key}
                onClick={onClose}
              >
                <span className="shrink-0 text-2xl">{ch.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-800">{ch.label}</div>
                  <div className="text-[10px] text-gray-400">{ch.description}</div>
                </div>
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="m9 18 6-6-6-6" strokeLinecap="round" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-4 py-3">
          <Link
            className="block w-full rounded-lg bg-purple-600 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-purple-700"
            href="/settings/integrations"
            onClick={onClose}
          >
            Gestión avanzada de canales →
          </Link>
        </div>
      </div>
    </>
  );
}
