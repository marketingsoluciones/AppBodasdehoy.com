/**
 * WeddingDetailsModal — Recoge datos del novio antes del pago.
 * Campos requeridos: email, nombre, fecha de boda, ubicación, teléfono.
 */
import { useState } from 'react';

export interface WeddingDetails {
  email: string;
  nombre: string;
  fechaBoda: string;
  ubicacion: string;
  telefono: string;
}

interface Props {
  planName: string;
  planPrice: number;
  onConfirm: (details: WeddingDetails) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function WeddingDetailsModal({ planName, planPrice, onConfirm, onClose, loading }: Props) {
  const [form, setForm] = useState<WeddingDetails>({
    email: '',
    nombre: '',
    fechaBoda: '',
    ubicacion: '',
    telefono: '',
  });
  const [errors, setErrors] = useState<Partial<WeddingDetails>>({});

  const set = (key: keyof WeddingDetails, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<WeddingDetails> = {};
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email válido requerido';
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    if (!form.fechaBoda) errs.fechaBoda = 'Requerido';
    if (!form.ubicacion.trim()) errs.ubicacion = 'Requerido';
    if (!form.telefono.trim()) errs.telefono = 'Requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onConfirm(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">💍</div>
          <h2 className="text-xl font-extrabold text-gray-900">Cuéntanos sobre tu boda</h2>
          <p className="text-gray-500 text-sm mt-1">
            Un paso rápido antes de activar el plan <strong>{planName}</strong> (€{planPrice})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="novios@ejemplo.com"
              className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 ${
                errors.email ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre de los novios *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ana y Carlos"
              className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 ${
                errors.nombre ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          {/* Fecha de boda */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de la boda *</label>
            <input
              type="date"
              value={form.fechaBoda}
              onChange={(e) => set('fechaBoda', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 ${
                errors.fechaBoda ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.fechaBoda && <p className="text-xs text-red-500 mt-1">{errors.fechaBoda}</p>}
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ubicación de la boda *</label>
            <input
              type="text"
              value={form.ubicacion}
              onChange={(e) => set('ubicacion', e.target.value)}
              placeholder="Madrid, España"
              className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 ${
                errors.ubicacion ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.ubicacion && <p className="text-xs text-red-500 mt-1">{errors.ubicacion}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono de contacto *</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              placeholder="+34 600 000 000"
              className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 ${
                errors.telefono ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-500 text-white py-3 rounded-2xl font-bold text-sm hover:bg-rose-600 transition disabled:opacity-50"
            >
              {loading ? 'Procesando…' : 'Ir al pago →'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Tus datos se usan únicamente para gestionar tu evento y enviarte el acceso.
        </p>
      </div>
    </div>
  );
}
