import { BuiltinRenderProps } from '@lobechat/types';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { VenueVisualizerItem } from '@/types/tool/venueVisualizer';

import VenueItem from './Item';

const VenueVisualizerRender = memo<BuiltinRenderProps<VenueVisualizerItem[]>>(
  ({ content, messageId }) => {
    if (!content || content.length === 0) return null;

    return (
      <Flexbox gap={12} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {content.map((item, index) => (
          <VenueItem
            key={`${item.style}-${item.roomType}-${index}`}
            messageId={messageId}
            {...item}
          />
        ))}
      </Flexbox>
    );
  },
);

export default VenueVisualizerRender;
