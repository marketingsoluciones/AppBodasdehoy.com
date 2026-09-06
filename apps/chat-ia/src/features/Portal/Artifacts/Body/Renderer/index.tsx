import { Markdown } from '@lobehub/ui';
import dynamic from 'next/dynamic';
import { memo, type ReactNode } from 'react';

import HTMLRenderer from './HTML';
import SVGRender from './SVG';

const ReactRenderer = dynamic(() => import('./React'), { ssr: false });
// SPRINT-AK: Mermaid (~2MB con cytoscape + physics) lazy.
// Solo se invoca cuando type === 'application/lobe.artifacts.mermaid'.
interface MermaidLazyProps {
  children?: ReactNode;
  variant?: string;
}
const Mermaid = dynamic<MermaidLazyProps>(
  () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('@lobehub/ui').then((m: any) => ({ default: m.Mermaid })),
  { ssr: false },
);

const Renderer = memo<{ content: string; type?: string }>(({ content, type }) => {
  switch (type) {
    case 'application/lobe.artifacts.react': {
      return <ReactRenderer code={content} />;
    }

    case 'image/svg+xml': {
      return <SVGRender content={content} />;
    }

    case 'application/lobe.artifacts.mermaid': {
      return <Mermaid variant={'borderless'}>{content}</Mermaid>;
    }

    case 'text/markdown': {
      return <Markdown style={{ overflow: 'auto' }}>{content}</Markdown>;
    }

    default: {
      return <HTMLRenderer htmlContent={content} />;
    }
  }
});

export default Renderer;
