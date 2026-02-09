import { LOADING_FLAT } from '@lobechat/const';
import { UIChatMessage } from '@lobechat/types';
import { ReactNode, memo, useEffect, useMemo } from 'react';
import { Flexbox } from 'react-layout-kit';

import AuthPromptCard from '@/components/AuthPromptCard';
import { useChatStore } from '@/store/chat';
import { aiChatSelectors, chatSelectors } from '@/store/chat/selectors';
import { usePendingIntent } from '@/hooks/usePendingIntent';

import { DefaultMessage } from '../Default';
import ImageFileListViewer from '../User/ImageFileListViewer';
import FileChunks from './FileChunks';
import IntentUnderstanding from './IntentUnderstanding';
import Reasoning from './Reasoning';
import SearchGrounding from './SearchGrounding';
import Tool from './Tool';

// Patrones que indican que se necesita autenticación
// ⚠️ CUIDADO: Estos patrones deben ser MUY específicos para evitar falsos positivos
// El modelo puede decir "necesito que me confirmes" (legítimo) vs "necesitas registrarte" (auth)
const AUTH_PATTERNS = [
  // Variaciones de "necesitas registrarte/iniciar sesión" (TÚ necesitas, no YO necesito)
  // ✅ Permite "necesitas volver a iniciar sesión", "necesitas iniciar sesión", etc.
  /necesitas\s+[\s\w]*iniciar\s+sesi[oó]n/i,
  /necesitas\s+(una\s+cuenta|registrarte)/i,
  /necesito\s+que\s+te\s+registres/i,
  /debes?\s+(registrarte|iniciar\s+sesi[oó]n)/i,
  /tienes\s+que\s+(registrarte|iniciar\s+sesi[oó]n)/i,
  // Menciona botones de registro/login
  /bot[oó]n\s+de\s+["']?(iniciar\s+sesi[oó]n|registr)/i,
  /["']?registrarse\s+(gratis|ahora)["']?/i,
  // Pide registro primero
  /registr(arte|es)\s+(primero|para\s+continuar)/i,
  /inicia\s+sesi[oó]n\s+(primero|para\s+continuar)/i,
  // ✅ CORREGIDO: Para crear/guardar NECESITAS (no "necesito" del asistente)
  /para\s+(crear|guardar|continuar)\s+.*(necesitas|registr)/i,
  // Una vez que te hayas registrado
  /una\s+vez\s+que\s+te\s+hayas\s+registrado/i,
  // Después de registrarte
  /despu[eé]s\s+de\s+registrarte/i,
  // Sesión expirada (backend devuelve esto)
  /sesi[oó]n\s+ha\s+expirado/i,
  /session_expired/i,
];

export const AssistantMessageContent = memo<
  UIChatMessage & {
    editableContent: ReactNode;
  }
>(({ id, tools, content, chunksList, search, imageList, ...props }) => {
  const editing = useChatStore(chatSelectors.isMessageEditing(id));
  const generating = useChatStore(chatSelectors.isMessageGenerating(id));

  // ✅ NUEVO: Obtener mensajes para encontrar el mensaje anterior del usuario
  const allMessages = useChatStore(chatSelectors.activeBaseChats);
  const { savePendingIntent, hasPendingIntent } = usePendingIntent();

  const isToolCallGenerating = generating && (content === LOADING_FLAT || !content) && !!tools;

  const isReasoning = useChatStore(aiChatSelectors.isMessageInReasoning(id));

  const isIntentUnderstanding = useChatStore(aiChatSelectors.isIntentUnderstanding(id));

  const showSearch = !!search && !!search.citations?.length;
  const showImageItems = !!imageList && imageList.length > 0;

  // Detectar si el mensaje requiere autenticación
  const requiresAuth = useMemo(() => {
    if (!content || typeof content !== 'string') return false;
    return AUTH_PATTERNS.some(pattern => pattern.test(content));
  }, [content]);

  // Extraer la acción que el usuario quería hacer
  const authAction = useMemo(() => {
    if (!content || typeof content !== 'string') return 'continuar';
    const match = content.match(/para\s+(crear|guardar|continuar|ver|acceder)/i);
    return match ? match[1].toLowerCase() : 'continuar';
  }, [content]);

  // ✅ NUEVO: Obtener el mensaje anterior del usuario (para guardar como intención pendiente)
  const previousUserMessage = useMemo(() => {
    if (!requiresAuth || !allMessages || allMessages.length === 0) return null;

    // Encontrar el índice del mensaje actual
    const currentIndex = allMessages.findIndex(m => m.id === id);
    if (currentIndex <= 0) return null;

    // Buscar el mensaje de usuario anterior
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (allMessages[i].role === 'user' && allMessages[i].content) {
        return allMessages[i].content as string;
      }
    }
    return null;
  }, [requiresAuth, allMessages, id]);

  // ✅ NUEVO: Guardar intención pendiente cuando se muestra AuthPromptCard
  useEffect(() => {
    if (requiresAuth && !generating && previousUserMessage && !hasPendingIntent) {
      console.log('💾 [MessageContent] Guardando intención pendiente:', previousUserMessage.slice(0, 50) + '...');
      savePendingIntent(previousUserMessage, {
        action: authAction,
        aiMessage: typeof content === 'string' ? content.slice(0, 200) : '',
        source: 'auth_prompt_card',
      });
    }
  }, [requiresAuth, generating, previousUserMessage, hasPendingIntent, savePendingIntent, authAction, content]);

  // remove \n to avoid empty content
  // refs: https://github.com/lobehub/lobe-chat/pull/6153
  const showReasoning =
    (!!props.reasoning && props.reasoning.content?.trim() !== '') ||
    (!props.reasoning && isReasoning);

  const showFileChunks = !!chunksList && chunksList.length > 0;

  return editing ? (
    <DefaultMessage
      content={content}
      id={id}
      isToolCallGenerating={isToolCallGenerating}
      {...props}
    />
  ) : (
    <Flexbox gap={8} id={id}>
      {showSearch && (
        <SearchGrounding citations={search?.citations} searchQueries={search?.searchQueries} />
      )}
      {showFileChunks && <FileChunks data={chunksList} />}
      {showReasoning && <Reasoning {...props.reasoning} id={id} />}
      {isIntentUnderstanding ? (
        <IntentUnderstanding />
      ) : (
        content && (
          <DefaultMessage
            addIdOnDOM={false}
            content={content}
            id={id}
            isToolCallGenerating={isToolCallGenerating}
            {...props}
          />
        )
      )}
      {/* Mostrar tarjeta de autenticación si el mensaje lo requiere */}
      {requiresAuth && !generating && (
        <AuthPromptCard
          action={authAction}
          messageContent={typeof content === 'string' ? content : ''}
        />
      )}
      {showImageItems && <ImageFileListViewer items={imageList} />}
      {tools && (
        <Flexbox gap={8}>
          {tools.map((toolCall, index) => (
            <Tool
              apiName={toolCall.apiName}
              arguments={toolCall.arguments}
              id={toolCall.id}
              identifier={toolCall.identifier}
              index={index}
              key={toolCall.id}
              messageId={id}
              payload={toolCall}
              type={toolCall.type}
            />
          ))}
        </Flexbox>
      )}
    </Flexbox>
  );
});
