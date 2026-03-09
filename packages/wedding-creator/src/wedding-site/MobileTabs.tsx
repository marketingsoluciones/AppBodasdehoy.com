'use client';

import React from 'react';

/**
 * Mobile Tabs Component
 * ====================
 * Tab navigation for mobile/responsive layout
 * Switches between Chat and Preview panels
 */

export type MobileTabType = 'chat' | 'preview';

interface MobileTabsProps {
  activeTab: MobileTabType;
  chatBadge?: number;
  onTabChange: (tab: MobileTabType) => void; // Number of unread messages
  previewBadge?: boolean; // Show indicator for unsaved changes
}

export function MobileTabs({
  activeTab,
  onTabChange,
  chatBadge,
  previewBadge,
}: MobileTabsProps) {
  return (
    <div className="mobile-tabs flex w-full border-b border-gray-200 bg-white md:hidden">
      <button
        className={`
          relative flex flex-1 items-center justify-center gap-2 px-4 py-3
          text-sm font-medium transition-colors
          ${activeTab === 'chat'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
        onClick={() => onTabChange('chat')}
      >
        <ChatIcon />
        <span>Chat</span>
        {chatBadge && chatBadge > 0 && (
          <span className="absolute right-4 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
            {chatBadge > 99 ? '99+' : chatBadge}
          </span>
        )}
      </button>

      <button
        className={`
          relative flex flex-1 items-center justify-center gap-2 px-4 py-3
          text-sm font-medium transition-colors
          ${activeTab === 'preview'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
        onClick={() => onTabChange('preview')}
      >
        <PreviewIcon />
        <span>Vista Previa</span>
        {previewBadge && (
          <span className="absolute right-4 top-2 h-2 w-2 rounded-full bg-orange-500" />
        )}
      </button>
    </div>
  );
}

// Icons
function ChatIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <path
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

export default MobileTabs;
