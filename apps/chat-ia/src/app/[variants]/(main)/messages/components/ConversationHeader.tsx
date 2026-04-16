'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversations } from '../hooks/useConversations';
import { useConversationActions } from '../hooks/useConversationActions';
import { ChannelBadge } from './ChannelBadge';

interface ConversationHeaderProps {
  channel?: string;
  conversationId: string;
  onSearchFilter?: (term: string) => void;
}

export function ConversationHeader({ channel, conversationId, onSearchFilter }: ConversationHeaderProps) {
  const { conversations } = useConversations(channel ?? null);
  const conversation = conversations.find((c) => c.id === conversationId);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Keyboard shortcuts: Ctrl+K to open search, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        if (searchOpen) closeSearch();
        if (menuOpen) setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchOpen, menuOpen]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    onSearchFilter?.(value);
  }, [onSearchFilter]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm('');
    onSearchFilter?.('');
  };

  const { isMuted, toggleArchive, toggleMute, clearChat } = useConversationActions();
  const conversationMuted = isMuted(conversationId);

  const handleMenuAction = (action: string) => {
    setMenuOpen(false);
    switch (action) {
      case 'archive': {
        toggleArchive(conversationId);
        break;
      }
      case 'mute': {
        toggleMute(conversationId);
        break;
      }
      case 'clear': {
        clearChat(conversationId);
        break;
      }
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-500">Cargando...</div>
      </div>
    );
  }

  // Simulate online status based on recent activity
  const lastMsgTime = new Date(conversation.lastMessage.timestamp).getTime();
  const minutesAgo = (Date.now() - lastMsgTime) / 60_000;
  const isOnline = minutesAgo < 5;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4">
        {/* Left: Contact Info */}
        <div className="flex items-center gap-3">
          {/* Avatar with presence */}
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
              {conversation.contact.name.charAt(0).toUpperCase()}
            </div>
            <span
              aria-label={isOnline ? 'En línea' : 'Desconectado'}
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                isOnline ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">
                {conversation.contact.name}
              </h2>
              <ChannelBadge channel={conversation.channel} size="sm" />
            </div>
            <p className="text-xs text-gray-500">
              {isOnline ? (
                <span className="text-green-600 font-medium">En línea</span>
              ) : (
                conversation.contact.phone || conversation.contact.username || 'Sin info de contacto'
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors ${
              searchOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}
            title="Buscar en conversación"
            type="button"
          >
            🔍
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-gray-300 cursor-not-allowed"
            disabled
            title="Llamar (próximamente)"
            type="button"
          >
            📞
          </button>

          {/* More options menu */}
          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors ${
                menuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              title="Más opciones"
              type="button"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="menu">
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => handleMenuAction('archive')}
                  type="button"
                >
                  📦 Archivar conversación
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => handleMenuAction('mute')}
                  type="button"
                >
                  {conversationMuted ? '🔔 Activar sonido' : '🔇 Silenciar'}
                </button>
                <div className="my-1 h-px bg-gray-100" />
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => handleMenuAction('clear')}
                  type="button"
                >
                  🗑️ Limpiar chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline search bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar mensajes..."
            ref={searchInputRef}
            type="text"
            value={searchTerm}
          />
          {searchTerm && (
            <button
              className="text-xs text-gray-400 hover:text-gray-600"
              onClick={closeSearch}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
