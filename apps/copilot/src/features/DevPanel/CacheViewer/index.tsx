'use client';

import { Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Center } from 'react-layout-kit';

import DataTable from './DataTable';
import { CachePanelContextProvider } from './cacheProvider';
import { getCacheFiles } from './getCacheEntries';
import { NextCacheFileData } from './schema';

const CacheViewer = () => {
  const [files, setFiles] = useState<NextCacheFileData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCacheFiles = async () => {
      try {
        const cacheFiles = await getCacheFiles();
        setFiles(cacheFiles);
      } catch (error) {
        console.error('Error fetching cache files:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCacheFiles();
  }, []);

  if (loading) {
    return (
      <Center height={'80%'}>
        <Spin />
      </Center>
    );
  }

  if (!files || files.length === 0) {
    return (
      <Center height={'80%'}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Center>
    );
  }

  return (
    <CachePanelContextProvider entries={files}>
      <DataTable />
    </CachePanelContextProvider>
  );
};

export default CacheViewer;
