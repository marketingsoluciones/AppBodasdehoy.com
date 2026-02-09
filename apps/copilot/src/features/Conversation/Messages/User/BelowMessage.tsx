import { ActionIcon, Text } from '@lobehub/ui';
import { createStyles, useTheme } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { AlertTriangle, Check, CheckCheck, Clock3, RotateCwIcon, Trash2 } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { DeliveryStatus } from '@/types/message';

interface UserBelowMessageProps {
  content: string;
  deliveryStatus?: DeliveryStatus;
  id: string;
  ragQuery?: string | null;
}

const useStyles = createStyles(({ css, cx, token }) => ({
  action: cx(
    css`
      align-self: flex-end;
      opacity: 0;
    `,
    'rag-query-actions',
  ),
  container: css`
    &:hover {
      .rag-query-actions {
        opacity: 1;
      }
    }
  `,
  content: css`
    overflow-y: scroll;
    flex-wrap: wrap;

    width: 100%;
    max-height: 54px;
    margin-block-start: 6px;
  `,
  statusRow: css`
    align-self: flex-end;
  `,
  wrapper: css`
    gap: ${token.marginXXS}px;
  `,
}));

const STATUS_ICON: Record<DeliveryStatus, typeof Clock3> = {
  error: AlertTriangle,
  pending: Clock3,
  sent: Check,
  synced: CheckCheck,
};

export const UserBelowMessage = memo<UserBelowMessageProps>(
  ({ ragQuery, content, id, deliveryStatus }) => {
    const { styles } = useStyles();
    const theme = useTheme();

    const { t } = useTranslation('chat');

    const [deleteUserMessageRagQuery, rewriteQuery] = useChatStore((s) => [
      s.deleteUserMessageRagQuery,
      s.rewriteQuery,
    ]);

    const status: DeliveryStatus = deliveryStatus ?? 'synced';
    const StatusIcon = STATUS_ICON[status] ?? Check;
    const statusColorMap: Record<DeliveryStatus, string> = {
      error: theme.colorError,
      pending: theme.colorWarning,
      sent: theme.colorTextQuaternary,
      synced: theme.colorSuccess,
    };

    const shouldRenderRag = !!ragQuery && !isEqual(ragQuery, content);
    const statusLabel = t(`deliveryStatus.${status}`);

    const ragNode = useMemo(
      () =>
        shouldRenderRag && (
          <Flexbox className={styles.container}>
            <Flexbox align={'center'} className={styles.content} gap={4} horizontal>
              <Text style={{ fontSize: 12 }} type={'secondary'}>
                {ragQuery}
              </Text>
            </Flexbox>
            <Flexbox className={styles.action} horizontal>
              <ActionIcon
                icon={Trash2}
                onClick={() => {
                  deleteUserMessageRagQuery(id);
                }}
                size={'small'}
                title={t('rag.userQuery.actions.delete')}
              />
              <ActionIcon
                icon={RotateCwIcon}
                onClick={() => {
                  rewriteQuery(id);
                }}
                size={'small'}
                title={t('rag.userQuery.actions.regenerate')}
              />
            </Flexbox>
          </Flexbox>
        ),
      [shouldRenderRag, ragQuery, content, id, deleteUserMessageRagQuery, rewriteQuery, styles, t],
    );

    return (
      <Flexbox align={'flex-end'} className={styles.wrapper}>
        {ragNode}
        <Flexbox align={'center'} className={styles.statusRow} gap={4} horizontal>
          <StatusIcon color={statusColorMap[status]} size={12} strokeWidth={2} />
          <Text style={{ fontSize: 12 }} type={'secondary'}>
            {statusLabel}
          </Text>
        </Flexbox>
      </Flexbox>
    );
  },
);
