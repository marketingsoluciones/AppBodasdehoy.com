'use client';

import { Alert, Button, Card, Form, Input, Select, Tag, Typography } from 'antd';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import EventSelector from '@/components/EventSelector';
import { useAuthCheck } from '@/hooks/useAuthCheck';

const { Title, Paragraph, Text } = Typography;

type CampaignChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';

interface CampaignForm {
  channel: CampaignChannel;
  eventoId: string;
  message: string;
  subject?: string;
}

const CHANNEL_OPTIONS = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'SMS', value: 'SMS' },
];

/**
 * Panel de Campañas CRM.
 * Usa EventSelector (getEventosByUsuario via API2) para seleccionar
 * el evento al que va dirigida la campaña.
 *
 * Cuando api-ia avise que la cola está conectada, este formulario
 * podrá enviar campañas reales.
 *
 * Referencia: docs/AVANCES-API-IA-RESPUESTAS-SLACK.md
 */
const CampaignsPage = memo(() => {
  const { checkAuth } = useAuthCheck();
  const { development } = checkAuth();

  const [form] = Form.useForm<CampaignForm>();
  const [selectedEventoId, setSelectedEventoId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values: CampaignForm) => {
    setSubmitting(true);
    // TODO: conectar con la cola de api-ia cuando esté disponible.
    // Ver: docs/AVANCES-API-IA-RESPUESTAS-SLACK.md — "Re-probar campañas cuando api-ia avise"
    await new Promise((r) => setTimeout(r, 800));
    console.log('[Campaigns] Formulario listo para enviar:', values);
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <Flexbox gap={24} style={{ maxWidth: 700, padding: 0 }}>
      <Flexbox gap={8}>
        <Title level={3} style={{ margin: 0 }}>
          Campañas CRM
        </Title>
        <Paragraph style={{ margin: 0 }} type="secondary">
          Envía campañas a los invitados de un evento. Selecciona el evento (vía{' '}
          <code>getEventosByUsuario</code>) y configura el mensaje.
        </Paragraph>
      </Flexbox>

      <Alert
        description={
          <>
            La cola de envío está en integración por api-ia + API2. Cuando esté lista, este
            formulario enviará la campaña real.{' '}
            <Text type="secondary">Ver #copilot-api-ia para avisos.</Text>
          </>
        }
        message="Cola de campañas: pendiente de conexión api-ia"
        showIcon
        type="info"
      />

      {submitted && (
        <Alert
          description="La campaña se enviará cuando la cola esté conectada (api-ia avisará por #copilot-api-ia)."
          message="Formulario listo"
          showIcon
          type="success"
        />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Evento"
            name="eventoId"
            rules={[{ message: 'Selecciona un evento', required: true }]}
          >
            <EventSelector
              development={development}
              onChange={(id) => setSelectedEventoId(id)}
              value={selectedEventoId}
            />
          </Form.Item>

          <Form.Item
            label="Canal"
            name="channel"
            rules={[{ message: 'Selecciona un canal', required: true }]}
          >
            <Select options={CHANNEL_OPTIONS} placeholder="Selecciona canal" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.channel !== cur.channel}
          >
            {({ getFieldValue }) =>
              getFieldValue('channel') === 'EMAIL' ? (
                <Form.Item label="Asunto" name="subject">
                  <Input placeholder="Asunto del correo" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            label="Mensaje"
            name="message"
            rules={[{ message: 'Escribe el mensaje', required: true }]}
          >
            <Input.TextArea
              placeholder="Escribe el mensaje de la campaña..."
              rows={4}
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item>
            <Button
              disabled={submitting}
              htmlType="submit"
              loading={submitting}
              type="primary"
            >
              {submitting ? 'Preparando...' : 'Preparar campaña'}
            </Button>
            <Tag color="orange" style={{ marginLeft: 12 }}>
              Cola pendiente de api-ia
            </Tag>
          </Form.Item>
        </Form>
      </Card>
    </Flexbox>
  );
});

CampaignsPage.displayName = 'CampaignsPage';
export default CampaignsPage;
