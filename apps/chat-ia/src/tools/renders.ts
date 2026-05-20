import { BuiltinRender } from '@lobechat/types';
import dynamic from 'next/dynamic';

import { CodeInterpreterManifest } from './code-interpreter';
import { DalleManifest } from './dalle';
import { FilterAppViewManifest } from './filter-app-view';
import { FloorPlanEditorManifest } from './floor-plan-editor';
import { VenueVisualizerManifest } from './venue-visualizer';
import { WebBrowsingManifest } from './web-browsing';

// SPRINT-W 2026-05-20: tool renders cargados lazy via next/dynamic.
// Antes: imports estáticos arrastraban @bodasdehoy/memories (276K),
// canvas editor (FloorPlanEditor), sandbox (CodeInterpreter), etc al
// bundle inicial /chat — aunque ninguno se ejecuta hasta que un mensaje
// invoca el tool específico.
// Ahora: cada render solo se carga cuando un mensaje pide ese identifier.
// ssr: false porque son interacciones puramente cliente.

const DalleRender = dynamic(() => import('./dalle/Render'), { ssr: false }) as BuiltinRender;
const WebBrowsing = dynamic(() => import('./web-browsing/Render'), { ssr: false }) as BuiltinRender;
const CodeInterpreterRender = dynamic(() => import('./code-interpreter/Render'), {
  ssr: false,
}) as BuiltinRender;
const VenueVisualizerRender = dynamic(() => import('./venue-visualizer/Render'), {
  ssr: false,
}) as BuiltinRender;
const FloorPlanEditorRender = dynamic(() => import('./floor-plan-editor/Render'), {
  ssr: false,
}) as BuiltinRender;
const FilterAppViewRender = dynamic(() => import('./filter-app-view/Render'), {
  ssr: false,
}) as BuiltinRender;

export const BuiltinToolsRenders: Record<string, BuiltinRender> = {
  [DalleManifest.identifier]: DalleRender,
  [WebBrowsingManifest.identifier]: WebBrowsing,
  [CodeInterpreterManifest.identifier]: CodeInterpreterRender,
  [VenueVisualizerManifest.identifier]: VenueVisualizerRender,
  [FloorPlanEditorManifest.identifier]: FloorPlanEditorRender,
  [FilterAppViewManifest.identifier]: FilterAppViewRender,
};
