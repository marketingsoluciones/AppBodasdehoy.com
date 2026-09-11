'use client';

import { Alert, Badge, Button, Card, Collapse, Spin, Tag, Typography } from 'antd';
import { CheckCircle2, CreditCard, RefreshCw, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { walletService } from '@/services/mcpApi/wallet';
import { getMySubscription, getSubscriptionPlans } from '@/services/mcpApi/subscriptions';

const { Title, Text } = Typography;

// ===========================
// TYPES
// ===========================

type TestStatus = 'idle' | 'running' | 'ok' | 'error';

interface TestResult {
  data?: any;
  duration?: number;
  error?: string;
  name: string;
  status: TestStatus;
}

const INITIAL_TESTS: TestResult[] = [
  { name: 'wallet_getBalance', status: 'idle' },
  { name: 'wallet_getAutoRechargeConfig', status: 'idle' },
  { name: 'wallet_getPaymentMethods', status: 'idle' },
  { name: 'getSubscriptionPlans', status: 'idle' },
  { name: 'getMySubscription', status: 'idle' },
];

// ===========================
// TEST RUNNERS
// ===========================

async function runTest(name: string): Promise<{ data?: any; error?: string }> {
  switch (name) {
    case 'wallet_getBalance': {
      const data = await walletService.getBalance();
      if (!data.success) throw new Error(data.error ?? 'Error obteniendo saldo');
      return { data };
    }
    case 'wallet_getAutoRechargeConfig': {
      const data = await walletService.getAutoRechargeConfig();
      return { data: data ?? { message: 'null (no configurado)' } };
    }
    case 'wallet_getPaymentMethods': {
      const data = await walletService.getPaymentMethods();
      return { data: data.length === 0 ? '[] (sin métodos guardados)' : data };
    }
    case 'getSubscriptionPlans': {
      const data = await getSubscriptionPlans();
      if (data.length === 0) return { data: '[] (sin planes públicos)' };
      return { data: data.map((p) => ({ id: p.plan_id, name: p.name, tier: p.tier })) };
    }
    case 'getMySubscription': {
      const data = await getMySubscription();
      return { data: data ?? { message: 'null (sin suscripción activa)' } };
    }
    default: {
      throw new Error(`Test desconocido: ${name}`);
    }
  }
}

// ===========================
// STATUS ICON
// ===========================

function StatusIcon({ status }: { status: TestStatus }) {
  if (status === 'running') return <Spin size="small" />;
  if (status === 'ok') return <CheckCircle2 color="#52c41a" size={16} />;
  if (status === 'error') return <XCircle color="#ff4d4f" size={16} />;
  return <span style={{ color: '#d9d9d9', fontSize: 14 }}>○</span>;
}

// ===========================
// PAGE
// ===========================

export default function WalletTestPage() {
  const [tests, setTests] = useState<TestResult[]>(INITIAL_TESTS);
  const [globalRunning, setGlobalRunning] = useState(false);

  const updateTest = useCallback((name: string, patch: Partial<TestResult>) => {
    setTests((prev) => prev.map((t) => (t.name === name ? { ...t, ...patch } : t)));
  }, []);

  const runSingle = useCallback(
    async (name: string) => {
      updateTest(name, { data: undefined, error: undefined, status: 'running' });
      const start = Date.now();
      try {
        const { data, error } = await runTest(name);
        if (error) throw new Error(error);
        updateTest(name, { data, duration: Date.now() - start, status: 'ok' });
      } catch (err: any) {
        updateTest(name, { duration: Date.now() - start, error: err.message, status: 'error' });
      }
    },
    [updateTest],
  );

  const runAll = useCallback(async () => {
    setGlobalRunning(true);
    setTests(INITIAL_TESTS.map((t) => ({ ...t, status: 'running' })));

    await Promise.all(INITIAL_TESTS.map((t) => runSingle(t.name)));
    setGlobalRunning(false);
  }, [runSingle]);

  const okCount = tests.filter((t) => t.status === 'ok').length;
  const errorCount = tests.filter((t) => t.status === 'error').length;
  const allDone = tests.every((t) => t.status !== 'idle' && t.status !== 'running');

  return (
    <div style={{ maxWidth: 800, padding: '24px 24px 60px' }}>
      {/* Header */}
      <Flexbox align="center" gap={8} horizontal style={{ marginBottom: 8 }}>
        <Link href="/settings/admin/billing" style={{ color: '#6b7280', fontSize: 13 }}>
          ← Billing admin
        </Link>
        <span style={{ color: '#d9d9d9' }}>·</span>
        <Link href="/settings/billing" style={{ color: '#6b7280', fontSize: 13 }}>
          Mi billing
        </Link>
      </Flexbox>

      <Title level={3} style={{ marginBottom: 4 }}>
        Wallet &amp; Billing — Test de endpoints
      </Title>
      <Text style={{ color: '#6b7280' }}>
        Verifica que todos los endpoints de wallet y suscripción responden correctamente para el
        usuario actual. Funciona en cualquier entorno (chat-test, app-test, local).
      </Text>

      {/* Run all */}
      <Flexbox align="center" gap={12} horizontal style={{ marginBottom: 8, marginTop: 20 }}>
        <Button
          disabled={globalRunning}
          icon={<RefreshCw size={14} />}
          loading={globalRunning}
          onClick={runAll}
          type="primary"
        >
          Ejecutar todos los tests
        </Button>

        {allDone && (
          <Flexbox gap={8} horizontal>
            <Tag color="success">{okCount} OK</Tag>
            {errorCount > 0 && <Tag color="error">{errorCount} Error</Tag>}
          </Flexbox>
        )}
      </Flexbox>

      {/* Overall alert */}
      {allDone && errorCount === 0 && (
        <Alert
          message="Todos los endpoints responden correctamente"
          showIcon
          style={{ marginBottom: 16 }}
          type="success"
        />
      )}
      {allDone && errorCount > 0 && (
        <Alert
          message={`${errorCount} endpoint(s) con error. Revisa los detalles abajo.`}
          showIcon
          style={{ marginBottom: 16 }}
          type="error"
        />
      )}

      {/* Test cards */}
      <Flexbox gap={10}>
        {tests.map((test) => (
          <Card
            key={test.name}
            size="small"
            style={{
              border: test.status === 'error'
                ? '1px solid #ffccc7'
                : test.status === 'ok'
                ? '1px solid #b7eb8f'
                : undefined,
            }}
          >
            <Flexbox align="center" gap={10} horizontal justify="space-between">
              <Flexbox align="center" gap={10} horizontal>
                <StatusIcon status={test.status} />
                <code style={{ fontSize: 13, fontWeight: 600 }}>{test.name}</code>
                {test.status === 'ok' && (
                  <Badge
                    color="green"
                    text={
                      <span style={{ color: '#52c41a', fontSize: 12 }}>
                        {test.duration}ms
                      </span>
                    }
                  />
                )}
                {test.status === 'error' && (
                  <Badge
                    color="red"
                    text={
                      <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                        {test.duration}ms
                      </span>
                    }
                  />
                )}
              </Flexbox>

              <Button
                disabled={test.status === 'running' || globalRunning}
                loading={test.status === 'running'}
                onClick={() => runSingle(test.name)}
                size="small"
              >
                Ejecutar
              </Button>
            </Flexbox>

            {/* Error message */}
            {test.status === 'error' && test.error && (
              <Alert
                message={test.error}
                showIcon
                style={{ marginTop: 8 }}
                type="error"
              />
            )}

            {/* Response data */}
            {test.status === 'ok' && test.data !== undefined && (
              <Collapse
                ghost
                items={[
                  {
                    children: (
                      <pre
                        style={{
                          background: '#f6f8fa',
                          borderRadius: 6,
                          fontSize: 11,
                          maxHeight: 240,
                          overflowY: 'auto',
                          padding: '8px 12px',
                        }}
                      >
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    ),
                    key: 'data',
                    label: (
                      <span style={{ color: '#52c41a', fontSize: 12 }}>
                        Ver respuesta →
                      </span>
                    ),
                  },
                ]}
                size="small"
                style={{ marginTop: 4 }}
              />
            )}
          </Card>
        ))}
      </Flexbox>

      {/* Quick links */}
      <div
        style={{
          background: '#f9fafb',
          borderRadius: 10,
          marginTop: 24,
          padding: '16px 20px',
        }}
      >
        <Text style={{ color: '#374151', fontWeight: 600 }}>Accesos rápidos</Text>
        <Flexbox gap={8} horizontal style={{ marginTop: 8 }} wrap="wrap">
          <Link href="/settings/billing">
            <Button icon={<CreditCard size={14} />} size="small">
              Mi billing
            </Button>
          </Link>
          <Link href="/settings/billing/planes">
            <Button size="small">Planes</Button>
          </Link>
          <Link href="/settings/billing/transactions">
            <Button size="small">Transacciones</Button>
          </Link>
          <Link href="/settings/admin/billing">
            <Button size="small">Admin billing</Button>
          </Link>
        </Flexbox>
      </div>

      {/* Legend */}
      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
        <Zap size={12} style={{ display: 'inline', marginRight: 4 }} />
        Los tests usan el JWT del usuario actual. Los endpoints de wallet requieren estar autenticado.
        Los planes ({' '}
        <code>getSubscriptionPlans</code>) son públicos y no requieren auth.
      </div>
    </div>
  );
}
