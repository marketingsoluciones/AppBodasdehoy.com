'use client';

import { Avatar, Icon, Text } from '@lobehub/ui';
import { useTheme } from 'antd-style';
import {
  InboxIcon,
  SearchIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  RefreshCwIcon,
  SortAscIcon,
  SortDescIcon
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';
import { Input, Select, Button, Segmented, Tooltip, message } from 'antd';
import Balancer from 'react-wrap-balancer';

import Loading from '@/components/Loading/CircleLoading';
import { listEventFiles, getCurrentEventId, type StorageFile, deleteFile } from '@/services/storage-r2';
import { formatSize } from '@/utils/format';

import StorageFileItem from './Item';

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
type ViewMode = 'grid' | 'list';

const StorageFileList = () => {
  const { t } = useTranslation('portal');
  const theme = useTheme();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [allFiles, setAllFiles] = useState<StorageFile[]>([]); // Todos los archivos sin filtrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'photos' | 'documents' | 'videos' | 'audio' | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshing, setRefreshing] = useState(false);

  const eventId = useMemo(() => getCurrentEventId(), []);

  const loadFiles = useCallback(async (eventIdToUse: string, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const result = await listEventFiles(eventIdToUse, fileType);

      if (result.success) {
        setAllFiles(result.files || []);
        setFiles(result.files || []);
      } else {
        setError(result.error || 'Error cargando archivos');
        setAllFiles([]);
        setFiles([]);
      }
    } catch (err: any) {
      console.error('❌ Error cargando archivos:', err);
      setError(err.message || 'Error desconocido');
      setAllFiles([]);
      setFiles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fileType]);

  useEffect(() => {
    const eventIdToUse = eventId || 'default';
    loadFiles(eventIdToUse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, fileType]);

  // Filtrar y ordenar archivos
  useEffect(() => {
    let filtered = [...allFiles];

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file =>
        file.originalFilename.toLowerCase().includes(query)
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': {
          return a.originalFilename.localeCompare(b.originalFilename);
        }
        case 'name_desc': {
          return b.originalFilename.localeCompare(a.originalFilename);
        }
        case 'size_asc': {
          return a.sizeBytes - b.sizeBytes;
        }
        case 'size_desc': {
          return b.sizeBytes - a.sizeBytes;
        }
        case 'date_asc': {
          return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
        }
        case 'date_desc': {
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        }
        default: {
          return 0;
        }
      }
    });

    setFiles(filtered);
  }, [allFiles, searchQuery, sortBy]);

  const handleRefresh = useCallback(() => {
    const eventIdToUse = eventId || 'default';
    loadFiles(eventIdToUse, false);
  }, [eventId, loadFiles]);

  const handleDelete = useCallback(async (fileId: string) => {
    try {
      const result = await deleteFile(fileId, eventId || undefined);
      if (result.success) {
        message.success('Archivo eliminado correctamente');
        handleRefresh();
      } else {
        message.error(result.error || 'Error eliminando archivo');
      }
    } catch {
      message.error('Error eliminando archivo');
    }
  }, [eventId, handleRefresh]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalSize = allFiles.reduce((sum, file) => sum + file.sizeBytes, 0);
    const photos = allFiles.filter(f => f.fileType.startsWith('image/')).length;
    const videos = allFiles.filter(f => f.fileType.startsWith('video/')).length;
    const documents = allFiles.filter(f => !f.fileType.startsWith('image/') && !f.fileType.startsWith('video/') && !f.fileType.startsWith('audio/')).length;
    const audio = allFiles.filter(f => f.fileType.startsWith('audio/')).length;

    return { audio, documents, photos, total: allFiles.length, totalSize, videos };
  }, [allFiles]);

  if (loading) {
    return (
      <Flexbox gap={12} paddingInline={12}>
        <Loading />
      </Flexbox>
    );
  }

  if (error) {
    return (
      <Center
        gap={8}
        paddingBlock={24}
        style={{ border: `1px dashed ${theme.colorError}`, borderRadius: 8, marginInline: 12 }}
      >
        <Text type={'danger'}>{error}</Text>
        <Button onClick={handleRefresh} size="small">
          Reintentar
        </Button>
      </Center>
    );
  }

  return (
    <Flexbox gap={12}>
      {/* Barra de herramientas */}
      <Flexbox gap={8} horizontal paddingInline={12} style={{ flexWrap: 'wrap' }}>
        {/* Búsqueda */}
        <Input
          allowClear
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar archivos..."
          prefix={<Icon icon={SearchIcon} size="small" />}
          style={{ flex: 1, minWidth: 200 }}
          value={searchQuery}
        />

        {/* Filtro por tipo */}
        <Select
          allowClear
          onChange={setFileType}
          placeholder="Tipo de archivo"
          style={{ width: 150 }}
          suffixIcon={<Icon icon={FilterIcon} size="small" />}
          value={fileType}
        >
          <Select.Option value="photos">Imágenes</Select.Option>
          <Select.Option value="documents">Documentos</Select.Option>
          <Select.Option value="videos">Videos</Select.Option>
          <Select.Option value="audio">Audio</Select.Option>
        </Select>

        {/* Ordenamiento */}
        <Select
          onChange={setSortBy}
          style={{ width: 180 }}
          suffixIcon={<Icon icon={sortBy.includes('desc') ? SortDescIcon : SortAscIcon} size="small" />}
          value={sortBy}
        >
          <Select.Option value="date_desc">Más recientes</Select.Option>
          <Select.Option value="date_asc">Más antiguos</Select.Option>
          <Select.Option value="name_asc">Nombre A-Z</Select.Option>
          <Select.Option value="name_desc">Nombre Z-A</Select.Option>
          <Select.Option value="size_desc">Mayor tamaño</Select.Option>
          <Select.Option value="size_asc">Menor tamaño</Select.Option>
        </Select>

        {/* Vista */}
        <Segmented
          onChange={(v) => setViewMode(v as ViewMode)}
          options={[
            { icon: <Icon icon={ListIcon} size="small" />, value: 'list' },
            { icon: <Icon icon={GridIcon} size="small" />, value: 'grid' },
          ]}
          value={viewMode}
        />

        {/* Refrescar */}
        <Tooltip title="Actualizar">
          <Button
            icon={<Icon icon={RefreshCwIcon} />}
            loading={refreshing}
            onClick={handleRefresh}
            type="text"
          />
        </Tooltip>
      </Flexbox>

      {/* Estadísticas */}
      {stats.total > 0 && (
        <Flexbox gap={8} horizontal paddingInline={12} style={{ color: theme.colorTextSecondary, fontSize: '12px' }}>
          <Text type="secondary">
            {stats.total} archivo{stats.total !== 1 ? 's' : ''} • {formatSize(stats.totalSize)}
          </Text>
          {stats.photos > 0 && <Text type="secondary">• {stats.photos} imagen{stats.photos !== 1 ? 'es' : ''}</Text>}
          {stats.videos > 0 && <Text type="secondary">• {stats.videos} video{stats.videos !== 1 ? 's' : ''}</Text>}
          {stats.documents > 0 && <Text type="secondary">• {stats.documents} documento{stats.documents !== 1 ? 's' : ''}</Text>}
        </Flexbox>
      )}

      {/* Lista de archivos */}
      {files.length === 0 ? (
        <Center
          gap={8}
          paddingBlock={24}
          style={{ border: `1px dashed ${theme.colorSplit}`, borderRadius: 8, marginInline: 12 }}
        >
          <Avatar
            avatar={<Icon icon={InboxIcon} size={'large'} />}
            background={theme.colorFillTertiary}
            size={48}
          />
          <Balancer>
            <Text type={'secondary'}>
              {searchQuery || fileType
                ? 'No se encontraron archivos con los filtros seleccionados'
                : t('emptyKnowledgeList')}
            </Text>
          </Balancer>
        </Center>
      ) : (
        <Flexbox
          gap={viewMode === 'grid' ? 16 : 12}
          paddingInline={12}
          style={viewMode === 'grid' ? {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
          } : {}}
        >
          {files.map((file) => (
            <StorageFileItem
              file={file}
              key={file.fileId}
              onDelete={handleDelete}
              viewMode={viewMode}
            />
          ))}
        </Flexbox>
      )}
    </Flexbox>
  );
};

export default StorageFileList;
