'use client';

import { ActionIcon } from '@lobehub/ui';
import { Popover } from 'antd';
import { LucideIcon } from 'lucide-react';
import { memo, ReactNode } from 'react';

interface ActionPopoverProps {
  content?: ReactNode;
  maxWidth?: number | string;
  minWidth?: number | string;
  placement?: string;
  trigger?: string | string[];
}

interface ActionProps {
  active?: boolean;
  color?: string;
  disabled?: boolean;
  icon?: LucideIcon | ReactNode;
  loading?: boolean;
  onClick?: (e?: any) => void;
  popover?: ActionPopoverProps;
  title?: string;
}

const Action = memo<ActionProps>(({ icon, title, popover, onClick, active, color, disabled, loading }) => {
  const iconNode = (
    <ActionIcon
      {...({ active, disabled, loading, color } as any)}
      icon={icon}
      onClick={(e: any) => {
        if (onClick) return onClick(e);
      }}
      title={title}
      style={color ? ({ '--color-text': color } as any) : undefined}
    />
  );

  if (!popover) return iconNode;

  return (
    <Popover
      arrow={false}
      content={popover.content}
      placement={(popover.placement ?? 'topLeft') as any}
      styles={{
        body: {
          maxWidth: popover.maxWidth,
          minWidth: popover.minWidth,
        },
      }}
      trigger={popover.trigger as any ?? ['hover']}
    >
      {iconNode}
    </Popover>
  );
});

Action.displayName = 'Action';

export default Action;
