/**
 * @bodasdehoy/copilot-shared
 *
 * Shared chat components for BodasdeHoy monorepo.
 * These components are prop-based (controlled) and don't depend on specific stores,
 * making them reusable across different applications.
 */

// Export ChatItem component and types
export { ChatItem } from './ChatItem';
export type {
  ChatItemProps,
  MessageContentProps,
  AvatarProps,
  ActionsProps,
  TitleProps,
  ErrorContentProps,
  LoadingProps,
  BorderSpacingProps,
} from './ChatItem';

// Export InputEditor component and types
export { InputEditor, Placeholder } from './InputEditor';
export type { InputEditorProps, PlaceholderProps } from './InputEditor';

// Export MessageList component and types
export { MessageList } from './MessageList';
export type { MessageListProps, MessageItem } from './MessageList';

// Export theme
export { copilotTheme, brandColors } from './theme';
export type { ThemeConfig } from 'antd';

// Export i18n config
export {
  translations,
  defaultLocale,
  getTranslations,
  t,
  esES,
  enUS
} from './i18n';
export type { Translations, Locale } from './i18n';

// Export types
// export * from './types';

// Export hooks
// export * from './hooks';

// Export utils
// export * from './utils';

// Export full LobeChat-compatible ChatInput for embedding in other apps
export { default as CopilotChatInput } from './ChatInput/CopilotChatInput';
export type { CopilotChatInputProps } from './ChatInput/CopilotChatInput';
export { ChatInputProvider } from './ChatInput/ChatInputProvider';
export { useChatInputStore } from './ChatInput/store';
export { useChatInputEditor } from './ChatInput/hooks/useChatInputEditor';
export { useCopilotInput, CopilotInputProvider } from './ChatInput/CopilotInputContext';
export type { CopilotInputContextValue } from './ChatInput/CopilotInputContext';
export type { ActionKeys, SendButtonHandler, SendButtonProps } from './ChatInput/store/initialState';
