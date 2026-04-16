'use client';

import { EditorProvider } from '@lobehub/editor/react';
import { memo } from 'react';

import { ChatInputProvider } from './ChatInputProvider';
import { CopilotInputProvider, type CopilotInputContextValue } from './CopilotInputContext';
import DesktopInput from './DesktopInput';
import { ActionKeys, SendButtonHandler, SendButtonProps } from './store/initialState';

export interface CopilotChatInputProps extends CopilotInputContextValue {
  /** Actions shown in the left toolbar. Defaults to standard copilot set. */
  leftActions?: ActionKeys[];
  /** Called when the user sends a message (Enter or Send button) */
  onSend?: SendButtonHandler;
  /** Props for the send button (generating state + stop handler) */
  sendButtonProps?: SendButtonProps;
  /** Called when markdown content changes (for syncing with parent state) */
  onMarkdownContentChange?: (content: string) => void;
  /** Default height of the editor */
  defaultHeight?: number;
  /** Session key — changing this causes editor to refocus */
  chatKey?: string;
}

const DEFAULT_LEFT_ACTIONS: ActionKeys[] = [
  'search',
  'typo',
  'fileUpload',
  '---',
  ['stt', 'clear', 'history'],
];

const DEFAULT_RIGHT_ACTIONS: ActionKeys[] = [];

const CopilotChatInput = memo<CopilotChatInputProps>(
  ({
    // CopilotInputContext props
    generating,
    onClear,
    onFileUpload,
    onSTTResult,
    onSearchToggle,
    onHistoryToggle,
    searchEnabled,
    fileUploadEnabled = true,
    sttEnabled,
    // ChatInputProvider props
    leftActions = DEFAULT_LEFT_ACTIONS,
    onSend,
    sendButtonProps,
    onMarkdownContentChange,
    defaultHeight,
    chatKey,
  }) => {
    return (
      <CopilotInputProvider
        value={{
          generating,
          fileUploadEnabled,
          onClear,
          onFileUpload,
          onHistoryToggle,
          onSTTResult,
          onSearchToggle,
          searchEnabled,
          sttEnabled,
        }}
      >
        <EditorProvider>
          <ChatInputProvider
            leftActions={leftActions}
            onMarkdownContentChange={onMarkdownContentChange}
            onSend={onSend}
            rightActions={DEFAULT_RIGHT_ACTIONS}
            sendButtonProps={sendButtonProps}
          >
            <DesktopInput chatKey={chatKey} defaultHeight={defaultHeight} />
          </ChatInputProvider>
        </EditorProvider>
      </CopilotInputProvider>
    );
  },
);

CopilotChatInput.displayName = 'CopilotChatInput';

export default CopilotChatInput;
