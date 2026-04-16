'use client';

import { ChatInputActions, type ChatInputActionsProps } from '@lobehub/editor/react';
import { memo, useMemo } from 'react';

import { ActionKeys } from '../store/initialState';
import { useChatInputStore } from '../store';
import Clear from './Clear';
import History from './History';
import Search from './Search';
import STT from './STT';
import Typo from './Typo';
import Upload from './Upload';

type ActionKey = 'clear' | 'fileUpload' | 'history' | 'search' | 'stt' | 'typo';

const actionMap: Record<ActionKey, React.ComponentType> = {
  clear: Clear,
  fileUpload: Upload,
  history: History,
  search: Search,
  stt: STT,
  typo: Typo,
};

const mapActionsToItems = (keys: ActionKeys[]): ChatInputActionsProps['items'] =>
  keys.map((actionKey, index) => {
    if (typeof actionKey === 'string') {
      if (actionKey === '---') {
        return { key: `divider-${index}`, type: 'divider' };
      }
      const Render = actionMap[actionKey as ActionKey];
      if (!Render) return null;
      return {
        children: <Render key={actionKey} />,
        key: actionKey,
      };
    } else {
      return {
        children: actionKey
          .map((groupActionKey) => {
            const Render = actionMap[groupActionKey as ActionKey];
            if (!Render) return null;
            return { children: <Render key={groupActionKey} />, key: groupActionKey };
          })
          .filter(Boolean),
        key: `group-${index}`,
        type: 'collapse',
      };
    }
  }).filter(Boolean) as ChatInputActionsProps['items'];

const ActionBar = memo(() => {
  const leftActions = useChatInputStore((s) => s.leftActions);
  const items = useMemo(() => mapActionsToItems(leftActions), [leftActions]);

  return (
    <ChatInputActions
      collapseOffset={0}
      defaultGroupCollapse={false}
      groupCollapse={false}
      items={items}
      onGroupCollapseChange={() => {}}
    />
  );
});

ActionBar.displayName = 'ActionBar';

export default ActionBar;
