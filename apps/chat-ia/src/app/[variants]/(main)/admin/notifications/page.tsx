'use client';

import { useCallback, useEffect, useState } from 'react';

import { api2Client } from '@/services/api2/client';

const GET_WHITELABEL_NOTIFICATIONS = `
  query GetWhitelabelNotifications {
    getWhitelabels {
      success
      whitelabels {
        development
        notifications {
          schedule {
            digest_hour
            digest_frequency
            task_reminder_hour
            task_reminder_enabled
          }
        }
      }
    }
  }
`;

const UPDATE_NOTIFICATION_SCHEDULE = `
  mutation UpdateNotificationSchedule($development: String!, $input: WhitelabelUpdateInput!) {
    updateWhitelabel(development: $development, input: $input) {
      success
      whitelabel {
        development
        notifications {
          schedule {
            digest_hour
            digest_frequency
            task_reminder_hour
            task_reminder_enabled
          }
        }
      }
      errors { message }
    }
  }
`;

interface NotificationSchedule {
  digest_hour: number;
  digest_frequency: 'daily' | 'never';
  task_reminder_hour: number;
  task_reminder_enabled: boolean;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00`,
}));

export default function NotificationSettingsPage() {
  const [schedule, setSchedule] = useState<NotificationSchedule>({
    digest_hour: 10,
    digest_frequency: 'daily',
    task_reminder_hour: 9,
    task_reminder_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [development, setDevelopment] = useState<string>('');

  useEffect(() => {
    api2Client
      .query<{ getWhitelabels: any }>(GET_WHITELABEL_NOTIFICATIONS)
      .then((data) => {
        const wl = data.getWhitelabels?.whitelabels?.[0];
        if (wl?.development) setDevelopment(wl.development);
        const s = wl?.notifications?.schedule;
        if (s) {
          setSchedule({
            digest_hour: s.digest_hour ?? 10,
            digest_frequency: s.digest_frequency ?? 'daily',
            task_reminder_hour: s.task_reminder_hour ?? 9,
            task_reminder_enabled: s.task_reminder_enabled ?? true,
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = await api2Client.query<{ updateWhitelabel: any }>(UPDATE_NOTIFICATION_SCHEDULE, {
        development,
        input: {
          notifications: {
            schedule: {
              digest_hour: schedule.digest_hour,
              digest_frequency: schedule.digest_frequency,
              task_reminder_hour: schedule.task_reminder_hour,
              task_reminder_enabled: schedule.task_reminder_enabled,
            },
          },
        },
      });
      if (data.updateWhitelabel?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const msgs = data.updateWhitelabel?.errors?.map((e: any) => e.message).join(', ');
        setError(msgs || 'Error al guardar');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [schedule]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔔 Configuración de notificaciones</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura cuándo y con qué frecuencia se envían los emails automáticos a los usuarios de tu whitelabel.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
          ✅ Configuración guardada correctamente
        </div>
      )}

      {/* Digest section */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-1">📧 Resumen de notificaciones sin leer</h2>
        <p className="text-sm text-gray-500 mb-5">
          Envía un email a cada usuario con sus notificaciones sin leer, a la hora que configure.
          Se envía una vez al día si hay notificaciones pendientes de hace más de 1 hora.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de envío (por defecto)
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              value={schedule.digest_hour}
              onChange={(e) => setSchedule((s) => ({ ...s, digest_hour: Number(e.target.value) }))}
            >
              {HOUR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Hora Madrid. Cada usuario puede cambiarla individualmente.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              value={schedule.digest_frequency}
              onChange={(e) =>
                setSchedule((s) => ({ ...s, digest_frequency: e.target.value as 'daily' | 'never' }))
              }
            >
              <option value="daily">Diario</option>
              <option value="never">Desactivado</option>
            </select>
          </div>
        </div>
      </section>

      {/* Task reminder section */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-1">📋 Recordatorio de tareas pendientes</h2>
        <p className="text-sm text-gray-500 mb-5">
          Envía un email diario a los organizadores que tienen servicios con tareas sin completar.
          Solo se envía si hubo actividad reciente en el servicio.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora de envío</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              value={schedule.task_reminder_hour}
              disabled={!schedule.task_reminder_enabled}
              onChange={(e) =>
                setSchedule((s) => ({ ...s, task_reminder_hour: Number(e.target.value) }))
              }
            >
              {HOUR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Hora Madrid.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <button
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                schedule.task_reminder_enabled
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
              onClick={() =>
                setSchedule((s) => ({ ...s, task_reminder_enabled: !s.task_reminder_enabled }))
              }
              type="button"
            >
              <span
                className={`inline-block h-4 w-4 rounded-full ${
                  schedule.task_reminder_enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              {schedule.task_reminder_enabled ? 'Activado' : 'Desactivado'}
            </button>
          </div>
        </div>
      </section>

      {/* Info section */}
      <section className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">📊 Informe semanal de admins</h3>
        <p className="text-sm text-gray-500">
          Todos los lunes a las 08:00 AM los admins reciben un informe con los usuarios que tienen
          notificaciones sin leer de más de 7 días. No configurable.
        </p>
      </section>

      <button
        className="rounded-lg bg-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 disabled:opacity-50 transition-colors"
        disabled={saving}
        onClick={handleSave}
        type="button"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}
