'use client';

import { GuideCard } from '@lobehub/ui';
import { useThemeMode } from 'antd-style';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';

import { imageUrl } from '@/const/url';
import { useFetchTopics } from '@/hooks/useFetchTopics';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';
import { useUserStore } from '@/store/user';
import { preferenceSelectors } from '@/store/user/selectors';
import { TopicDisplayMode } from '@/types/topic';

import { SkeletonList } from '../../SkeletonList';
import ByTimeMode from './ByTimeMode';
import FlatMode from './FlatMode';
import SearchResult from './SearchResult';
import ExternalChatsMode from './ExternalChatsMode';

const TopicListContent = memo(() => {
  const { t } = useTranslation('topic');
  const { isDarkMode } = useThemeMode();
  const router = useRouter();

  const [topicsInit, topicLength] = useChatStore((s) => [
    s.topicsInit,
    topicSelectors.currentTopicLength(s),
  ]);
  const [isUndefinedTopics, isInSearchMode] = useChatStore((s) => [
    topicSelectors.isUndefinedTopics(s),
    topicSelectors.isInSearchMode(s),
  ]);

  // ✅ NUEVO: Obtener external chats
  const [externalChats, externalChatsInit, currentUserId] = useChatStore((s) => [
    s.externalChats || [],
    s.externalChatsInit,
    s.currentUserId,
  ]);

  const [visible, updateGuideState, topicDisplayMode] = useUserStore((s) => [
    s.preference.guide?.topic,
    s.updateGuideState,
    preferenceSelectors.topicDisplayMode(s),
  ]);

  useFetchTopics();

  if (isInSearchMode) return <SearchResult />;

  // ✅ NUEVO: Si hay external chats disponibles, mostrarlos
  const hasExternalChats = externalChatsInit && externalChats.length > 0;

  if (hasExternalChats) {
    return <ExternalChatsMode />;
  }

  // first time loading or has no data
  if (!topicsInit || isUndefinedTopics) return <SkeletonList />;

  return (
    <>
      {topicLength === 0 && visible && (
        <Flexbox paddingInline={8}>
          <GuideCard
            alt={t('guide.desc')}
            cover={imageUrl(`empty_topic_${isDarkMode ? 'dark' : 'light'}.webp`)}
            coverProps={{
              priority: true,
            }}
            desc={t('guide.desc')}
            height={120}
            onClose={() => {
              updateGuideState({ topic: false });
            }}
            style={{ flex: 'none', marginBottom: 12 }}
            title={t('guide.title')}
            visible={visible}
            width={200}
          />
        </Flexbox>
      )}

      {/* ✅ NUEVO: Si no hay topics locales, mostrar botón para ir a mensajes */}
      {topicLength === 0 && !visible && (
        <Flexbox paddingInline={8} style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <div style={{ color: 'rgba(0,0,0,0.45)', marginBottom: '8px' }}>
            No hay temas disponibles
          </div>
          <div style={{ color: 'rgba(0,0,0,0.25)', fontSize: '12px', marginBottom: '16px' }}>
            Tus conversaciones pueden estar en la bandeja de entrada
          </div>
          <Button
            onClick={() => router.push('/messages')}
            style={{ margin: '0 auto' }}
            type="primary"
          >
            📬 Ver Mensajes
          </Button>
        </Flexbox>
      )}

      {topicLength > 0 && (topicDisplayMode === TopicDisplayMode.ByTime ? <ByTimeMode /> : <FlatMode />)}
    </>
  );
});

TopicListContent.displayName = 'TopicListContent';

export default TopicListContent;
