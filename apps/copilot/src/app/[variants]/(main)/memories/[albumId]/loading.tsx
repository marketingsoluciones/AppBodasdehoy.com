import { Skeleton } from 'antd';
import { memo } from 'react';

const AlbumLoading = memo(() => {
  return (
    <div style={{ margin: '0 auto', maxWidth: 1400, padding: 24 }}>
      <Skeleton active paragraph={{ rows: 4 }} />
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginTop: 20 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton.Image
            active
            key={i}
            style={{ aspectRatio: '1', height: 'auto', width: '100%' }}
          />
        ))}
      </div>
    </div>
  );
});

AlbumLoading.displayName = 'AlbumLoading';

export default AlbumLoading;
















































