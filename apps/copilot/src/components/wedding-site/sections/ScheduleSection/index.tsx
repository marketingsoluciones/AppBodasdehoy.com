'use client';

/**
 * Schedule Section (Timeline)
 * ===========================
 * Cronograma del evento con timeline vertical
 */

import React, { useState } from 'react';
import type { ScheduleData, RenderMode, ScheduleEvent } from '../../types';
import { SectionTitle } from '../../shared/SectionTitle';
import { getEventIcon } from '../../utils/icons';
import { formatTime } from '../../utils/formatDate';
import { Button, Modal, Form, Input, Select, TimePicker, message } from 'antd';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

interface ScheduleSectionProps {
  data: ScheduleData;
  mode: RenderMode;
  onEventAdd?: (event: Omit<ScheduleEvent, 'id'>) => void;
  onEventDelete?: (eventId: string) => void;
  onEventUpdate?: (eventId: string, event: Partial<ScheduleEvent>) => void;
}

export function ScheduleSection({ 
  data, 
  mode,
  onEventAdd,
  onEventUpdate,
  onEventDelete
}: ScheduleSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [form] = Form.useForm();
  const isPreview = mode === 'preview';

  const handleAddEvent = () => {
    setEditingEvent(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
    form.setFieldsValue({
      description: event.description,
      endTime: event.endTime ? dayjs(event.endTime, 'HH:mm') : null,
      location: event.location,
      time: event.time ? dayjs(event.time, 'HH:mm') : null,
      title: event.title,
      type: event.type,
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    Modal.confirm({
      cancelText: 'Cancelar',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      onOk: () => {
        onEventDelete?.(eventId);
        message.success('Momento eliminado');
      },
      title: '¿Eliminar este momento?',
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const eventData = {
        description: values.description,
        endTime: values.endTime ? values.endTime.format('HH:mm') : undefined,
        location: values.location,
        time: values.time ? values.time.format('HH:mm') : '',
        title: values.title,
        type: values.type,
      };

      if (editingEvent) {
        onEventUpdate?.(editingEvent.id, eventData);
        message.success('Momento actualizado');
      } else {
        onEventAdd?.(eventData);
        message.success('Momento agregado');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error validating form:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingEvent(null);
  };

  return (
    <section className="schedule-section">
      <style jsx>{`
        .schedule-section {
          padding: 5rem 1.5rem;
          background-color: var(--wedding-background);
        }

        .schedule-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .timeline {
          position: relative;
          padding-left: 2rem;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: var(--wedding-primary);
          opacity: 0.3;
        }

        .timeline-event {
          position: relative;
          padding-bottom: 2.5rem;
        }

        .timeline-event:last-child {
          padding-bottom: 0;
        }

        .timeline-dot {
          position: absolute;
          left: -2rem;
          top: 0.25rem;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: var(--wedding-primary);
          border: 3px solid var(--wedding-background);
          box-shadow: 0 0 0 2px var(--wedding-primary);
        }

        .timeline-icon {
          position: absolute;
          left: -3rem;
          top: -0.25rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--wedding-primary);
          border-radius: 50%;
          color: var(--wedding-text-on-primary);
        }

        .event-time {
          font-family: var(--wedding-font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--wedding-primary);
          margin-bottom: 0.25rem;
        }

        .event-title {
          font-family: var(--wedding-font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--wedding-text);
          margin: 0 0 0.5rem 0;
        }

        .event-location {
          font-family: var(--wedding-font-body);
          font-size: 0.875rem;
          color: var(--wedding-text-light);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .event-description {
          font-family: var(--wedding-font-body);
          font-size: 1rem;
          color: var(--wedding-text);
          line-height: 1.6;
        }

        .timeline-event--editable {
          position: relative;
        }

        .event-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .timeline-event--editable:hover .event-actions {
          opacity: 1;
        }

        @media (max-width: 640px) {
          .timeline {
            padding-left: 2.5rem;
          }

          .timeline-icon {
            left: -2.5rem;
            width: 28px;
            height: 28px;
          }

          .event-title {
            font-size: 1.25rem;
          }
        }
      `}</style>

      <div className="schedule-container">
        <SectionTitle subtitle={data.subtitle} title={data.title} />

        <div className="timeline">
          {data.events.map((event) => {
            const Icon = getEventIcon(event.type);

            return (
              <div 
                className={`timeline-event ${isPreview ? 'timeline-event--editable' : ''}`} 
                key={event.id}
                onClick={(e) => {
                  // Prevenir que el click se propague al SectionWrapper
                  e.stopPropagation();
                  // En modo preview, no hacer nada más (solo editar/eliminar con botones)
                  // En modo production, tampoco navegar a ningún lado
                }}
              >
                <div className="timeline-icon">
                  <Icon size={16} />
                </div>

                <div className="event-time">
                  {formatTime(event.time)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </div>

                <h3 className="event-title">{event.title}</h3>

                {event.location && (
                  <div className="event-location">
                    <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {event.location}
                  </div>
                )}

                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}

                {isPreview && (onEventUpdate || onEventDelete) && (
                  <div className="event-actions">
                    {onEventUpdate && (
                      <Button
                        icon={<Edit2 size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                        size="small"
                        type="text"
                      >
                        Editar
                      </Button>
                    )}
                    {onEventDelete && (
                      <Button
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        size="small"
                        type="text"
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isPreview && onEventAdd && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Button
              icon={<Plus size={16} />}
              onClick={handleAddEvent}
              type="dashed"
            >
              Agregar Momento
            </Button>
          </div>
        )}

        {/* Modal para crear/editar evento */}
        <Modal
          cancelText="Cancelar"
          okText={editingEvent ? 'Guardar' : 'Agregar'}
          onCancel={handleModalCancel}
          onOk={handleModalOk}
          open={isModalOpen}
          title={editingEvent ? 'Editar Momento' : 'Agregar Momento'}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Título"
              name="title"
              rules={[{ message: 'Por favor ingresa un título', required: true }]}
            >
              <Input placeholder="Ej: Ceremonia Religiosa" />
            </Form.Item>

            <Form.Item
              label="Tipo"
              name="type"
              rules={[{ message: 'Por favor selecciona un tipo', required: true }]}
            >
              <Select placeholder="Selecciona el tipo">
                <Select.Option value="ceremony">Ceremonia</Select.Option>
                <Select.Option value="cocktail">Cóctel</Select.Option>
                <Select.Option value="dinner">Cena</Select.Option>
                <Select.Option value="party">Fiesta</Select.Option>
                <Select.Option value="photos">Fotos</Select.Option>
                <Select.Option value="other">Otro</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Hora de inicio"
              name="time"
              rules={[{ message: 'Por favor ingresa la hora de inicio', required: true }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Hora de fin (opcional)"
              name="endTime"
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Ubicación (opcional)"
              name="location"
            >
              <Input placeholder="Ej: Iglesia San José" />
            </Form.Item>

            <Form.Item
              label="Descripción (opcional)"
              name="description"
            >
              <Input.TextArea 
                placeholder="Descripción del momento..." 
                rows={3}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </section>
  );
}

export default ScheduleSection;
