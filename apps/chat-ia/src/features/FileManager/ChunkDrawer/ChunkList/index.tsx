import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';
import { Virtuoso } from 'react-virtuoso';

import { useChunksByFileId } from '@/services/apiIa/chunks';

import SkeletonLoading from '../Loading';
import ChunkItem from './ChunkItem';

interface ChunkListProps {
  fileId: string;
}
const ChunkList = memo<ChunkListProps>(({ fileId }) => {
  const { data, isLoading, fetchNextPage } = useChunksByFileId(fileId);

  const dataSource = data?.pages.flatMap((page) => page.items) || [];

  return isLoading ? (
    <SkeletonLoading />
  ) : (
    <Flexbox flex={1}>
      <Virtuoso
        data={dataSource}
        endReached={() => {
          fetchNextPage();
        }}
        itemContent={(index, item) => (
          <Flexbox key={item.id} paddingInline={12}>
            <ChunkItem {...item} index={index} />
          </Flexbox>
        )}
      />
    </Flexbox>
  );
});

export default ChunkList;
