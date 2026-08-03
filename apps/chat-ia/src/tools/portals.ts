import { BuiltinPortal } from '@lobechat/types';

import { EventPanelManifest } from './event-panel';
import EventPanelPortal from './event-panel/Portal';
import { WebBrowsingManifest } from './web-browsing';
import WebBrowsing from './web-browsing/Portal';

export const BuiltinToolsPortals: Record<string, BuiltinPortal> = {
  [EventPanelManifest.identifier]: EventPanelPortal as BuiltinPortal,
  [WebBrowsingManifest.identifier]: WebBrowsing as BuiltinPortal,
};
