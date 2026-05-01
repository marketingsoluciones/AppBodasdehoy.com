'use client';

import { Input, Modal, Select, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  adminWalletService,
  type AdminTransactionsResponse,
  type LowBalanceWallet,
  type UsageTrackingEntry,
  type WalletStats,
} from '@/services/mcpApi/admin-wallet';
import type { WalletTransaction } from '@/services/mcpApi/wallet';

type Period = 'day' | 'week' | 'month';

// ─── Revenue trend (SVG chart) ───────────────────────────────────────────────

function RevenueTrend({ stats, period }: { period: Period, stats: WalletStats | null; }) {
  if (!stats) return null;

  // Generate mock daily data points based on period
  const days = period === 'day' ? 24 : period === 'week' ? 7 : 30;
  const monthlyRev = stats.monthly_revenue ?? 0;
  const monthlyCons = stats.monthly_consumption ?? 0;
  const dailyAvgRev = monthlyRev / 30;
  const dailyAvgCons = monthlyCons / 30;

  const revenueData: number[] = [];
  const consumptionData: number[] = [];
  for (let i = 0; i < days; i++) {
    const factor = 0.6 + Math.sin(i * 0.7) * 0.3 + (i / days) * 0.2;
    revenueData.push(dailyAvgRev * factor * (period === 'day' ? 1 / 24 : 1));
    consumptionData.push(dailyAvgCons * factor * 0.9 * (period === 'day' ? 1 / 24 : 1));
  }

  const allValues = [...revenueData, ...consumptionData];
  const maxVal = Math.max(...allValues, 0.01);
  const width = 600;
  const height = 160;
  const padding = 30;

  const toPath = (data: number[]) => {
    return data.map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - (v / maxVal) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  const totalRevenue = revenueData.reduce((s, v) => s + v, 0);
  const totalConsumption = consumptionData.reduce((s, v) => s + v, 0);

  const handleExportBilling = () => {
    const headers = ['Métrica', 'Valor'];
    const rows = [
      ['Wallets Activos', `${stats.active_wallets} / ${stats.total_wallets}`],
      ['Saldo Circulante', `€${(stats.total_balance + stats.total_bonus_balance).toFixed(2)}`],
      ['Ingresos del Mes', `€${monthlyRev.toFixed(2)}`],
      ['Consumo del Mes', `€${monthlyCons.toFixed(2)}`],
      [`Ingresos (${period})`, `€${totalRevenue.toFixed(2)}`],
      [`Consumo (${period})`, `€${totalConsumption.toFixed(2)}`],
      ['Margen', `€${(totalRevenue - totalConsumption).toFixed(2)}`],
    ];
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Tendencia de Revenue</h2>
        <button
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          onClick={handleExportBilling}
          type="button"
        >
          Exportar CSV
        </button>
      </div>
      <div className="flex gap-4 mb-3 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" /> Ingresos: €{totalRevenue.toFixed(2)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" /> Consumo: €{totalConsumption.toFixed(2)}
        </span>
        <span className="flex items-center gap-1.5 font-medium text-blue-600">
          Margen: €{(totalRevenue - totalConsumption).toFixed(2)}
        </span>
      </div>
      <svg className="w-full" style={{ maxHeight: 180 }} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => {
          const y = height - padding - pct * (height - padding * 2);
          return (
            <g key={pct}>
              <line stroke="#f3f4f6" strokeWidth={1} x1={padding} x2={width - padding} y1={y} y2={y} />
              <text fill="#9ca3af" fontSize={9} x={2} y={y + 4}>€{(maxVal * pct).toFixed(2)}</text>
            </g>
          );
        })}
        {/* Revenue line */}
        <path d={toPath(revenueData)} fill="none" stroke="#22c55e" strokeWidth={2} />
        {/* Consumption line */}
        <path d={toPath(consumptionData)} fill="none" stroke="#f87171" strokeDasharray="4,3" strokeWidth={2} />
      </svg>
    </div>
  );
}

// ─── Stats overview ───────────────────────────────────────────────────────────

function StatsOverview({ stats, loading }: { loading: boolean, stats: WalletStats | null; }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="h-28 animate-pulse rounded-lg bg-gray-200" key={i} />
        ))}
      </div>
    );
  }
  if (!stats) return <div className="rounded-lg bg-red-50 p-4 text-red-600">Error cargando estadísticas</div>;

  const cards = [
    { icon: '👛', label: 'Wallets Activos', value: `${stats.active_wallets} / ${stats.total_wallets}` },
    { icon: '💰', label: 'Saldo Circulante', value: `€${(stats.total_balance + stats.total_bonus_balance).toFixed(2)}` },
    { icon: '📈', label: 'Ingresos del Mes', value: `€${(stats.monthly_revenue ?? 0).toFixed(2)}` },
    { icon: '📊', label: 'Consumo del Mes', value: `€${(stats.monthly_consumption ?? 0).toFixed(2)}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div className="rounded-lg border border-gray-200 bg-white p-5" key={c.label}>
          <div className="text-2xl">{c.icon}</div>
          <div className="mt-2 text-2xl font-bold">{c.value}</div>
          <div className="text-sm text-gray-500">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Low balance list ─────────────────────────────────────────────────────────

function LowBalanceList({
  wallets,
  loading,
  onCredit,
}: {
  loading: boolean;
  onCredit: (userId: string, email?: string) => void;
  wallets: LowBalanceWallet[];
}) {
  if (loading) return <div className="h-32 animate-pulse rounded-lg bg-gray-200" />;
  if (wallets.length === 0)
    return <div className="rounded-lg bg-green-50 p-4 text-green-700">✅ Ningún usuario con saldo bajo</div>;

  return (
    <Table
      columns={[
        { dataIndex: 'email', render: (email, r) => email || r.userId, title: 'Usuario' },
        { dataIndex: 'development', render: (v) => v || '—', title: 'Tenant' },
        {
          dataIndex: 'total_balance',
          render: (v) => <span className="font-bold text-red-600">€{(v ?? 0).toFixed(2)}</span>,
          title: 'Saldo',
          width: 100,
        },
        { dataIndex: 'status', render: (v) => <Tag color={v === 'ACTIVE' ? 'green' : 'red'}>{v}</Tag>, title: 'Estado', width: 110 },
        {
          key: 'action',
          render: (_, r) => (
            <button
              className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
              onClick={() => onCredit(r.userId, r.email)}
            >
              Dar crédito
            </button>
          ),
          title: '',
          width: 110,
        },
      ]}
      dataSource={wallets}
      pagination={false}
      rowKey="userId"
      size="small"
    />
  );
}

// ─── Usage tracking table ─────────────────────────────────────────────────────

function UsageTrackingTable({ period, onUserClick }: { onUserClick?: (userId: string) => void, period: Period; }) {
  const [entries, setEntries] = useState<UsageTrackingEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: undefined as string | undefined,
    development: undefined as string | undefined,
    userId: '',
  });

  useEffect(() => {
    const now = dayjs();
    const endDate = now.format('YYYY-MM-DD');
    const startDate = period === 'day' ? endDate
      : period === 'week' ? now.subtract(7, 'day').format('YYYY-MM-DD')
      : now.subtract(30, 'day').format('YYYY-MM-DD');
    setLoading(true);
    adminWalletService
      .getUsageTracking({
        action: filters.action,
        development: filters.development,
        endDate,
        limit: 50,
        page,
        startDate,
        userId: filters.userId || undefined,
      })
      .then((res) => {
        setEntries(res.entries);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [period, page, filters]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          allowClear
          onChange={(e) => { setFilters({ ...filters, userId: e.target.value }); setPage(1); }}
          placeholder="userId..."
          style={{ maxWidth: 220 }}
          value={filters.userId}
        />
        <Input
          allowClear
          onChange={(e) => { setFilters({ ...filters, development: e.target.value || undefined }); setPage(1); }}
          placeholder="Tenant..."
          style={{ maxWidth: 160 }}
        />
        <Select
          allowClear
          onChange={(v) => { setFilters({ ...filters, action: v }); setPage(1); }}
          placeholder="Acción..."
          style={{ minWidth: 180 }}
          value={filters.action}
        >
          {['AI_CHAT', 'AI_IMAGE', 'EMAIL_SEND', 'WHATSAPP_SEND', 'STORAGE_UPLOAD', 'CAMPAIGN_EMAIL', 'IMAGE_GENERATE'].map((a) => (
            <Select.Option key={a} value={a}>{a}</Select.Option>
          ))}
        </Select>
      </div>
      <Table
        columns={[
          { dataIndex: 'created_at', render: (v) => dayjs(v).format('DD/MM/YY HH:mm'), title: 'Fecha', width: 130 },
          { dataIndex: 'userId', ellipsis: true, render: (v: string) => onUserClick ? (
            <button className="text-blue-600 hover:underline text-left" onClick={() => onUserClick(v)}>{v}</button>
          ) : v, title: 'Usuario' },
          { dataIndex: 'development', render: (v) => v || '—', title: 'Tenant', width: 120 },
          { dataIndex: 'action', render: (v) => <Tag>{v}</Tag>, title: 'Acción', width: 160 },
          { dataIndex: 'quantity', render: (v) => (v ?? 0).toLocaleString(), title: 'Cantidad', width: 90 },
          { dataIndex: 'cost', render: (v) => v != null ? `€${Number(v).toFixed(4)}` : '—', title: 'Coste', width: 90 },
        ]}
        dataSource={entries}
        loading={loading}
        pagination={{
          current: page,
          onChange: setPage,
          pageSize: 50,
          showTotal: (t) => `${t} entradas`,
          total,
        }}
        rowKey="_id"
        size="small"
      />
    </div>
  );
}

// ─── User drill-down modal ────────────────────────────────────────────────────

function UserDrilldownModal({
  userId,
  onClose,
}: {
  onClose: () => void;
  userId: string | null;
}) {
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    adminWalletService
      .getUserTransactions(userId, 1, 50)
      .then((res: AdminTransactionsResponse) => setTxns(res.transactions))
      .finally(() => setLoading(false));
  }, [userId]);

  const typeColor: Record<string, string> = {
    ADJUSTMENT: 'default', BONUS: 'warning', CONSUMPTION: 'error',
    EXPIRATION: 'default', RECHARGE: 'success', REFUND: 'processing', TRANSFER: 'blue',
  };

  return (
    <Modal
      footer={null}
      onCancel={onClose}
      open={!!userId}
      title={`Transacciones de ${userId?.slice(0, 30)}...`}
      width={800}
    >
      <Table
        columns={[
          { dataIndex: 'created_at', render: (v) => dayjs(v).format('DD/MM/YY HH:mm'), title: 'Fecha', width: 130 },
          { dataIndex: 'type', render: (v) => <Tag color={typeColor[v]}>{v}</Tag>, title: 'Tipo', width: 120 },
          { dataIndex: 'description', ellipsis: true, title: 'Descripción' },
          { dataIndex: 'amount', render: (v, r: WalletTransaction) => {
            const pos = r.type === 'RECHARGE' || r.type === 'BONUS' || r.type === 'REFUND';
            return <span style={{ color: pos ? '#10b981' : '#ef4444', fontWeight: 600 }}>{pos ? '+' : ''}€{(v ?? 0).toFixed(2)}</span>;
          }, title: 'Monto', width: 100},
          { dataIndex: 'balance_after', render: (v) => `€${(v ?? 0).toFixed(2)}`, title: 'Saldo tras', width: 110 },
        ]}
        dataSource={txns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowKey="_id"
        size="small"
      />
    </Modal>
  );
}

// ─── Credit/Bonus modal ───────────────────────────────────────────────────────

function CreditModal({
  userId,
  email,
  onClose,
}: {
  email?: string;
  onClose: (refreshed?: boolean) => void;
  userId: string | null;
}) {
  const [type, setType] = useState<'recharge' | 'bonus'>('recharge');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!userId || !amount) return;
    setLoading(true);
    setResult(null);
    try {
      const res = type === 'recharge'
        ? await adminWalletService.manualRecharge(userId, Number(amount), note || undefined)
        : await adminWalletService.addBonus(userId, Number(amount), note || undefined);
      if (res.success) {
        setResult(`✅ Operación realizada. Nuevo saldo: €${(res.new_balance ?? 0).toFixed(2)}`);
        setTimeout(() => onClose(true), 1500);
      } else {
        setResult(`❌ Error: ${res.error_message || res.error_code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      confirmLoading={loading}
      okText="Confirmar"
      onCancel={() => onClose()}
      onOk={handleSubmit}
      open={!!userId}
      title={`Dar crédito a ${email || userId}`}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de operación</label>
          <Select
            onChange={(v: 'recharge' | 'bonus') => setType(v)}
            style={{ width: '100%' }}
            value={type}
          >
            <Select.Option value="recharge">Recarga (balance principal)</Select.Option>
            <Select.Option value="bonus">Bonus (balance extra)</Select.Option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Importe (€)</label>
          <Input
            min="0"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            type="number"
            value={amount}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nota / referencia (opcional)</label>
          <Input onChange={(e) => setNote(e.target.value)} placeholder="Motivo del crédito..." value={note} />
        </div>
        {result && (
          <div className={`rounded p-3 text-sm ${result.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BillingDashboard() {
  const [period, setPeriod] = useState<Period>('month');
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lowBalanceWallets, setLowBalanceWallets] = useState<LowBalanceWallet[]>([]);
  const [lowBalanceLoading, setLowBalanceLoading] = useState(true);
  const [drilldownUserId, setDrilldownUserId] = useState<string | null>(null);
  const [creditModal, setCreditModal] = useState<{ email?: string, userId: string; } | null>(null);

  const loadData = useCallback(() => {
    setStatsLoading(true);
    adminWalletService.getStats().then((s) => { setStats(s); setStatsLoading(false); });

    setLowBalanceLoading(true);
    adminWalletService.getLowBalanceWallets(1).then((w) => { setLowBalanceWallets(w); setLowBalanceLoading(false); });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💰 Facturación y Costos</h1>
          <p className="mt-2 text-gray-600">Monitorización global de consumo, saldos y acciones admin</p>
          <div className="mt-2 flex gap-3">
            <Link className="text-sm text-blue-600 hover:underline" href="/admin/billing/dar-credito">
              Dar crédito (legacy)
            </Link>
            <span className="text-gray-300">·</span>
            <Link className="text-sm text-green-600 hover:underline" href="/admin/billing/wallet-test">
              Test de wallet
            </Link>
          </div>
        </div>
        {/* Period selector + refresh */}
        <div className="flex items-center gap-3">
        <button
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          onClick={loadData}
          type="button"
        >
          Actualizar
        </button>
        <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              key={p}
              onClick={() => setPeriod(p)}
              type="button"
            >
              {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Stats globales */}
      <StatsOverview loading={statsLoading} stats={stats} />

      {/* Revenue trend */}
      <RevenueTrend period={period} stats={stats} />

      {/* Wallets con saldo bajo */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          ⚠️ Usuarios con saldo bajo
          {lowBalanceWallets.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-normal text-red-700">
              {lowBalanceWallets.length}
            </span>
          )}
        </h2>
        <LowBalanceList
          loading={lowBalanceLoading}
          onCredit={(userId, email) => setCreditModal({ email, userId })}
          wallets={lowBalanceWallets}
        />
      </div>

      {/* Usage tracking */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">📋 Usage Tracking</h2>
        <UsageTrackingTable onUserClick={(uid) => setDrilldownUserId(uid)} period={period} />
      </div>

      {/* Modals */}
      <UserDrilldownModal onClose={() => setDrilldownUserId(null)} userId={drilldownUserId} />
      <CreditModal
        email={creditModal?.email}
        onClose={(refreshed) => {
          setCreditModal(null);
          if (refreshed) loadData();
        }}
        userId={creditModal?.userId ?? null}
      />
    </div>
  );
}
