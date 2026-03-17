/**
 * /app/profile — Editor de perfil profesional
 * Permite al usuario configurar su portfolio público en /pro/[slug]
 */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import type { ProfessionalProfile, ProfessionalSpecialty } from '@bodasdehoy/memories';
import { authBridge } from '@bodasdehoy/shared';

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
const USER_ID_KEY = 'memories_user_id';

const SPECIALTIES: { value: ProfessionalSpecialty; label: string; emoji: string }[] = [
  { value: 'photographer', label: 'Fotógrafo/a', emoji: '📷' },
  { value: 'videographer', label: 'Videógrafo/a', emoji: '🎬' },
  { value: 'dj', label: 'DJ', emoji: '🎧' },
  { value: 'florist', label: 'Florista', emoji: '💐' },
  { value: 'catering', label: 'Catering', emoji: '🍽️' },
  { value: 'venue', label: 'Sala / Venue', emoji: '🏛️' },
  { value: 'makeup', label: 'Maquillaje', emoji: '💄' },
  { value: 'hairstylist', label: 'Peluquería', emoji: '✂️' },
  { value: 'wedding_planner', label: 'Wedding Planner', emoji: '📋' },
  { value: 'musician', label: 'Músico/a', emoji: '🎵' },
  { value: 'officiant', label: 'Officiante', emoji: '⛪' },
  { value: 'other', label: 'Otro', emoji: '🌟' },
];

// ─── Avatar upload ─────────────────────────────────────────────────────────────

function AvatarUpload({
  currentUrl,
  onUploaded,
}: {
  currentUrl?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(
        `${API_BASE}/api/memories/professionals/avatar?development=${DEVELOPMENT}`,
        { method: 'POST', body: formData },
      );
      const data = await res.json();
      if (data?.success && data.url) onUploaded(data.url);
    } catch {
      /* ignore — just won't update the preview */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center overflow-hidden cursor-pointer relative group"
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl text-white">👤</span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-xs font-medium">Cambiar</span>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          Subir foto de perfil
        </button>
        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG — máx. 2 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

// ─── Album selector ────────────────────────────────────────────────────────────

function PortfolioAlbumSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { albums } = useMemoriesStore();

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  if (albums.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No tienes álbumes todavía.{' '}
        <Link href="/app" className="text-pink-600 hover:underline">
          Crea uno
        </Link>{' '}
        para añadirlo al portfolio.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
      {albums.map((album) => {
        const isSelected = selected.includes(album._id);
        return (
          <button
            key={album._id}
            type="button"
            onClick={() => toggle(album._id)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              {album.coverImageUrl ? (
                <img src={album.coverImageUrl} alt={album.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                  📸
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{album.name}</p>
              <p className="text-xs text-gray-400">{album.mediaCount} fotos</p>
            </div>
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main profile form ─────────────────────────────────────────────────────────

function ProfileForm({ userId }: { userId: string }) {
  const { albums, fetchAlbums, professionalProfile, professionalProfileLoading, fetchProfessionalProfile, upsertProfessionalProfile } =
    useMemoriesStore();

  const [form, setForm] = useState<Partial<ProfessionalProfile>>({
    name: '',
    slug: '',
    specialty: 'photographer',
    bio: '',
    location: '',
    website: '',
    instagram: '',
    whatsapp: '',
    email: '',
    watermarkText: '',
    printPermission: 'owner_only',
    isPublic: false,
    portfolioAlbumIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTaken, setSlugTaken] = useState(false);

  useEffect(() => {
    fetchAlbums();
    fetchProfessionalProfile();
  }, []);

  useEffect(() => {
    if (professionalProfile) {
      setForm({ ...professionalProfile });
    }
  }, [professionalProfile]);

  const set = (field: keyof ProfessionalProfile, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug && f._id ? f.slug : generateSlug(name),
      watermarkText: f.watermarkText || name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.slug?.trim()) {
      setError('Nombre y URL son obligatorios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertProfessionalProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/pro/${form.slug}`;

  if (professionalProfileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Foto de perfil</h2>
        <AvatarUpload
          currentUrl={form.avatarUrl}
          onUploaded={(url) => set('avatarUrl', url)}
        />
      </section>

      {/* Basic info */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Información básica</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o empresa *</label>
          <input
            type="text"
            value={form.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ej. María García Fotografía"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SPECIALTIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('specialty', s.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                  form.specialty === s.value
                    ? 'border-pink-500 bg-pink-50 text-pink-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span>{s.emoji}</span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Descripción</label>
          <textarea
            value={form.bio || ''}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            placeholder="Cuéntanos tu historia, estilo o especialización..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input
              type="text"
              value={form.location || ''}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Ej. Madrid, España"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => set('email', e.target.value)}
              placeholder="contacto@tuempresa.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Web</label>
            <input
              type="url"
              value={form.website || ''}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://tuwebsite.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <input
              type="text"
              value={form.instagram || ''}
              onChange={(e) => set('instagram', e.target.value)}
              placeholder="@tuusuario"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              type="tel"
              value={form.whatsapp || ''}
              onChange={(e) => set('whatsapp', e.target.value)}
              placeholder="+34 600 000 000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        </div>
      </section>

      {/* Public URL */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">URL pública de tu portfolio</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enlace único *</label>
          <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-pink-400">
            <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap">
              memories.bodasdehoy.com/pro/
            </span>
            <input
              type="text"
              value={form.slug || ''}
              onChange={(e) => {
                const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                set('slug', clean);
                setSlugTaken(false);
              }}
              placeholder="tu-nombre"
              required
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
          {slugTaken && (
            <p className="text-xs text-red-500 mt-1">Esta URL ya está en uso. Elige otra.</p>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">Perfil público</p>
            <p className="text-xs text-gray-400">Activa para que los clientes puedan verte</p>
          </div>
          <button
            type="button"
            onClick={() => set('isPublic', !form.isPublic)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublic ? 'bg-pink-500' : 'bg-gray-200'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublic ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {form.slug && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver cómo lo verán tus clientes
          </a>
        )}
      </section>

      {/* Portfolio albums */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Portfolio público</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Selecciona los álbumes que mostrarás a tus clientes. Las fotos se mostrarán con protección.
          </p>
        </div>
        <PortfolioAlbumSelector
          selected={form.portfolioAlbumIds || []}
          onChange={(ids) => set('portfolioAlbumIds', ids)}
        />
      </section>

      {/* Photo protection */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Protección de fotos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configura la marca de agua y quién puede imprimir las fotos.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texto de la marca de agua</label>
          <input
            type="text"
            value={form.watermarkText || ''}
            onChange={(e) => set('watermarkText', e.target.value)}
            placeholder={form.name || 'Tu nombre o empresa'}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Aparece sobre las fotos cuando las ven los clientes. Si está vacío, se usa tu nombre.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">¿Quién puede imprimir sin marca de agua?</label>
          <div className="space-y-2">
            {[
              {
                value: 'owner_only',
                label: 'Solo yo (el profesional)',
                desc: 'Los clientes ven la marca de agua siempre, incluso al imprimir',
                icon: '🔒',
              },
              {
                value: 'members',
                label: 'Miembros del álbum',
                desc: 'Los miembros invitados también pueden imprimir sin marca de agua',
                icon: '👥',
              },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('printPermission', opt.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  form.printPermission === opt.value
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl mt-0.5">{opt.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
                {form.printPermission === opt.value && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error / Save */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pb-8">
        <Link href="/app" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver al dashboard
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando…
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Guardado
            </>
          ) : (
            'Guardar perfil'
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Page wrapper ──────────────────────────────────────────────────────────────

function ProfilePage({ userId }: { userId: string }) {
  return (
    <MemoriesProvider apiBaseUrl={API_BASE} userId={userId} development={DEVELOPMENT}>
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Mi Perfil Profesional — Memories</title>
        </Head>

        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/app" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-base font-semibold text-gray-800">Mi Perfil Profesional</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              Crea tu portfolio público para que los clientes vean tu trabajo con fotos protegidas.
            </p>
          </div>
          <ProfileForm userId={userId} />
        </main>
      </div>
    </MemoriesProvider>
  );
}

// ─── Auth wrapper (same pattern as other pages) ────────────────────────────────

export default function ProfilePageRoot() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const resolve = async () => {
      // 1. SSO cookie via AuthBridge
      try {
        const state = authBridge.getSharedAuthState();
        if (state?.user?.uid) {
          setUserId(state.user.uid);
          setChecking(false);
          return;
        }
      } catch {}
      // 2. localStorage
      const stored = localStorage.getItem(USER_ID_KEY);
      if (stored) {
        setUserId(stored);
        setChecking(false);
        return;
      }
      // 3. query param
      const qp = router.query.userId as string | undefined;
      if (qp) {
        setUserId(qp);
        localStorage.setItem(USER_ID_KEY, qp);
        setChecking(false);
        return;
      }
      router.replace('/app');
    };
    resolve();
  }, [router.query.userId]);

  if (checking || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <ProfilePage userId={userId} />;
}
