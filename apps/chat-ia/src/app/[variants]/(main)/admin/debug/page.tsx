'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Card, Statistic, Tag, Space, Button, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Option } = Select;

interface RequestDebugInfo {
  channel?: string;
  cost: number;
  development?: string;
  id: number;
  message_received?: string;
  message_sent?: string;
  model: string;
  processing_time_ms: number;
  provider: string;
  session_id?: string;
  success: boolean;
  timestamp: string;
  tokens_used: number;
  tools_used: string[];
  user_id?: string;
}

interface DebugSummary {
  by_provider: Record<string, {
    cost: number;
    count: number;
    tokens: number;
  }>;
  failed: number;
  success_rate: number;
  successful: number;
  total_cost: number;
  total_requests: number;
  total_tokens: number;
}

interface DebugResponse {
  requests: RequestDebugInfo[];
  summary: DebugSummary;
  total_count: number;
}

export default function DebugPage() {
  const [data, setData] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestDebugInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');

  // Filtros
  const [providerFilter, setProviderFilter] = useState<string | undefined>();
  const [sessionFilter, setSessionFilter] = useState<string | undefined>();
  const [userFilter, setUserFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (providerFilter) params.append('provider', providerFilter);
      if (sessionFilter) params.append('session_id', sessionFilter);
      if (userFilter) params.append('user_id', userFilter);
      params.append('format', viewMode);
      params.append('limit', '500');

      const response = await fetch(`http://localhost:8030/api/debug/requests?${params}`);
      if (!response.ok) throw new Error('Error al obtener datos');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, [providerFilter, sessionFilter, userFilter, viewMode]);

  // Filtrar requests por búsqueda de texto
  const filteredRequests = useMemo(() => {
    if (!data?.requests) return [];
    if (!searchText) return data.requests;

    const searchLower = searchText.toLowerCase();
    return data.requests.filter(req =>
      req.message_sent?.toLowerCase().includes(searchLower) ||
      req.message_received?.toLowerCase().includes(searchLower) ||
      req.provider?.toLowerCase().includes(searchLower) ||
      req.model?.toLowerCase().includes(searchLower) ||
      req.tools_used.some(tool => tool.toLowerCase().includes(searchLower))
    );
  }, [data, searchText]);

  const columns: ColumnsType<RequestDebugInfo> = [
    {
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      title: 'ID',
      width: 60,
    },
    {
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => {
        try {
          const date = new Date(timestamp);
          return date.toLocaleString('es-ES');
        } catch {
          return timestamp;
        }
      },
      title: 'Fecha/Hora',
      width: 180,
    },
    {
      dataIndex: 'provider',
      filters: data?.summary.by_provider ? Object.keys(data.summary.by_provider).map(p => ({
        text: p,
        value: p,
      })) : [],
      key: 'provider',
      onFilter: (value, record) => record.provider === value,
      render: (provider: string) => <Tag color="blue">{provider}</Tag>,
      title: 'Provider',
      width: 120,
    },
    {
      dataIndex: 'model',
      key: 'model',
      title: 'Modelo',
      width: 150,
    },
    {
      dataIndex: 'tokens_used',
      key: 'tokens_used',
      render: (tokens: number) => tokens.toLocaleString(),
      sorter: (a, b) => a.tokens_used - b.tokens_used,
      title: 'Tokens',
      width: 100,
    },
    {
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `$${cost.toFixed(6)}`,
      sorter: (a, b) => a.cost - b.cost,
      title: 'Costo',
      width: 100,
    },
    {
      dataIndex: 'processing_time_ms',
      key: 'processing_time_ms',
      sorter: (a, b) => a.processing_time_ms - b.processing_time_ms,
      title: 'Tiempo (ms)',
      width: 100,
    },
    {
      dataIndex: 'success',
      filters: [
        { text: 'Exitoso', value: true },
        { text: 'Fallido', value: false },
      ],
      key: 'success',
      onFilter: (value, record) => record.success === value,
      render: (success: boolean) => (
        <Tag color={success ? 'green' : 'red'}>
          {success ? '✅' : '❌'}
        </Tag>
      ),
      title: 'Estado',
      width: 100,
    },
    {
      dataIndex: 'tools_used',
      key: 'tools_used',
      render: (tools: string[]) => (
        <Space wrap>
          {tools.length > 0 ? (
            tools.slice(0, 2).map((tool, idx) => (
              <Tag color="purple" key={idx}>{tool}</Tag>
            ))
          ) : (
            <Tag color="default">Ninguno</Tag>
          )}
          {tools.length > 2 && <Tag>+{tools.length - 2}</Tag>}
        </Space>
      ),
      title: 'Tools/Agentes',
      width: 200,
    },
    {
      dataIndex: 'message_sent',
      ellipsis: true,
      key: 'message_sent',
      render: (text: string | undefined) => text ? (
        <span title={text}>{text.slice(0, 50)}...</span>
      ) : '-',
      title: 'Mensaje Enviado',
      width: 200,
    },
    {
      fixed: 'right',
      key: 'actions',
      render: (_: any, record: RequestDebugInfo) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRequest(record);
            setModalVisible(true);
          }}
          type="link"
        >
          Ver
        </Button>
      ),
      title: 'Acciones',
      width: 100,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🐛 Panel de Debug</h1>
          <p className="mt-2 text-gray-600">
            Visualiza todas las peticiones, tokens gastados, agentes utilizados y texto enviado/recibido
          </p>
        </div>
        <Space>
          <Select
            onChange={setViewMode}
            style={{ width: 120 }}
            value={viewMode}
          >
            <Option value="table">Tabla</Option>
            <Option value="list">Lista</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchData}
          >
            Actualizar
          </Button>
        </Space>
      </div>

      {/* Resumen */}
      {data?.summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <Statistic
              prefix="📊"
              title="Total Peticiones"
              value={data.summary.total_requests}
            />
          </Card>
          <Card>
            <Statistic
              formatter={(value) => value?.toLocaleString()}
              prefix="🔢"
              title="Total Tokens"
              value={data.summary.total_tokens}
            />
          </Card>
          <Card>
            <Statistic
              precision={6}
              prefix="$"
              title="Costo Total"
              value={data.summary.total_cost}
            />
          </Card>
          <Card>
            <Statistic
              prefix={data.summary.success_rate >= 95 ? '✅' : '⚠️'}
              suffix="%"
              title="Tasa de Éxito"
              value={data.summary.success_rate}
            />
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card title="Filtros">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Search
            allowClear
            enterButton={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
            placeholder="Buscar en mensajes, providers, modelos, tools..."
            size="large"
            value={searchText}
          />
          <Space wrap>
            <Select
              allowClear
              onChange={setProviderFilter}
              placeholder="Filtrar por Provider"
              style={{ width: 200 }}
              value={providerFilter}
            >
              {data?.summary.by_provider && Object.keys(data.summary.by_provider).map(provider => (
                <Option key={provider} value={provider}>{provider}</Option>
              ))}
            </Select>
            <Input
              allowClear
              onChange={(e) => setSessionFilter(e.target.value || undefined)}
              placeholder="Filtrar por Session ID"
              style={{ width: 200 }}
              value={sessionFilter}
            />
            <Input
              allowClear
              onChange={(e) => setUserFilter(e.target.value || undefined)}
              placeholder="Filtrar por User ID"
              style={{ width: 200 }}
              value={userFilter}
            />
          </Space>
        </Space>
      </Card>

      {/* Tabla/Lista */}
      {error && (
        <Card>
          <div className="text-center text-red-600">
            ❌ Error: {error}
          </div>
        </Card>
      )}

      {viewMode === 'table' ? (
        <Card title={`Peticiones (${filteredRequests.length})`}>
          <Table
            columns={columns}
            dataSource={filteredRequests}
            loading={loading}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} peticiones`,
            }}
            rowKey="id"
            scroll={{ x: 1500 }}
          />
        </Card>
      ) : (
        <Card title={`Peticiones (${filteredRequests.length})`}>
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <Card className="hover:shadow-md transition-shadow" key={req.id} size="small">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>ID:</strong> {req.id}</p>
                    <p><strong>Fecha:</strong> {new Date(req.timestamp).toLocaleString('es-ES')}</p>
                    <p><strong>Provider:</strong> <Tag color="blue">{req.provider}</Tag></p>
                    <p><strong>Modelo:</strong> {req.model}</p>
                    <p><strong>Estado:</strong> <Tag color={req.success ? 'green' : 'red'}>{req.success ? '✅' : '❌'}</Tag></p>
                  </div>
                  <div>
                    <p><strong>Tokens:</strong> {req.tokens_used.toLocaleString()}</p>
                    <p><strong>Costo:</strong> ${req.cost.toFixed(6)}</p>
                    <p><strong>Tiempo:</strong> {req.processing_time_ms}ms</p>
                    <p><strong>Tools:</strong> {req.tools_used.length > 0 ? req.tools_used.join(', ') : 'Ninguno'}</p>
                    <p><strong>Canal:</strong> {req.channel || 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-4 border-t pt-4">
                  <p><strong>Mensaje Enviado:</strong></p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded">{req.message_sent || 'N/A'}</p>
                  <p className="mt-2"><strong>Mensaje Recibido:</strong></p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded">{req.message_received || 'N/A'}</p>
                </div>
                <div className="mt-2">
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedRequest(req);
                      setModalVisible(true);
                    }}
                    type="link"
                  >
                    Ver Detalles Completos
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Modal de Detalles */}
      <Modal
        footer={null}
        onCancel={() => setModalVisible(false)}
        open={modalVisible}
        title="Detalles de la Petición"
        width={800}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>ID:</strong> {selectedRequest.id}</p>
                <p><strong>Fecha/Hora:</strong> {new Date(selectedRequest.timestamp).toLocaleString('es-ES')}</p>
                <p><strong>Provider:</strong> <Tag color="blue">{selectedRequest.provider}</Tag></p>
                <p><strong>Modelo:</strong> {selectedRequest.model}</p>
                <p><strong>Estado:</strong> <Tag color={selectedRequest.success ? 'green' : 'red'}>{selectedRequest.success ? '✅ Exitoso' : '❌ Fallido'}</Tag></p>
              </div>
              <div>
                <p><strong>Tokens Usados:</strong> {selectedRequest.tokens_used.toLocaleString()}</p>
                <p><strong>Costo:</strong> ${selectedRequest.cost.toFixed(6)}</p>
                <p><strong>Tiempo de Procesamiento:</strong> {selectedRequest.processing_time_ms}ms</p>
                <p><strong>Canal:</strong> {selectedRequest.channel || 'N/A'}</p>
                <p><strong>Development:</strong> {selectedRequest.development || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p><strong>User ID:</strong> {selectedRequest.user_id || 'N/A'}</p>
              <p><strong>Session ID:</strong> {selectedRequest.session_id || 'N/A'}</p>
            </div>

            <div className="border-t pt-4">
              <p><strong>Tools/Agentes Usados:</strong></p>
              <Space className="mt-2" wrap>
                {selectedRequest.tools_used.length > 0 ? (
                  selectedRequest.tools_used.map((tool, idx) => (
                    <Tag color="purple" key={idx}>{tool}</Tag>
                  ))
                ) : (
                  <Tag color="default">Ninguno</Tag>
                )}
              </Space>
            </div>

            <div className="border-t pt-4">
              <p><strong>Mensaje Enviado:</strong></p>
              <div className="mt-2 bg-gray-50 p-3 rounded max-h-40 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm">{selectedRequest.message_sent || 'N/A'}</pre>
              </div>
            </div>

            <div className="border-t pt-4">
              <p><strong>Mensaje Recibido:</strong></p>
              <div className="mt-2 bg-gray-50 p-3 rounded max-h-60 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm">{selectedRequest.message_received || 'N/A'}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

































