import { LobeBuiltinTool } from '@lobechat/types';

import { ArtifactsManifest } from './artifacts';
import { CodeInterpreterManifest } from './code-interpreter';
import { DalleManifest } from './dalle';
import { FilterAppViewManifest } from './filter-app-view';
import { FloorPlanEditorManifest } from './floor-plan-editor';
import { VenueVisualizerManifest } from './venue-visualizer';
import { WebBrowsingManifest } from './web-browsing';

// SPRINT-M 2026-05-19: LocalSystemManifest eliminado.
// Bodasdehoy es web puro — local-system tool (read/write/list/rename local files)
// solo aplica a Electron desktop. Manifest + tool/local-system/* + features/LocalFile/
// + store/chat/slices/builtinTool/actions/localSystem.ts eliminados juntos.

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
  {
    hidden: true,
    identifier: FloorPlanEditorManifest.identifier,
    manifest: FloorPlanEditorManifest,
    type: 'builtin',
  },
];
