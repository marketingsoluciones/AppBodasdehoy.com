'use client';

import {
  INSERT_MENTION_COMMAND,
  INSERT_TABLE_COMMAND,
  ReactCodePlugin,
  ReactCodeblockPlugin,
  ReactHRPlugin,
  ReactLinkHighlightPlugin,
  ReactListPlugin,
  ReactMathPlugin,
  ReactTablePlugin,
} from '@lobehub/editor';
import { Editor, FloatMenu, SlashMenu, useEditorState } from '@lobehub/editor/react';
import { css, cx } from 'antd-style';
import { Table2Icon } from 'lucide-react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatInputStore, useStoreApi } from '../store';
import { useCopilotInput } from '../CopilotInputContext';
import Placeholder from './Placeholder';

const className = cx(css`
  p {
    margin-block-end: 0;
  }
`);

const InputEditor = memo<{ defaultRows?: number }>(({ defaultRows = 2 }) => {
  const [editor, slashMenuRef, send, updateMarkdownContent, expand, mentionItems] =
    useChatInputStore((s) => [
      s.editor,
      s.slashMenuRef,
      s.handleSendButton,
      s.updateMarkdownContent,
      s.expand,
      s.mentionItems,
    ]);

  const storeApi = useStoreApi();
  const state = useEditorState(editor);
  const { onSTTResult } = useCopilotInput();
  const { t } = useTranslation('editor');

  const isChineseInput = useRef(false);

  const enableMention = !!mentionItems && mentionItems.length > 0;

  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (!state.isEmpty) {
        e.returnValue = 'You are typing something, are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [state.isEmpty]);

  // Rich render enabled by default in copilot context
  const richRenderProps = useMemo(
    () => ({
      plugins: [
        ReactListPlugin,
        ReactCodePlugin,
        ReactCodeblockPlugin,
        ReactHRPlugin,
        ReactLinkHighlightPlugin,
        ReactTablePlugin,
        Editor.withProps(ReactMathPlugin, {
          renderComp: expand
            ? undefined
            : (props: any) => (
                <FloatMenu
                  {...props}
                  getPopupContainer={() => (slashMenuRef as any)?.current}
                />
              ),
        }),
      ],
    }),
    [expand, slashMenuRef],
  );

  return (
    <Editor
      autoFocus
      className={className}
      content={''}
      editor={editor}
      {...richRenderProps}
      mentionOption={
        enableMention
          ? {
              items: mentionItems,
              markdownWriter: (mention) =>
                `<mention name="${mention.label}" id="${mention.metadata.id}" />`,
              onSelect: (editor, option) => {
                editor.dispatchCommand(INSERT_MENTION_COMMAND, {
                  label: String(option.label),
                  metadata: option.metadata,
                });
              },
              renderComp: expand
                ? undefined
                : (props: any) => (
                    <SlashMenu
                      {...props}
                      getPopupContainer={() => (slashMenuRef as any)?.current}
                    />
                  ),
            }
          : undefined
      }
      onChange={() => {
        updateMarkdownContent();
      }}
      onCompositionEnd={() => {
        isChineseInput.current = false;
      }}
      onCompositionStart={() => {
        isChineseInput.current = true;
      }}
      onFocus={() => {}}
      onBlur={() => {}}
      onInit={(editor) => storeApi.setState({ editor })}
      onPressEnter={({ event: e }) => {
        if (e.shiftKey || isChineseInput.current) return;
        const commandKey = e.metaKey || e.ctrlKey;
        // Default: Enter to send, Shift+Enter for newline
        if (!commandKey) {
          send();
          return true;
        }
      }}
      placeholder={<Placeholder />}
      slashOption={{
        items: [
          {
            icon: Table2Icon,
            key: 'table',
            label: t('typobar.table'),
            onSelect: (editor) => {
              editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' });
            },
          },
        ],
        renderComp: expand
          ? undefined
          : (props: any) => (
              <SlashMenu
                {...props}
                getPopupContainer={() => (slashMenuRef as any)?.current}
              />
            ),
      }}
      style={{
        minHeight: defaultRows > 1 ? defaultRows * 23 : undefined,
      }}
      type={'text'}
      variant={'chat'}
    />
  );
});

InputEditor.displayName = 'InputEditor';

export default InputEditor;
