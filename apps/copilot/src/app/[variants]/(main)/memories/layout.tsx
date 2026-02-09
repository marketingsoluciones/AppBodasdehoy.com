import { PropsWithChildren } from 'react';

import { isServerMode } from '@/const/version';

const MemoriesLayout = ({ children }: PropsWithChildren) => {
  if (!isServerMode) {
    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <h2>Memories no disponible</h2>
          <p>Esta funcionalidad solo está disponible en modo servidor.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default MemoriesLayout;
