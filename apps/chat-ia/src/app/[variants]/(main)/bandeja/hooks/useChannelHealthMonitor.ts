'use client';

import { useEffect, useRef } from 'react';

import type { InboxChannel } from './useInboxChannels';

export interface ChannelDownEvent {
  channelId: string;
  kind: string;
  label: string;
}

interface UseChannelHealthMonitorOptions {
  channels: InboxChannel[];
  enabled?: boolean;
  onChannelDown: (event: ChannelDownEvent) => void;
  onChannelRecovered: (event: ChannelDownEvent) => void;
}

/**
 * Monitors channel statuses for transitions.
 * When a channel goes from connected to disconnected, fires onChannelDown.
 * When a channel goes from disconnected to connected, fires onChannelRecovered.
 *
 * Does NOT poll the backend — relies on the statuses provided by useInboxChannels,
 * which already polls every 60s. This hook just detects status transitions.
 */
export function useChannelHealthMonitor({
  channels,
  enabled = true,
  onChannelDown,
  onChannelRecovered,
}: UseChannelHealthMonitorOptions) {
  const prevStatusMap = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    for (const ch of channels) {
      if (!ch.status) continue;

      const prev = prevStatusMap.current.get(ch.id);
      const curr = ch.status;

      if (prev !== undefined && prev !== curr) {
        const event: ChannelDownEvent = {
          channelId: ch.id,
          kind: ch.kind,
          label: ch.label,
        };

        if (prev === 'connected' && curr === 'disconnected') {
          onChannelDown(event);
        } else if (prev === 'disconnected' && curr === 'connected') {
          onChannelRecovered(event);
        }
      }

      prevStatusMap.current.set(ch.id, curr);
    }
  }, [channels, enabled, onChannelDown, onChannelRecovered]);
}
