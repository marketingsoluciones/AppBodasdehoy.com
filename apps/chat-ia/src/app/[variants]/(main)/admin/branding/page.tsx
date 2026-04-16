'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Image,
  message,
  Tabs,
  Alert,
  Select,
  Skeleton
} from 'antd';
import {
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { TabPane } = Tabs;
const { Option } = Select;

// ✅ URL del backend (usar variable de entorno o fallback)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

interface BrandingAsset {
  current_size?: { height: number, width: number; };
  description: string;
  format: string;
  location: string;
  name: string;
  recommended_size: { height: number, width: number; };
  type: string;
  url?: string;
}

interface BrandingConfig {
  background_image?: string | null;
  desktop_icons: Record<string, string | null>;
  development: string;
  favicons: Record<string, string | null>;
  logos: Record<string, string | null>;
  pwa_icons: Record<string, string | null>;
  social_images: Record<string, string | null>;
  ui_icons: Record<string, string | null>;
}

export default function BrandingAdminPage() {
  const [assets, setAssets] = useState<BrandingAsset[]>([]);
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<BrandingAsset | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<BrandingAsset | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Cache local para evitar recargas innecesarias
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  const fetchAllData = async (forceRefresh = false) => {
    // Verificar cache
    const now = Date.now();
    if (!forceRefresh && now - cacheTimestamp < CACHE_DURATION && assets.length > 0) {
      return; // Usar datos en cache
    }

    setLoading(true);
    try {
      // ✅ Usar endpoint combinado para reducir tiempo de carga
      // Una sola llamada en lugar de dos
      const response = await fetch(`${BACKEND_URL}/api/admin/branding/all`, {
        cache: forceRefresh ? 'no-cache' : 'default'
      });

      if (!response.ok) throw new Error('Error al obtener datos de branding');

      const data = await response.json();

      setAssets(data.assets || []);
      setConfig(data.config || null);
      setCacheTimestamp(now);
    } catch (err) {
      message.error('Error al cargar datos de branding');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar datos al montar
    fetchAllData();
  }, []);

  const validateFile = (file: File, assetType: string): string | null => {
    const asset = assets.find(a => a.type === assetType);
    if (!asset) return 'Tipo de asset no encontrado';

    // Validar extensión
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedFormats = asset.format.split(',').map(f => f.trim().toLowerCase());
    if (fileExt && !allowedFormats.includes(fileExt)) {
      return `Formato no válido. Permitidos: ${allowedFormats.join(', ')}`;
    }

    // Validar tamaño (estimado según tipo)
    const maxSizes: Record<string, number> = {
      // 0.5MB
'apple-touch-icon': 1 * 1024 * 1024, 
      
'background-image': 10 * 1024 * 1024,
      

favicon: 0.5 * 1024 * 1024, 
      
logo: 2 * 1024 * 1024, 
      // 2MB
'logo-dark': 2 * 1024 * 1024,
      
'og-image': 5 * 1024 * 1024,
      // 1MB
'pwa-icon-192': 1 * 1024 * 1024, 
      'pwa-icon-512': 2 * 1024 * 1024,
      // 5MB
'twitter-image': 5 * 1024 * 1024, // 10MB
    };

    const maxSize = maxSizes[assetType] || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return `Archivo demasiado grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }

    return null;
  };

  const handleUpload = async (assetType: string, file: File) => {
    // Validar antes de subir
    const validationError = validateFile(file, assetType);
    if (validationError) {
      message.error(validationError);
      return;
    }

    setUploading(assetType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('asset_type', assetType);

      message.loading({ content: `Subiendo ${file.name}...`, key: 'upload' });

      const response = await fetch(
        `${BACKEND_URL}/api/admin/branding/upload?asset_type=${assetType}`,
        {
          body: formData,
          method: 'POST'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al subir archivo');
      }

      const result = await response.json();
      message.success({ content: `✅ ${result.message}`, duration: 3, key: 'upload' });

      // Mostrar advertencia si las dimensiones no son las recomendadas
      if (result.validation && !result.validation.valid) {
        message.warning({
          content: `⚠️ ${result.validation.message}`,
          duration: 5
        });
      }

      // Recargar datos (forzar refresh)
      await fetchAllData(true);
    } catch (err) {
      message.error({
        content: err instanceof Error ? err.message : 'Error al subir archivo',
        duration: 5,
        key: 'upload'
      });
    } finally {
      setUploading(null);
    }
  };

  const handlePreview = (asset: BrandingAsset) => {
    setPreviewAsset(asset);
    setPreviewVisible(true);
  };

  const handleDelete = async (asset: BrandingAsset) => {
    if (!asset.url) {
      message.warning('Este asset no está configurado, no hay nada que eliminar');
      return;
    }

    Modal.confirm({
      cancelText: 'Cancelar',
      content: `¿Estás seguro de eliminar ${asset.name}? Esta acción eliminará la URL del asset pero no el archivo en R2.`,
      okText: 'Eliminar',
      okType: 'danger',
      onOk: async () => {
        try {
          // Actualizar configuración en API2 para eliminar la URL
          const updateData: BrandingConfig = {
            background_image: config?.background_image,
            desktop_icons: { ...config?.desktop_icons },
            development: config?.development || '',
            favicons: { ...config?.favicons },
            logos: { ...config?.logos },
            pwa_icons: { ...config?.pwa_icons },
            social_images: { ...config?.social_images },
            ui_icons: { ...config?.ui_icons }
          };

          // Eliminar la URL según el tipo de asset
          switch (asset.type) {
          case 'logo': {
            updateData.logos.primary = null;
          
          break;
          }
          case 'logo-dark': {
            updateData.logos.dark = null;
          
          break;
          }
          case 'favicon': {
            updateData.favicons.favicon = null;
          
          break;
          }
          case 'apple-touch-icon': {
            updateData.favicons['apple-touch-icon'] = null;
          
          break;
          }
          case 'og-image': {
            updateData.social_images['og-image'] = null;
          
          break;
          }
          case 'twitter-image': {
            updateData.social_images['twitter-image'] = null;
          
          break;
          }
          case 'background-image': {
            updateData.background_image = null;
          
          break;
          }
          default: { if (asset.type.startsWith('icon-')) {
            const iconName = asset.type.replace('icon-', '');
            updateData.ui_icons[iconName] = null;
          }
          }
          }

          const response = await fetch(`${BACKEND_URL}/api/admin/branding/config`, {
            body: JSON.stringify(updateData),
            headers: {
              'Content-Type': 'application/json'
            },
            method: 'PUT'
          });

          if (!response.ok) {
            throw new Error('Error al eliminar asset');
          }

          message.success(`✅ ${asset.name} eliminado correctamente`);
          await fetchAllData(true);
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Error al eliminar asset');
        }
      },
      title: '¿Eliminar asset?'
    });
  };

  // Agrupar assets por categoría
  const groupedAssets = {
    background: assets.filter(a => a.type === 'background-image'),
    desktop: assets.filter(a => a.type.startsWith('desktop')),
    favicons: assets.filter(a => a.type.includes('favicon') || a.type.includes('apple')),
    icons: assets.filter(a => a.type.startsWith('icon-')),
    logos: assets.filter(a => a.type.startsWith('logo')),
    pwa: assets.filter(a => a.type.startsWith('pwa')),
    social: assets.filter(a => a.type.includes('image') || a.type.includes('og') || a.type.includes('twitter'))
  };

  const columns: ColumnsType<BrandingAsset> = [
    {
      dataIndex: 'name',
      key: 'name',
      title: 'Nombre',
      width: 200,
    },
    {
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
      title: 'Tipo',
      width: 150,
    },
    {
      key: 'dimensions',
      render: (_: any, record: BrandingAsset) => {
        const current = record.current_size;
        const recommended = record.recommended_size;
        const isCorrect = current &&
          Math.abs(current.width - recommended.width) <= recommended.width * 0.2 &&
          Math.abs(current.height - recommended.height) <= recommended.height * 0.2;

        return (
          <Space direction="vertical" size="small">
            {current ? (
              <>
                <span>
                  Actual: <strong>{current.width}x{current.height}</strong>
                  {isCorrect ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                  ) : (
                    <WarningOutlined style={{ color: '#faad14', marginLeft: 8 }} />
                  )}
                </span>
                <span style={{ color: '#999', fontSize: '12px' }}>
                  Recomendado: {recommended.width}x{recommended.height}
                </span>
              </>
            ) : (
              <span style={{ color: '#999' }}>
                Recomendado: {recommended.width}x{recommended.height}
              </span>
            )}
          </Space>
        );
      },
      title: 'Dimensiones',
      width: 200,
    },
    {
      dataIndex: 'format',
      key: 'format',
      render: (format: string) => <Tag>{format.toUpperCase()}</Tag>,
      title: 'Formato',
      width: 100,
    },
    {
      key: 'status',
      render: (_: any, record: BrandingAsset) => {
        if (record.url) {
          return <Tag color="green">✅ Configurado</Tag>;
        }
        return <Tag color="default">❌ Sin configurar</Tag>;
      },
      title: 'Estado',
      width: 120,
    },
    {
      fixed: 'right',
      key: 'actions',
      render: (_: any, record: BrandingAsset) => (
        <Space>
          <Upload
            accept={record.format.split(',').map(f => `.${f.trim()}`).join(',')}
            beforeUpload={(file) => {
              handleUpload(record.type, file);
              return false;
            }}
            maxCount={1}
            showUploadList={false}
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploading === record.type}
              size="small"
              type="primary"
            >
              {record.url ? 'Reemplazar' : 'Subir'}
            </Button>
          </Upload>
          {record.url && (
            <>
              <Button
                icon={<EyeOutlined />}
                onClick={() => handlePreview(record)}
                size="small"
                type="link"
              >
                Ver
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
                size="small"
                type="link"
              >
                Eliminar
              </Button>
            </>
          )}
        </Space>
      ),
      title: 'Acciones',
      width: 200,
    },
  ];

  const renderAssetCard = (asset: BrandingAsset) => {
    const hasAsset = !!asset.url;
    const current = asset.current_size;
    const recommended = asset.recommended_size;
    const isCorrectSize = current &&
      Math.abs(current.width - recommended.width) <= recommended.width * 0.2 &&
      Math.abs(current.height - recommended.height) <= recommended.height * 0.2;

    return (
      <Card
        className="mb-4"
        extra={
          <Space>
            {hasAsset && (
              <Button
                icon={<EyeOutlined />}
                onClick={() => handlePreview(asset)}
                size="small"
                type="link"
              >
                Ver
              </Button>
            )}
            <Upload
              accept={asset.format.split(',').map(f => `.${f.trim()}`).join(',')}
              beforeUpload={(file) => {
                handleUpload(asset.type, file);
                return false;
              }}
              maxCount={1}
              showUploadList={false}
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploading === asset.type}
                size="small"
                type="primary"
              >
                {hasAsset ? 'Reemplazar' : 'Subir'}
              </Button>
            </Upload>
          </Space>
        }
        key={asset.type}
        size="small"
        title={
          <Space>
            <span>{asset.name}</span>
            {hasAsset ? (
              <Tag color="green">✅</Tag>
            ) : (
              <Tag color="default">❌</Tag>
            )}
          </Space>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{asset.description}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Formato:</strong> {asset.format.toUpperCase()}
            </div>
            <div>
              <strong>Dimensiones recomendadas:</strong> {recommended.width}x{recommended.height}
            </div>
          </div>

          {current && (
            <Alert
              className="mt-2"
              message={
                <span>
                  Dimensiones actuales: <strong>{current.width}x{current.height}</strong>
                  {!isCorrectSize && ' (no coincide con recomendado)'}
                </span>
              }
              showIcon
              type={isCorrectSize ? 'success' : 'warning'}
            />
          )}

          {hasAsset && (
            <div className="mt-3">
              <Image
                alt={asset.name}
                height={100}
                preview={false}
                src={asset.url}
                style={{ objectFit: 'contain' }}
                width={100}
              />
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎨 Administración de Branding</h1>
          <p className="mt-2 text-gray-600">
            Gestiona todos los iconos, logos e imágenes del sistema. Los archivos se almacenan en R2 y la configuración en API2.
          </p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => fetchAllData(true)}
        >
          Actualizar
        </Button>
      </div>

      {/* Resumen */}
      {loading && assets.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <Skeleton active paragraph={{ rows: 0 }} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold">{assets.length}</div>
              <div className="text-sm text-gray-600">Total Assets</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assets.filter(a => a.url).length}
              </div>
              <div className="text-sm text-gray-600">Configurados</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {assets.filter(a => !a.url).length}
              </div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {config?.development || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Development</div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs por categoría */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane key="all" tab={`Todos (${loading && assets.length === 0 ? '...' : assets.length})`}>
          {loading && assets.length === 0 ? (
            <Card>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          ) : (
            <Table
              columns={columns}
              dataSource={assets}
              loading={loading && assets.length > 0}
              pagination={false}
              rowKey="type"
              scroll={{ x: 1000 }}
            />
          )}
        </TabPane>

        <TabPane key="logos" tab={`Logos (${groupedAssets.logos.length})`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedAssets.logos.map(renderAssetCard)}
          </div>
        </TabPane>

        <TabPane key="favicons" tab={`Favicons (${groupedAssets.favicons.length})`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedAssets.favicons.map(renderAssetCard)}
          </div>
        </TabPane>

        <TabPane key="pwa" tab={`PWA Icons (${groupedAssets.pwa.length})`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedAssets.pwa.map(renderAssetCard)}
          </div>
        </TabPane>

        <TabPane key="icons" tab={`UI Icons (${groupedAssets.icons.length})`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedAssets.icons.map(renderAssetCard)}
          </div>
        </TabPane>

        <TabPane key="social" tab={`Social (${groupedAssets.social.length})`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedAssets.social.map(renderAssetCard)}
          </div>
        </TabPane>
      </Tabs>

      {/* Modal de Preview */}
      <Modal
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        open={previewVisible}
        title={`Vista Previa: ${previewAsset?.name}`}
        width={600}
      >
        {previewAsset && (
          <div className="space-y-4">
            {previewAsset.url ? (
              <>
                <Image
                  alt={previewAsset.name}
                  src={previewAsset.url}
                  style={{ maxHeight: '400px', objectFit: 'contain', width: '100%' }}
                />
                <div className="space-y-2 text-sm">
                  <p><strong>URL:</strong> <a href={previewAsset.url} rel="noopener noreferrer" target="_blank">{previewAsset.url}</a></p>
                  {previewAsset.current_size && (
                    <p><strong>Dimensiones:</strong> {previewAsset.current_size.width}x{previewAsset.current_size.height}</p>
                  )}
                  <p><strong>Formato:</strong> {previewAsset.format.toUpperCase()}</p>
                  <p><strong>Descripción:</strong> {previewAsset.description}</p>
                </div>
              </>
            ) : (
              <Alert
                description="Este asset aún no ha sido subido. Usa el botón 'Subir' para agregarlo."
                message="Sin asset configurado"
                type="info"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

































