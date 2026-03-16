'use client';

import { Alert, Button, Card, DatePicker, Form, Input, Select, Tabs, Tag, Typography } from 'antd';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import EventSelector from '@/components/EventSelector';
import { useAuthCheck } from '@/hooks/useAuthCheck';

const { Title, Paragraph, Text } = Typography;

type CampaignChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';

interface CampaignForm {
  channel: CampaignChannel;
  eventoId: string;
  message: string;
  scheduledAt?: string;
  subject?: string;
}

const DRAFT_KEY = 'bodas_campaign_draft';

const CHANNEL_OPTIONS = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'SMS', value: 'SMS' },
];

interface Template {
  id: string;
  name: string;
  channel: CampaignChannel;
  subject?: string;
  message: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'welcome',
    name: 'Bienvenida',
    channel: 'EMAIL',
    subject: 'Te damos la bienvenida a nuestro evento',
    message: 'Hola! Nos encanta que formes parte de nuestro evento. Aquí encontrarás toda la información que necesitas para prepararte. No dudes en escribirnos si tienes alguna pregunta.',
  },
  {
    id: 'reminder',
    name: 'Recordatorio',
    channel: 'WHATSAPP',
    message: 'Hola! Te recordamos que nuestro evento se acerca. No olvides confirmar tu asistencia. Te esperamos con muchas ganas!',
  },
  {
    id: 'thanks',
    name: 'Agradecimiento',
    channel: 'EMAIL',
    subject: 'Gracias por acompañarnos',
    message: 'Queremos agradecerte por haber sido parte de nuestro evento. Fue un día muy especial y tu presencia lo hizo aún más memorable. Pronto compartiremos las fotos!',
  },
  {
    id: 'info',
    name: 'Información',
    channel: 'SMS',
    message: 'Info importante: El evento será el [FECHA] a las [HORA] en [LUGAR]. Confirma tu asistencia aquí: [LINK]',
  },
];

function saveDraft(values: Partial<CampaignForm>) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(values)); } catch { /* ignore */ }
}

function loadDraft(): Partial<CampaignForm> | null {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

/** Preview panel showing how the message looks per channel */
function MessagePreview({ channel, message, subject }: { channel?: CampaignChannel; message?: string; subject?: string }) {
  if (!message) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-gray-400 text-sm">
        Escribe un mensaje para ver la vista previa
      </div>
    );
  }

  if (channel === 'WHATSAPP') {
    return (
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-2 font-medium">Vista previa WhatsApp</div>
        <div className="bg-[#e5ddd5] rounded-lg p-4">
          <div className="max-w-[280px] bg-white rounded-lg px-3 py-2 shadow-sm">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{message}</p>
            <div className="text-right text-[10px] text-gray-400 mt-1">12:00 ✓✓</div>
          </div>
        </div>
      </div>
    );
  }

  if (channel === 'SMS') {
    const charCount = message.length;
    const smsCount = Math.ceil(charCount / 160);
    return (
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-2 font-medium">Vista previa SMS</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="max-w-[280px] ml-auto bg-blue-500 text-white rounded-2xl rounded-br-sm px-3 py-2">
            <p className="text-sm whitespace-pre-wrap">{message}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className={charCount > 160 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
            {charCount}/160 caracteres
          </span>
          {smsCount > 1 && (
            <span className="text-orange-600">({smsCount} SMS)</span>
          )}
        </div>
      </div>
    );
  }

  // EMAIL
  return (
    <div className="p-4">
      <div className="text-xs text-gray-500 mb-2 font-medium">Vista previa Email</div>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
          <div className="text-xs text-gray-400">Asunto:</div>
          <div className="text-sm font-medium text-gray-800">{subject || '(sin asunto)'}</div>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 text-[10px] text-gray-400">
          Enviado desde Bodasdehoy.com
        </div>
      </div>
    </div>
  );
}

/**
 * Panel de Campañas CRM.
 * Templates, auto-save draft, preview por canal, scheduling UI.
 */
const CampaignsPage = memo(() => {
  const { checkAuth } = useAuthCheck();
  const { development } = useMemo(() => checkAuth(), [checkAuth]);

  const [form] = Form.useForm<CampaignForm>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('form');

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      form.setFieldsValue(draft);
      setDraftSaved(true);
    }
  }, [form]);

  // Auto-save draft on form changes
  const handleValuesChange = useCallback((_: unknown, allValues: Partial<CampaignForm>) => {
    saveDraft(allValues);
    setDraftSaved(true);
    setSubmitted(false);
  }, []);

  const applyTemplate = useCallback((template: Template) => {
    form.setFieldsValue({
      channel: template.channel,
      message: template.message,
      subject: template.subject,
    });
    saveDraft(form.getFieldsValue());
    setDraftSaved(true);
    setActiveTab('form');
  }, [form]);

  const handleSubmit = async (values: CampaignForm) => {
    setSubmitting(true);
    // TODO: conectar con la cola de api-ia cuando esté disponible.
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setSubmitting(false);
    clearDraft();
    setDraftSaved(false);
  };

  const channel = Form.useWatch('channel', form);
  const message = Form.useWatch('message', form);
  const subject = Form.useWatch('subject', form);

  return (
    <Flexbox gap={24} style={{ maxWidth: 900, padding: 0 }}>
      <Flexbox gap={8}>
        <Title level={3} style={{ margin: 0 }}>
          Campañas CRM
        </Title>
        <Paragraph style={{ margin: 0 }} type="secondary">
          Envía campañas a los invitados de un evento. Selecciona plantilla, personaliza y programa.
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

      <div className="flex gap-6">
        {/* Left: Form */}
        <div className="flex-1">
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'form',
                  label: 'Campaña',
                  children: (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSubmit}
                      onValuesChange={handleValuesChange}
                    >
                      <Form.Item
                        label="Evento"
                        name="eventoId"
                        rules={[{ message: 'Selecciona un evento', required: true }]}
                      >
                        <EventSelector development={development} />
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
                          maxLength={channel === 'SMS' ? 480 : 1000}
                          placeholder="Escribe el mensaje de la campaña..."
                          rows={4}
                          showCount
                        />
                      </Form.Item>

                      <Form.Item label="Programar envío (opcional)" name="scheduledAt">
                        <DatePicker
                          format="DD/MM/YYYY HH:mm"
                          placeholder="Selecciona fecha y hora"
                          showTime
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item>
                        <div className="flex items-center gap-3">
                          <Button
                            disabled={submitting}
                            htmlType="submit"
                            loading={submitting}
                            type="primary"
                          >
                            {submitting ? 'Preparando...' : 'Preparar campaña'}
                          </Button>
                          <Tag color="orange">Cola pendiente de api-ia</Tag>
                          {draftSaved && (
                            <span className="text-xs text-gray-400">Borrador guardado</span>
                          )}
                        </div>
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'templates',
                  label: 'Plantillas',
                  children: (
                    <div className="space-y-3">
                      {TEMPLATES.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => applyTemplate(t)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{t.name}</span>
                            <Tag color={t.channel === 'EMAIL' ? 'blue' : t.channel === 'WHATSAPP' ? 'green' : 'orange'}>
                              {t.channel}
                            </Tag>
                          </div>
                          {t.subject && (
                            <div className="text-xs text-gray-500 mb-1">Asunto: {t.subject}</div>
                          )}
                          <p className="text-sm text-gray-600 line-clamp-2">{t.message}</p>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="w-[320px] flex-shrink-0">
          <Card title="Vista previa" size="small">
            <MessagePreview channel={channel} message={message} subject={subject} />
          </Card>
        </div>
      </div>
    </Flexbox>
  );
});

CampaignsPage.displayName = 'CampaignsPage';
export default CampaignsPage;
