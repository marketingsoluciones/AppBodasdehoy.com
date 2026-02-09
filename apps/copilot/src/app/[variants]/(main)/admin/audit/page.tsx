'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Select, Table, Tag, message, Statistic, Row, Col } from 'antd';
import { 
  ReloadOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

interface AuditResult {
  api_total: number;
  calculated_total: number;
  daily_breakdown?: Array<{
    cost: number;
    date: string;
    provider: string;
  }>;
  difference: number;
  difference_percent: number;
  period: {
    end: string;
    start: string;
  };
  provider: string;
  status: 'ok' | 'warning' | 'error';
  verified_at: string;
}

interface AuditHistoryItem {
  _id: string;
  api_total: number;
  calculated_total: number;
  created_at: string;
  development: string;
  difference: number;
  difference_percent: number;
  period: {
    end: string;
    start: string;
  };
  provider: string;
  status: 'ok' | 'warning' | 'error';
}

export default function AuditDashboard() {
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [provider, setProvider] = useState<string>('openai');
  const [days, setDays] = useState<number>(7);
  const [development, setDevelopment] = useState<string>('bodasdehoy');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [stats, setStats] = useState<any>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/audit/history?development=${development}&limit=50`
      );
      const data = await response.json();
      if (data.success) {
        setHistory(data.audits || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      message.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/audit/history/stats?development=${development}&days=30`
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Cargar historial y estadísticas al montar
  useEffect(() => {
    loadHistory();
    loadStats();
  }, [development]);

  const runAudit = async () => {
    setAuditing(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/audit/costs?provider=${provider}&days=${days}&development=${development}`
      );
      const data = await response.json();
      setAuditResult(data);
      message.success('Auditoría completada');
      // Recargar historial y estadísticas
      loadHistory();
      loadStats();
    } catch (error) {
      console.error('Error running audit:', error);
      message.error('Error al ejecutar auditoría');
    } finally {
      setAuditing(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      error: { color: 'error', icon: <CloseCircleOutlined />, text: 'Error' },
      ok: { color: 'success', icon: <CheckCircleOutlined />, text: 'OK' },
      warning: { color: 'warning', icon: <ExclamationCircleOutlined />, text: 'Advertencia' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ok;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const historyColumns: ColumnsType<AuditHistoryItem> = [
    {
      dataIndex: 'created_at',
      defaultSortOrder: 'descend',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('es-ES'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      title: 'Fecha',
    },
    {
      dataIndex: 'provider',
      key: 'provider',
      render: (text: string) => text.toUpperCase(),
      title: 'Proveedor',
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      title: 'Status',
    },
    {
      align: 'right',
      dataIndex: 'calculated_total',
      key: 'calculated_total',
      render: (value: number) => `$${value.toFixed(6)}`,
      title: 'Calculado',
    },
    {
      align: 'right',
      dataIndex: 'api_total',
      key: 'api_total',
      render: (value: number) => `$${value.toFixed(6)}`,
      title: 'API',
    },
    {
      align: 'right',
      dataIndex: 'difference_percent',
      key: 'difference_percent',
      render: (value: number) => (
        <span style={{ color: value > 10 ? '#ff4d4f' : value > 5 ? '#faad14' : '#52c41a' }}>
          {value > 0 ? '+' : ''}{value.toFixed(2)}%
        </span>
      ),
      title: 'Diferencia',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 Auditoría de Costos</h1>
          <p className="mt-2 text-gray-600">
            Verificación de costos calculados vs costos reales de APIs de proveedores
          </p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => {
            loadHistory();
            loadStats();
          }}
        >
          Actualizar
        </Button>
      </div>

      {/* Estadísticas Rápidas */}
      {stats && (
        <Row gutter={16}>
          {Object.entries(stats).map(([providerName, providerStats]: [string, any]) => {
            const okCount = providerStats.ok?.count || 0;
            const warningCount = providerStats.warning?.count || 0;
            const errorCount = providerStats.error?.count || 0;
            const total = okCount + warningCount + errorCount;
            
            return (
              <Col key={providerName} span={8}>
                <Card title={providerName.toUpperCase()}>
                  <Statistic
                    prefix={<BarChartOutlined />}
                    title="Total Auditorías"
                    value={total}
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>✅ OK:</span>
                      <span className="text-green-600">{okCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>⚠️ Warning:</span>
                      <span className="text-orange-600">{warningCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>❌ Error:</span>
                      <span className="text-red-600">{errorCount}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Panel de Auditoría */}
      <Card title="Ejecutar Auditoría">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Proveedor</label>
            <Select
              onChange={setProvider}
              options={[
                { label: 'OpenAI', value: 'openai' },
                { label: 'Anthropic', value: 'anthropic' },
                { label: 'DeepSeek', value: 'deepseek' },
                { label: 'Gemini', value: 'gemini' },
              ]}
              style={{ width: '100%' }}
              value={provider}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Días</label>
            <Select
              onChange={setDays}
              options={[
                { label: 'Últimos 7 días', value: 7 },
                { label: 'Últimos 14 días', value: 14 },
                { label: 'Últimos 30 días', value: 30 },
              ]}
              style={{ width: '100%' }}
              value={days}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Development</label>
            <Select
              onChange={setDevelopment}
              options={[
                { label: 'Bodas de Hoy', value: 'bodasdehoy' },
              ]}
              style={{ width: '100%' }}
              value={development}
            />
          </div>
          <Button
            icon={<BarChartOutlined />}
            loading={auditing}
            onClick={runAudit}
            size="large"
            type="primary"
          >
            Ejecutar Auditoría
          </Button>
        </div>
      </Card>

      {/* Resultado de Auditoría */}
      {auditResult && (
        <Card title="Resultado de la Última Auditoría">
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Proveedor"
                  value={auditResult.provider.toUpperCase()}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Status"
                  valueRender={() => getStatusTag(auditResult.status)}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  precision={6}
                  prefix="$"
                  title="Costo Calculado"
                  value={auditResult.calculated_total}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  precision={6}
                  prefix="$"
                  title="Costo API"
                  value={auditResult.api_total}
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  precision={6}
                  prefix="$"
                  title="Diferencia"
                  value={auditResult.difference}
                  valueStyle={{ 
                    color: auditResult.difference_percent > 10 ? '#ff4d4f' : 
                           auditResult.difference_percent > 5 ? '#faad14' : '#52c41a' 
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  precision={2}
                  suffix="%"
                  title="Diferencia Porcentual"
                  value={auditResult.difference_percent}
                  valueStyle={{ 
                    color: auditResult.difference_percent > 10 ? '#ff4d4f' : 
                           auditResult.difference_percent > 5 ? '#faad14' : '#52c41a' 
                  }}
                />
              </Col>
            </Row>
            <div>
              <p className="text-sm text-gray-600">
                <strong>Período:</strong> {new Date(auditResult.period.start).toLocaleDateString('es-ES')} - {new Date(auditResult.period.end).toLocaleDateString('es-ES')}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Verificado:</strong> {new Date(auditResult.verified_at).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Historial de Auditorías */}
      <Card title="Historial de Auditorías">
        <Table
          columns={historyColumns}
          dataSource={history}
          loading={loading}
          pagination={{ pageSize: 20 }}
          rowKey="_id"
        />
      </Card>
    </div>
  );
}













