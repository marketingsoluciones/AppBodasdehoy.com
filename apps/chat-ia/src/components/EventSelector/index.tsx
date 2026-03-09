'use client';

import { Select, Spin } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import {
  type Evento,
  formatEventoLabel,
  getEventosByUsuario,
} from '@/services/api2/eventos';

interface EventSelectorProps {
  development: string;
  disabled?: boolean;
  onChange?: (eventoId: string, evento: Evento) => void;
  placeholder?: string;
  value?: string;
}

/**
 * Selector de eventos de un usuario vía API2 (getEventosByUsuario).
 * Reemplaza el uso de queryenEvento según indicación de API2.
 *
 * Referencia: docs/AVANCES-API-IA-RESPUESTAS-SLACK.md
 */
const EventSelector = ({
  development,
  disabled = false,
  onChange,
  placeholder = 'Selecciona un evento',
  value,
}: EventSelectorProps) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEventosByUsuario(development);
      setEventos(result);
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  }, [development]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const handleChange = (eventoId: string) => {
    const evento = eventos.find((e) => e._id === eventoId);
    if (evento && onChange) onChange(eventoId, evento);
  };

  return (
    <Select
      disabled={disabled || loading}
      notFoundContent={
        loading ? (
          <Spin size="small" />
        ) : error ? (
          <span style={{ color: 'red' }}>{error}</span>
        ) : (
          'Sin eventos'
        )
      }
      onChange={handleChange}
      options={eventos.map((e) => ({
        label: formatEventoLabel(e),
        value: e._id,
      }))}
      placeholder={placeholder}
      showSearch
      style={{ width: '100%' }}
      value={value}
    />
  );
};

export default EventSelector;
