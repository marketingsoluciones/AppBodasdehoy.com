import { memo } from 'react';

import { BuiltinToolsRenders } from '@/tools/renders';
import { safeParseJSON } from '@/utils/safeParseJSON';

import { useParseContent } from '../useParseContent';

export interface BuiltinTypeProps {
  apiName?: string;
  arguments?: string;
  content: string;
  id: string;
  identifier?: string;
  loading?: boolean;
  pluginError?: any;
  pluginState?: any;
}

const BuiltinType = memo<BuiltinTypeProps>(
  ({
    content,
    arguments: argumentsStr = '',
    pluginState,
    id,
    identifier,
    pluginError,
    apiName,
  }) => {
    const { data } = useParseContent(content);

    const Render = BuiltinToolsRenders[identifier || ''];

    // BUG-CW-N12: si la IA invoca una tool cuyo identifier no está registrado en
    // BuiltinToolsRenders, antes devolvíamos undefined sin más. Eso enmascaraba
    // bugs reales (identifier mal en api-ia, o tool nueva sin registrar aquí).
    // En dev avisamos por consola con el identifier + apiName para diagnosticar.
    if (!Render) {
      if (process.env.NODE_ENV !== 'production' && identifier) {
        console.warn(
          `[BuiltinType] No render registered for identifier="${identifier}" (apiName="${apiName}"). ` +
          `Check src/tools/renders.ts and src/tools/index.ts.`
        );
      }
      return;
    }

    const args = safeParseJSON(argumentsStr);

    return (
      <Render
        apiName={apiName}
        args={args}
        content={data}
        identifier={identifier}
        messageId={id}
        pluginError={pluginError}
        pluginState={pluginState}
      />
    );
  },
);

export default BuiltinType;
