'use client';

import {
  AlertCircle,
  Database,
  FileText,
  HelpCircle,
  Link2,
  Package,
  RefreshCw,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';
import { useChatStore } from '@/store/chat';

type TabType = 'documents' | 'products' | 'faqs' | 'offers';

interface ConnectionStatus {
  api2_fallback: string;
  connected: boolean;
  database: string;
  uri_configured: boolean;
}

interface KBStats {
  by_category: Record<string, number>;
  by_profile: Record<string, number>;
  documents: number;
  error?: string;
  faqs: number;
  offers: number;
  products: number;
}

interface KBItem {
  category?: string;
  content?: string;
  created_at?: string;
  description?: string;
  id: string;
  name?: string;
  question?: string;
  target_profile?: string;
  title?: string;
  visibility?: string;
}

const TABS: { icon: ReactNode; key: TabType; label: string }[] = [
  { icon: <FileText size={14} />, key: 'documents', label: 'Documentos' },
  { icon: <Package size={14} />, key: 'products', label: 'Productos' },
  { icon: <HelpCircle size={14} />, key: 'faqs', label: 'FAQs' },
  { icon: <Tag size={14} />, key: 'offers', label: 'Ofertas' },
];

// Whitelabels disponibles para multi-tenant (solo visible para admins)
const ALL_DEVELOPMENTS = [
  { label: 'Bodas de Hoy', value: 'bodasdehoy' },
  { label: 'Champagne Events', value: 'champagne-events' },
  { label: 'Vive Tu Boda', value: 'vivetuboda' },
  { label: 'Eventos Organizador', value: 'eventosorganizador' },
  { label: 'Eventos Integrados', value: 'eventosintegrados' },
];

const KBAdmin = () => {
  // ✅ Auto-detectar development del usuario actual
  const { userDevelopment, userProfile } = useChatStore((s) => ({
    userDevelopment: s.development,
    userProfile: s.userProfile,
  }));

  // ✅ Verificar si es admin (puede ver todos los developments)
  const isAdmin = userProfile?.roles?.includes('admin') ||
                  userProfile?.roles?.includes('superadmin') ||
                  userProfile?.permissions?.manageWhitelabels === true;
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [items, setItems] = useState<KBItem[]>([]);
  const [stats, setStats] = useState<KBStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KBItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isCreating, _setIsCreating] = useState(false);
  const [jsonImport, setJsonImport] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Multi-tenant: development seleccionado (auto-detectado o admin puede cambiar)
  const [development, setDevelopment] = useState(userDevelopment || 'bodasdehoy');

  // ✅ Sincronizar development cuando cambie el usuario
  useEffect(() => {
    if (userDevelopment && userDevelopment !== development) {
      setDevelopment(userDevelopment);
    }
  }, [userDevelopment]);

  // ✅ Helper para construir URLs del API de KB
  const buildKBUrl = useCallback((path: string) => {
    const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';
    const fullPath = `/api/admin/kb${path.startsWith('/') ? path : `/${path}`}`;

    if (backendURL.startsWith('/')) {
      return new URL(`${backendURL}${fullPath}`, window.location.origin).toString();
    } else {
      return new URL(fullPath, backendURL).toString();
    }
  }, []);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch(buildKBUrl('/status/'));
      const data = await response.json();
      setConnectionStatus(data);
      setError(null);
      return data.connected;
    } catch {
      setError('No se puede conectar al backend. Verificar configuración.');
      setConnectionStatus(null);
      return false;
    }
  }, [buildKBUrl]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Filtrar por development (multi-tenant)
      const response = await fetch(`${buildKBUrl(`/${activeTab}/`)}?development=${development}`);

      if (response.status === 503) {
        setError('MongoDB no conectado. Haz clic en "Conectar" para iniciar la conexión.');
        setItems([]);
        return;
      }

      const data = await response.json();

      if (data.detail) {
        setError(data.detail);
        setItems([]);
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Error cargando datos');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, development, buildKBUrl]);

  const loadStats = useCallback(async () => {
    try {
      // Filtrar por development (multi-tenant)
      const response = await fetch(`${buildKBUrl('/stats/')}?development=${development}`);
      const data = await response.json();
      setStats(data);
      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [development, buildKBUrl]);

  const connectToMongoDB = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const response = await fetch(`${buildKBUrl('/connect/')}?development=${development}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        await checkConnectionStatus();
        await loadItems();
      } else {
        setError(data.message || data.error || 'Error al conectar');
      }
    } catch {
      setError('Error de conexión al backend');
    } finally {
      setConnecting(false);
    }
  }, [checkConnectionStatus, development, loadItems, buildKBUrl]);

  useEffect(() => {
    checkConnectionStatus().then((connected) => {
      if (connected) {
        loadItems();
        loadStats();
      }
    });
  }, [checkConnectionStatus]);

  useEffect(() => {
    if (connectionStatus?.connected) {
      loadItems();
    }
  }, [activeTab, connectionStatus?.connected, loadItems]);

  // Recargar al cambiar development
  useEffect(() => {
    if (connectionStatus?.connected) {
      loadItems();
      loadStats();
      setSelectedItem(null);
    }
  }, [development, connectionStatus?.connected]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('¿Eliminar este elemento?')) return;

      try {
        await fetch(buildKBUrl(`/${activeTab}/${id}`), { method: 'DELETE' });
        await loadItems();
        await loadStats();
        if (selectedItem?.id === id) setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Error al eliminar');
      }
    },
    [activeTab, selectedItem, loadItems, loadStats, buildKBUrl],
  );

  const handleImportJson = useCallback(async () => {
    try {
      const data = JSON.parse(jsonImport);
      const items = Array.isArray(data) ? data : [data];

      // Incluir development en la importación (multi-tenant)
      const response = await fetch(
        `${buildKBUrl('/import/json/')}?collection_name=${activeTab}&development=${development}`,
        {
          body: JSON.stringify(items),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );

      const result = await response.json();

      if (result.success) {
        alert(`Importados ${result.imported_count} elementos a ${development}`);
        setJsonImport('');
        setShowImport(false);
        await loadItems();
        await loadStats();
      } else {
        alert('Error en importación');
      }
    } catch {
      alert('JSON inválido');
    }
  }, [jsonImport, activeTab, development, loadItems, loadStats, buildKBUrl]);

  const getItemTitle = (item: KBItem) => {
    return item.title || item.name || item.question || item.id;
  };

  const getItemSubtitle = (item: KBItem) => {
    return item.description || item.content?.slice(0, 100) || '';
  };

  return (
    <Flexbox gap={16} padding={16} style={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <Flexbox align="center" gap={8} horizontal>
          <Database size={20} />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Knowledge Base Admin</h2>
            <Flexbox align="center" gap={8} horizontal style={{ marginTop: '2px' }}>
              <span
                style={{
                  background: connectionStatus?.connected ? '#dcfce7' : '#fef3c7',
                  borderRadius: '4px',
                  color: connectionStatus?.connected ? '#166534' : '#92400e',
                  fontSize: '10px',
                  fontWeight: 500,
                  padding: '2px 6px',
                }}
              >
                {connectionStatus?.connected ? '● Conectado' : '○ Desconectado'}
              </span>
              {connectionStatus?.database && (
                <span style={{ color: '#6b7280', fontSize: '11px' }}>
                  {connectionStatus.database}
                </span>
              )}
            </Flexbox>
          </div>
        </Flexbox>
        <Flexbox gap={8} horizontal>
          {!connectionStatus?.connected && (
            <button
              disabled={connecting}
              onClick={connectToMongoDB}
              style={{
                alignItems: 'center',
                background: connecting ? '#9ca3af' : '#10b981',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: connecting ? 'not-allowed' : 'pointer',
                display: 'flex',
                fontSize: '12px',
                fontWeight: 500,
                gap: '4px',
                padding: '6px 12px',
              }}
              type="button"
            >
              <Link2 size={14} />
              {connecting ? 'Conectando...' : 'Conectar MongoDB'}
            </button>
          )}
          <button
            disabled={!connectionStatus?.connected}
            onClick={() => setShowImport(!showImport)}
            style={{
              alignItems: 'center',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: connectionStatus?.connected ? 'pointer' : 'not-allowed',
              display: 'flex',
              fontSize: '12px',
              gap: '4px',
              opacity: connectionStatus?.connected ? 1 : 0.5,
              padding: '6px 12px',
            }}
            type="button"
          >
            <Upload size={14} />
            Importar JSON
          </button>
          <button
            onClick={() => {
              checkConnectionStatus();
              if (connectionStatus?.connected) {
                loadItems();
                loadStats();
              }
            }}
            style={{
              alignItems: 'center',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              fontSize: '12px',
              gap: '4px',
              padding: '6px 12px',
            }}
            type="button"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </Flexbox>
      </Flexbox>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            alignItems: 'center',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            display: 'flex',
            fontSize: '13px',
            gap: '8px',
            padding: '12px 16px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Development Selector (Multi-tenant) - Solo admins pueden cambiar */}
      <Flexbox align="center" gap={8} horizontal style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px' }}>
        <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 500 }}>Whitelabel:</span>
        {isAdmin ? (
          // ✅ Admin: puede seleccionar cualquier development
          <select
            aria-label="Seleccionar whitelabel"
            disabled={!connectionStatus?.connected}
            onChange={(e) => setDevelopment(e.target.value)}
            style={{
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              fontSize: '13px',
              minWidth: '180px',
              padding: '6px 12px',
            }}
            title="Seleccionar whitelabel/development"
            value={development}
          >
            {ALL_DEVELOPMENTS.map((dev) => (
              <option key={dev.value} value={dev.value}>
                {dev.label}
              </option>
            ))}
          </select>
        ) : (
          // ✅ Usuario normal: solo ve su development (sin poder cambiar)
          <span
            style={{
              background: '#dbeafe',
              borderRadius: '6px',
              color: '#1d4ed8',
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 12px',
            }}
          >
            {ALL_DEVELOPMENTS.find(d => d.value === development)?.label || development}
          </span>
        )}
        <span style={{ color: '#9ca3af', fontSize: '11px' }}>
          {isAdmin ? '👑 Admin: puedes ver todos los developments' : '🔒 Solo tu marca'}
        </span>
      </Flexbox>

      {/* Stats */}
      {stats && (
        <Flexbox gap={8} horizontal>
          {TABS.map((tab) => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? '#667eea' : '#f9fafb',
                border: `1px solid ${activeTab === tab.key ? '#667eea' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: activeTab === tab.key ? '#fff' : '#374151',
                cursor: 'pointer',
                flex: 1,
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <Flexbox align="center" gap={4} horizontal justify="center">
                {tab.icon}
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{tab.label}</span>
              </Flexbox>
              <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>
                {stats[tab.key]}
              </div>
            </div>
          ))}
        </Flexbox>
      )}

      {/* Import Panel */}
      {showImport && (
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <h4 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>
            Importar JSON a {TABS.find((t) => t.key === activeTab)?.label}
          </h4>
          <textarea
            onChange={(e) => setJsonImport(e.target.value)}
            placeholder={`[{"title": "...", "content": "...", ...}]`}
            rows={6}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '8px',
              width: '100%',
            }}
            value={jsonImport}
          />
          <Flexbox gap={8} horizontal style={{ marginTop: '8px' }}>
            <button
              onClick={handleImportJson}
              style={{
                background: '#10b981',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '8px 16px',
              }}
              type="button"
            >
              Importar
            </button>
            <button
              onClick={() => setShowImport(false)}
              style={{
                background: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '8px 16px',
              }}
              type="button"
            >
              Cancelar
            </button>
          </Flexbox>
        </div>
      )}

      {/* Content */}
      <Flexbox gap={16} horizontal style={{ flex: 1, overflow: 'hidden' }}>
        {/* Items List */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'auto',
            width: '350px',
          }}
        >
          {loading ? (
            <div style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
              No hay elementos
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: selectedItem?.id === item.id ? '#f0f9ff' : '#fff',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  padding: '12px',
                }}
              >
                <Flexbox gap={4}>
                  <Flexbox align="center" horizontal justify="space-between">
                    <strong style={{ fontSize: '13px' }}>{getItemTitle(item)}</strong>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Flexbox>
                  <p
                    style={{
                      color: '#6b7280',
                      fontSize: '11px',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getItemSubtitle(item)}
                  </p>
                  <Flexbox gap={4} horizontal>
                    {item.category && (
                      <span
                        style={{
                          background: '#e5e7eb',
                          borderRadius: '4px',
                          color: '#374151',
                          fontSize: '10px',
                          padding: '2px 6px',
                        }}
                      >
                        {item.category}
                      </span>
                    )}
                    {item.target_profile && (
                      <span
                        style={{
                          background: '#dbeafe',
                          borderRadius: '4px',
                          color: '#1d4ed8',
                          fontSize: '10px',
                          padding: '2px 6px',
                        }}
                      >
                        {item.target_profile}
                      </span>
                    )}
                  </Flexbox>
                </Flexbox>
              </div>
            ))
          )}
        </div>

        {/* Item Detail */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            flex: 1,
            overflow: 'auto',
            padding: '16px',
          }}
        >
          {selectedItem ? (
            <Flexbox gap={12}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                {getItemTitle(selectedItem)}
              </h3>

              <Flexbox gap={4} horizontal style={{ flexWrap: 'wrap' }}>
                {selectedItem.category && (
                  <span
                    style={{
                      background: '#f3f4f6',
                      borderRadius: '6px',
                      color: '#374151',
                      fontSize: '12px',
                      padding: '4px 10px',
                    }}
                  >
                    Categoría: {selectedItem.category}
                  </span>
                )}
                {selectedItem.visibility && (
                  <span
                    style={{
                      background: '#fef3c7',
                      borderRadius: '6px',
                      color: '#92400e',
                      fontSize: '12px',
                      padding: '4px 10px',
                    }}
                  >
                    Visibilidad: {selectedItem.visibility}
                  </span>
                )}
                {selectedItem.target_profile && (
                  <span
                    style={{
                      background: '#dbeafe',
                      borderRadius: '6px',
                      color: '#1d4ed8',
                      fontSize: '12px',
                      padding: '4px 10px',
                    }}
                  >
                    Perfil: {selectedItem.target_profile}
                  </span>
                )}
              </Flexbox>

              {selectedItem.description && (
                <div>
                  <strong style={{ fontSize: '12px' }}>Descripción:</strong>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>
                    {selectedItem.description}
                  </p>
                </div>
              )}

              {selectedItem.content && (
                <div>
                  <strong style={{ fontSize: '12px' }}>Contenido:</strong>
                  <pre
                    style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      marginTop: '4px',
                      maxHeight: '300px',
                      overflow: 'auto',
                      padding: '12px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedItem.content}
                  </pre>
                </div>
              )}

              <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '8px' }}>
                ID: {selectedItem.id}
                {selectedItem.created_at && (
                  <> | Creado: {new Date(selectedItem.created_at).toLocaleString()}</>
                )}
              </div>
            </Flexbox>
          ) : (
            <Flexbox align="center" justify="center" style={{ color: '#9ca3af', height: '100%' }}>
              Selecciona un elemento para ver detalles
            </Flexbox>
          )}
        </div>
      </Flexbox>
    </Flexbox>
  );
};

export default KBAdmin;
