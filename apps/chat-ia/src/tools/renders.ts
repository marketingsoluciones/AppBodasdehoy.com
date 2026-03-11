import { BuiltinRender } from '@lobechat/types';

import { CodeInterpreterManifest } from './code-interpreter';
import CodeInterpreterRender from './code-interpreter/Render';
import { DalleManifest } from './dalle';
import DalleRender from './dalle/Render';
import { LocalSystemManifest } from './local-system';
import LocalFilesRender from './local-system/Render';
import { FloorPlanEditorManifest } from './floor-plan-editor';
import FloorPlanEditorRender from './floor-plan-editor/Render';
import { VenueVisualizerManifest } from './venue-visualizer';
import VenueVisualizerRender from './venue-visualizer/Render';
import { WebBrowsingManifest } from './web-browsing';
import WebBrowsing from './web-browsing/Render';

export const BuiltinToolsRenders: Record<string, BuiltinRender> = {
  [DalleManifest.identifier]: DalleRender as BuiltinRender,
  [WebBrowsingManifest.identifier]: WebBrowsing as BuiltinRender,
  [LocalSystemManifest.identifier]: LocalFilesRender as BuiltinRender,
  [CodeInterpreterManifest.identifier]: CodeInterpreterRender as BuiltinRender,
  [VenueVisualizerManifest.identifier]: VenueVisualizerRender as BuiltinRender,
  [FloorPlanEditorManifest.identifier]: FloorPlanEditorRender as BuiltinRender,
};
