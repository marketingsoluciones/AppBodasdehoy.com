import { CSSProperties, memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import AnimatedCollapsed from '@/components/AnimatedCollapsed';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';

import Inspectors from './Inspector';
import Render from './Render';

// Builtin tools that execute silently — hide their UI from the chat bubble
const SILENT_BUILTIN_TOOLS = ['lobe-filter-app-view', 'lobe-venue-visualizer'];

export interface InspectorProps {
  apiName: string;
  arguments?: string;
  id: string;
  identifier: string;
  index: number;
  messageId: string;
  payload: object;
  style?: CSSProperties;
  type?: string;
}

const Tool = memo<InspectorProps>(
  ({ arguments: requestArgs, apiName, messageId, id, index, identifier, style, payload, type }) => {
    // Hooks must be called unconditionally before any conditional return (Rules of Hooks)
    const [showDetail, setShowDetail] = useState(type !== 'mcp');
    const [showPluginRender, setShowPluginRender] = useState(false);
    const isLoading = useChatStore(chatSelectors.isInToolsCalling(messageId, index));
    const isSilent = SILENT_BUILTIN_TOOLS.includes(identifier);

    // useEffect must be called unconditionally (Rules of Hooks) — guard inside
    useEffect(() => {
      if (isSilent || type !== 'mcp') return;

      setTimeout(
        () => {
          setShowDetail(isLoading);
        },
        isLoading ? 1 : 1500,
      );
    }, [isLoading, isSilent]);

    if (isSilent) return null;

    return (
      <Flexbox gap={8} style={style}>
        <Inspectors
          apiName={apiName}
          arguments={requestArgs}
          // mcp don't have ui render
          hidePluginUI={type === 'mcp'}
          id={id}
          identifier={identifier}
          index={index}
          messageId={messageId}
          payload={payload}
          setShowPluginRender={setShowPluginRender}
          setShowRender={setShowDetail}
          showPluginRender={showPluginRender}
          showRender={showDetail}
        />
        <AnimatedCollapsed open={showDetail}>
          <Render
            apiName={apiName}
            identifier={identifier}
            messageId={messageId}
            requestArgs={requestArgs}
            setShowPluginRender={setShowPluginRender}
            showPluginRender={showPluginRender}
            toolCallId={id}
            toolIndex={index}
          />
        </AnimatedCollapsed>
      </Flexbox>
    );
  },
);

Tool.displayName = 'AssistantTool';

export default Tool;
