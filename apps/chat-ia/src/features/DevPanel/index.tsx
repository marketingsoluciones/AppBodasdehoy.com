import {
  BookText,
  Cog,
  DatabaseIcon,
  FileText,
  FlagIcon,
  GlobeLockIcon,
  Library,
  Palette,
  Wrench,
} from 'lucide-react';

import BrandingAdmin from './BrandingAdmin';
import CacheViewer from './CacheViewer';
import FeatureFlagViewer from './FeatureFlagViewer';
import KBAdmin from './KBAdmin';
import MetadataViewer from './MetadataViewer';
import PostgresViewer from './PostgresViewer';
import PromptConfig from './PromptConfig';
import SystemInspector from './SystemInspector';
import ToolsPanel from './ToolsPanel';
import FloatPanel from './features/FloatPanel';

const DevPanel = () => (
  <FloatPanel
    items={[
      {
        children: <PostgresViewer />,
        icon: <DatabaseIcon size={16} />,
        key: 'Postgres Viewer',
      },
      {
        children: <MetadataViewer />,
        icon: <BookText size={16} />,
        key: 'SEO Metadata',
      },
      {
        children: <CacheViewer />,
        icon: <GlobeLockIcon size={16} />,
        key: 'NextJS Caches',
      },
      {
        children: <FeatureFlagViewer />,
        icon: <FlagIcon size={16} />,
        key: 'Feature Flags',
      },
      {
        children: <SystemInspector />,
        icon: <Cog size={16} />,
        key: 'System Status',
      },
      {
        children: <ToolsPanel />,
        icon: <Wrench size={16} />,
        key: 'Tools',
      },
      {
        children: <PromptConfig />,
        icon: <FileText size={16} />,
        key: 'Prompt Config',
      },
      {
        children: <KBAdmin />,
        icon: <Library size={16} />,
        key: 'KB Admin',
      },
      {
        children: <BrandingAdmin />,
        icon: <Palette size={16} />,
        key: 'Branding',
      },
    ]}
  />
);

export default DevPanel;
