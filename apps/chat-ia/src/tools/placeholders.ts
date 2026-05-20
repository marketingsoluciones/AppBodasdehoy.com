import { BuiltinPlaceholder } from '@lobechat/types';

import { WebBrowsingManifest } from './web-browsing';
import WebBrowsing from './web-browsing/Placeholder';

// SPRINT-M 2026-05-19: LocalSystem placeholder eliminado — bodasdehoy es web,
// local-system tool desktop-only ya no se registra.

export const BuiltinToolPlaceholders: Record<string, BuiltinPlaceholder> = {
  [WebBrowsingManifest.identifier]: WebBrowsing as BuiltinPlaceholder,
};
