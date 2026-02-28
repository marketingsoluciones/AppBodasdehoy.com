import { LobeBuiltinTool } from '@lobechat/types';

import { isDesktop } from '@/const/version';

import { ArtifactsManifest } from './artifacts';
import { CodeInterpreterManifest } from './code-interpreter';
import { DalleManifest } from './dalle';
import { FilterAppViewManifest } from './filter-app-view';
import { LocalSystemManifest } from './local-system';
import { VenueVisualizerManifest } from './venue-visualizer';
import { WebBrowsingManifest } from './web-browsing';

export const builtinTools: LobeBuiltinTool[] = [
  {
    identifier: ArtifactsManifest.identifier,
    manifest: ArtifactsManifest,
    type: 'builtin',
  },
  {
    identifier: DalleManifest.identifier,
    manifest: DalleManifest,
    type: 'builtin',
  },
  {
    hidden: !isDesktop,
    identifier: LocalSystemManifest.identifier,
    manifest: LocalSystemManifest,
    type: 'builtin',
  },
  {
    hidden: true,
    identifier: WebBrowsingManifest.identifier,
    manifest: WebBrowsingManifest,
    type: 'builtin',
  },
  {
    identifier: CodeInterpreterManifest.identifier,
    manifest: CodeInterpreterManifest,
    type: 'builtin',
  },
  {
    identifier: VenueVisualizerManifest.identifier,
    manifest: VenueVisualizerManifest,
    type: 'builtin',
  },
  {
    hidden: true,
    identifier: FilterAppViewManifest.identifier,
    manifest: FilterAppViewManifest,
    type: 'builtin',
  },
];
