'use client';

import { useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import { Button, Card, Badge, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

import { SUPPORT_KEYS } from '@/const/supportKeys';

const { Title, Text, Paragraph } = Typography;

interface TestResult {
  development: string;
  duration?: number;
  error?: string;
  response?: any;
  status: 'pending' | 'success' | 'error';
  supportKey: string;
}

export default function API2DebugPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const testWhitelabel = async (development: string, supportKey: string): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:8030/graphql', {
        body: JSON.stringify({
          query: `
            query GetWhiteLabelFullConfig($development: String!, $supportKey: String!) {
              getWhiteLabelFullConfig(development: $development, supportKey: $supportKey) {
                success
                development

                info {
                  name
                  description
                  domain
                  domainsAllowed
                  contactEmail
                  timezone
                  active
                }

                branding {
                  logo
                  logoDark
                  favicon
                  appleTouchIcon
                  ogImage
                  colors {
                    primary
                    secondary
                    accent
                    background
                    text
                  }
                }

                messages {
                  assistantName
                  welcomeTitle
                  welcomeSubtitle
                  chatInitial
                  emptyState
                  inputPlaceholder
                }

                aiProvider
                aiApiKey
                aiModel
                availableProviders

                aiPrompts {
                  assistantPersonality
                  greetingStyle
                  contextFocus
                  tone
                  language
                }

                features {
                  whatsappIntegration
                  photoGallery
                  budgetModule
                  guestManagement
                  calendarSync
                  aiSuggestions
                  voiceMessages
                  fileSharing
                }

                errors {
                  field
                  message
                  code
                }
              }
            }
          `,
          variables: { development, supportKey },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Developer': development,
          'Origin': `https://${development}.com`,
          'SupportKey': supportKey,
        },
        method: 'POST',
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.errors) {
        return {
          development,
          duration,
          error: data.errors[0]?.message || 'GraphQL Error',
          status: 'error',
          supportKey,
        };
      }

      if (data.data?.getWhiteLabelFullConfig?.success) {
        return {
          development,
          duration,
          response: data.data.getWhiteLabelFullConfig,
          status: 'success',
          supportKey,
        };
      }

      return {
        development,
        duration,
        error: data.data?.getWhiteLabelFullConfig?.errors?.[0]?.message || 'Unknown error',
        status: 'error',
        supportKey,
      };
    } catch (error: any) {
      return {
        development,
        duration: Date.now() - startTime,
        error: error.message,
        status: 'error',
        supportKey,
      };
    }
  };

  const testAll = async () => {
    setTesting(true);
    setResults([]);

    const developments = Object.keys(SUPPORT_KEYS);
    const testResults: TestResult[] = [];

    for (const development of developments) {
      const supportKey = SUPPORT_KEYS[development];

      // Agregar resultado "pending"
      setResults((prev) => [
        ...prev,
        { development, status: 'pending', supportKey },
      ]);

      // Ejecutar test
      const result = await testWhitelabel(development, supportKey);

      // Actualizar resultado
      testResults.push(result);
      setResults((prev) =>
        prev.map((r) =>
          r.development === development ? result : r
        )
      );
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': {
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      }
      case 'error': {
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
      }
      case 'pending': {
        return <LoadingOutlined style={{ fontSize: 20 }} />;
      }
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': {
        return <Badge status="success" text="Conectado" />;
      }
      case 'error': {
        return <Badge status="error" text="Error" />;
      }
      case 'pending': {
        return <Badge status="processing" text="Probando..." />;
      }
    }
  };

  return (
    <Flexbox padding={24} style={{ margin: '0 auto', maxWidth: 1400 }}>
      <Flexbox gap={16} style={{ marginBottom: 24 }}>
        <Title level={2}>🔍 API2 Debug - Test de Whitelabels</Title>
        <Paragraph>
          Esta herramienta prueba la conexión con API2 usando los supportKeys de cada whitelabel.
        </Paragraph>
        <Button
          disabled={testing}
          loading={testing}
          onClick={testAll}
          size="large"
          type="primary"
        >
          {testing ? 'Probando...' : 'Probar Todos los Whitelabels'}
        </Button>
      </Flexbox>

      <Flexbox gap={16}>
        {results.map((result) => (
          <Card
            key={result.development}
            style={{
              borderLeft: `4px solid ${
                result.status === 'success'
                  ? '#52c41a'
                  : result.status === 'error'
                  ? '#ff4d4f'
                  : '#1890ff'
              }`,
            }}
          >
            <Flexbox gap={12}>
              <Flexbox align="center" horizontal justify="space-between">
                <Flexbox align="center" gap={12} horizontal>
                  {getStatusIcon(result.status)}
                  <Title level={4} style={{ margin: 0 }}>
                    {result.development}
                  </Title>
                </Flexbox>
                {getStatusBadge(result.status)}
              </Flexbox>

              <Flexbox gap={8}>
                <Text type="secondary">
                  <strong>SupportKey:</strong> {result.supportKey}
                </Text>
                {result.duration && (
                  <Text type="secondary">
                    <strong>Tiempo:</strong> {result.duration}ms
                  </Text>
                )}
              </Flexbox>

              {result.status === 'success' && result.response && (
                <Flexbox
                  gap={12}
                  style={{
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 4,
                    padding: 16,
                  }}
                >
                  <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                    ✅ Configuración completa obtenida exitosamente
                  </Text>

                  {/* Información General */}
                  {result.response.info && (
                    <Flexbox gap={8} style={{ background: '#fff', borderRadius: 4, padding: 12 }}>
                      <Text strong style={{ fontSize: 14, marginBottom: 4 }}>📋 Información General</Text>
                      <Flexbox gap={4}>
                        <Text><strong>Nombre:</strong> {result.response.info.name || 'N/A'}</Text>
                        <Text><strong>Descripción:</strong> {result.response.info.description || 'N/A'}</Text>
                        <Text><strong>Dominio:</strong> {result.response.info.domain || 'N/A'}</Text>
                        <Text><strong>Email:</strong> {result.response.info.contactEmail || 'N/A'}</Text>
                        <Text><strong>Activo:</strong> {result.response.info.active ? '✅ Sí' : '❌ No'}</Text>
                      </Flexbox>
                    </Flexbox>
                  )}

                  {/* Configuración AI */}
                  <Flexbox gap={8} style={{ background: '#fff', borderRadius: 4, padding: 12 }}>
                    <Text strong style={{ fontSize: 14, marginBottom: 4 }}>🤖 Configuración AI</Text>
                    <Flexbox gap={4}>
                      <Text>
                        <strong>Provider:</strong>{' '}
                        <Tag color="blue">{result.response.aiProvider || 'Sin configurar'}</Tag>
                      </Text>
                      <Text>
                        <strong>Model:</strong>{' '}
                        <Tag color="green">{result.response.aiModel || 'Sin configurar'}</Tag>
                      </Text>
                      <Text>
                        <strong>API Key:</strong>{' '}
                        <Tag color="purple">{result.response.aiApiKey ? '●●●●●●' : 'Sin configurar'}</Tag>
                      </Text>
                      {result.response.availableProviders && (
                        <Text>
                          <strong>Providers disponibles:</strong>{' '}
                          {result.response.availableProviders.join(', ') || 'N/A'}
                        </Text>
                      )}
                    </Flexbox>
                  </Flexbox>

                  {/* Mensajes */}
                  {result.response.messages && (
                    <Flexbox gap={8} style={{ background: '#fff', borderRadius: 4, padding: 12 }}>
                      <Text strong style={{ fontSize: 14, marginBottom: 4 }}>💬 Mensajes</Text>
                      <Flexbox gap={4}>
                        <Text><strong>Asistente:</strong> {result.response.messages.assistantName || 'N/A'}</Text>
                        <Text><strong>Título bienvenida:</strong> {result.response.messages.welcomeTitle || 'N/A'}</Text>
                        <Text><strong>Subtítulo:</strong> {result.response.messages.welcomeSubtitle || 'N/A'}</Text>
                        <Text><strong>Placeholder:</strong> {result.response.messages.inputPlaceholder || 'N/A'}</Text>
                      </Flexbox>
                    </Flexbox>
                  )}

                  {/* Features */}
                  {result.response.features && (
                    <Flexbox gap={8} style={{ background: '#fff', borderRadius: 4, padding: 12 }}>
                      <Text strong style={{ fontSize: 14, marginBottom: 4 }}>⚙️ Features</Text>
                      <Flexbox gap={4} horizontal wrap>
                        {Object.entries(result.response.features).map(([key, value]) => (
                          <Tag color={value ? 'green' : 'default'} key={key}>
                            {key}: {value ? '✅' : '❌'}
                          </Tag>
                        ))}
                      </Flexbox>
                    </Flexbox>
                  )}

                  {/* Branding */}
                  {result.response.branding && (
                    <Flexbox gap={8} style={{ background: '#fff', borderRadius: 4, padding: 12 }}>
                      <Text strong style={{ fontSize: 14, marginBottom: 4 }}>🎨 Branding</Text>
                      <Flexbox gap={4}>
                        {result.response.branding.logo && (
                          <Text><strong>Logo:</strong> {result.response.branding.logo}</Text>
                        )}
                        {result.response.branding.colors && (
                          <Flexbox gap={4} horizontal wrap>
                            {Object.entries(result.response.branding.colors).map(([key, value]) => (
                              <Tag color="purple" key={key}>
                                {key}: {String(value)}
                              </Tag>
                            ))}
                          </Flexbox>
                        )}
                      </Flexbox>
                    </Flexbox>
                  )}

                  {/* Prompts AI */}
                  {result.response.aiPrompts && (
                    <Flexbox gap={8} style={{ background: '#fff', borderRadius: 4, padding: 12 }}>
                      <Text strong style={{ fontSize: 14, marginBottom: 4 }}>📝 Prompts AI</Text>
                      <Flexbox gap={4}>
                        {Object.entries(result.response.aiPrompts).map(([key, value]) => (
                          <Text key={key}>
                            <strong>{key}:</strong> {String(value || 'N/A')}
                          </Text>
                        ))}
                      </Flexbox>
                    </Flexbox>
                  )}

                  {/* Ver JSON completo (colapsable) */}
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ color: '#1890ff', cursor: 'pointer', fontWeight: 500 }}>
                      📄 Ver JSON completo
                    </summary>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        fontSize: 11,
                        marginTop: 8,
                        maxHeight: 400,
                        overflow: 'auto',
                        padding: 12,
                      }}
                    >
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </details>
                </Flexbox>
              )}

              {result.status === 'error' && result.error && (
                <Flexbox
                  style={{
                    background: '#fff2f0',
                    border: '1px solid #ffccc7',
                    borderRadius: 4,
                    padding: 12,
                  }}
                >
                  <Text strong style={{ color: '#ff4d4f' }}>
                    ❌ Error
                  </Text>
                  <Text type="secondary">{result.error}</Text>
                </Flexbox>
              )}
            </Flexbox>
          </Card>
        ))}
      </Flexbox>

      {results.length === 0 && !testing && (
        <Flexbox
          align="center"
          justify="center"
          style={{
            background: '#fafafa',
            border: '2px dashed #d9d9d9',
            borderRadius: 8,
            padding: 48,
          }}
        >
          <Text style={{ fontSize: 16 }} type="secondary">
            Haz clic en el botón para probar todos los whitelabels
          </Text>
        </Flexbox>
      )}
    </Flexbox>
  );
}

