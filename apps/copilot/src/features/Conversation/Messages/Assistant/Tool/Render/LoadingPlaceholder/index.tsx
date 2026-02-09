import { safeParseJSON } from '@lobechat/utils';
import { memo } from 'react';

import { BuiltinToolPlaceholders } from '@/tools/placeholders';
import { getDetailedToolMessage } from '@/utils/toolMessages';

import Arguments from '../Arguments';

interface LoadingPlaceholderProps {
  apiName: string;
  identifier: string;
  loading?: boolean;
  requestArgs?: string;
}

const LoadingPlaceholder = memo<LoadingPlaceholderProps>(
  ({ identifier, requestArgs, apiName, loading }) => {
    const Render = BuiltinToolPlaceholders[identifier || ''];

    if (identifier && Render) {
      return (
        <Render apiName={apiName} args={safeParseJSON(requestArgs) || {}} identifier={identifier} />
      );
    }

    // ✅ NUEVO: Mostrar mensaje descriptivo durante la carga
    const args = safeParseJSON(requestArgs) || {};
    const statusMessage = getDetailedToolMessage(apiName || identifier, args);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
        <div style={{ 
          alignItems: 'center', 
          color: '#666', 
          display: 'flex',
          fontSize: '14px',
          fontWeight: 500,
          gap: '8px'
        }}>
          <span style={{ animation: loading ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
            {statusMessage}
          </span>
        </div>
        <Arguments arguments={requestArgs} shine={loading} />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  },
);

export default LoadingPlaceholder;
