import { MarkdownProps } from '@lobehub/ui';
import { EditableMessage } from '@lobehub/ui/chat';
import { useResponsive } from 'antd-style';
import { type ReactNode, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useStyles } from '../style';
import { ChatItemProps } from '../type';

export interface MessageContentProps {
  disabled?: ChatItemProps['disabled'];
  editing?: ChatItemProps['editing'];
  /**
   * @description Font size for message content
   * @default 14
   */
  fontSize?: number;
  id: string;
  markdownProps?: Omit<MarkdownProps, 'className' | 'style' | 'children'>;
  message?: ReactNode;
  messageExtra?: ChatItemProps['messageExtra'];
  /**
   * @description Callback when message content changes
   */
  onChange?: (value: string) => void;
  onDoubleClick?: ChatItemProps['onDoubleClick'];
  /**
   * @description Callback when editing state changes
   */
  onEditingChange?: (editing: boolean) => void;
  placement?: ChatItemProps['placement'];
  primary?: ChatItemProps['primary'];
  renderMessage?: ChatItemProps['renderMessage'];
  variant?: ChatItemProps['variant'];
}

const MessageContent = memo<MessageContentProps>(
  ({
    editing,
    fontSize = 14,
    id,
    message,
    onChange,
    onDoubleClick,
    onEditingChange,
    placement,
    messageExtra,
    renderMessage,
    variant,
    primary,
    markdownProps,
    disabled,
  }) => {
    const { t } = useTranslation('common');
    const { cx, styles } = useStyles({ disabled, editing, placement, primary, variant });
    const { mobile } = useResponsive();
    const text = useMemo(
      () => ({
        cancel: t('cancel'),
        confirm: t('ok'),
        edit: t('edit'),
      }),
      [],
    );

    const handleChange = (value: string) => {
      onChange?.(value);
    };
    const handleEditingChange = (edit: boolean) => {
      onEditingChange?.(edit);
    };

    const content = (
      <EditableMessage
        classNames={{ input: styles.editingInput }}
        editButtonSize={'small'}
        editing={editing}
        fontSize={fontSize}
        fullFeaturedCodeBlock
        markdownProps={markdownProps}
        onChange={handleChange}
        onEditingChange={handleEditingChange}
        openModal={mobile ? editing : undefined}
        text={text}
        value={message ? String(message) : ''}
      />
    );
    const messageContent = renderMessage ? renderMessage(content) : content;

    return (
      <Flexbox
        className={cx(styles.message, editing && styles.editingContainer)}
        onDoubleClick={onDoubleClick}
      >
        {messageContent}
        {messageExtra && !editing ? (
          <div className={styles.messageExtra}>{messageExtra}</div>
        ) : null}
      </Flexbox>
    );
  },
);

export default MessageContent;
