/**
 * Administración de miembros y permisos del álbum — /app/album/[id]/settings
 * Solo accesible para el owner del álbum.
 * Permite: gestionar roles, eliminar miembros, invitar, configurar watermark.
 */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { MemoriesProvider, useMemoriesStore } from '@bodasdehoy/memories';
import type { AlbumMember } from '@bodasdehoy/memories';
import { authBridge } from '@bodasdehoy/shared';

const API_BASE = process.env.NEXT_PUBLIC_MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
const USER_ID_KEY = 'memories_user_id';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Solo ver',
};

const ROLE_DESC: Record<string, string> = {
  owner: 'Control total',
  admin: 'Puede gestionar miembros y fotos',
  editor: 'Puede subir fotos',
  viewer: 'Solo puede ver las fotos',
};

// ─── Settings content ──────────────────────────────────────────────────────────

function AlbumSettingsContent({ albumId, userId }: { albumId: string; userId: string }) {
  const {
    currentAlbum,
    currentAlbumLoading,
    currentAlbumError,
    currentAlbumMembers,
    membersLoading,
    fetchAlbum,
    fetchAlbumMembers,
    updateAlbum,
    updateMemberRole,
    removeMember,
    inviteMember,
  } = useMemoriesStore();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const isOwner = !!currentAlbum && currentAlbum.ownerId === userId;
  const watermarkEnabled = currentAlbum?.settings?.allow_watermark ?? false;

  useEffect(() => {
    fetchAlbum(albumId);
    fetchAlbumMembers(albumId);
  }, [albumId, fetchAlbum, fetchAlbumMembers]);

  if (currentAlbumLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">Cargando…</div>;
  }

  if (currentAlbumError || !currentAlbum) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{currentAlbumError || 'Álbum no encontrado'}</p>
        <Link href="/app" className="text-rose-500 text-sm mt-4 inline-block hover:underline">← Volver</Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Solo el propietario puede gestionar la configuración del álbum.</p>
        <Link href={`/app/album/${albumId}`} className="text-rose-500 text-sm mt-4 inline-block hover:underline">← Volver al álbum</Link>
      </div>
    );
  }

  const handleToggleWatermark = async () => {
    setSavingSettings(true);
    await updateAlbum(albumId, {
      settings: { ...currentAlbum.settings, allow_watermark: !watermarkEnabled },
    });
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleRoleChange = async (member: AlbumMember, newRole: string) => {
    if (member.role === 'owner') return;
    setChangingRoleId(member.userId);
    await updateMemberRole(albumId, member.userId, newRole);
    setChangingRoleId(null);
  };

  const handleRemove = async (member: AlbumMember) => {
    if (member.role === 'owner') return;
    if (!confirm(`¿Eliminar a ${member.userEmail || member.userName || member.userId} del álbum?`)) return;
    setRemovingId(member.userId);
    await removeMember(albumId, member.userId);
    setRemovingId(null);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSending(true);
    setInviteResult(null);
    const token = await inviteMember(albumId, inviteEmail.trim(), inviteRole);
    setInviteSending(false);
    if (token) {
      setInviteResult({ ok: true, msg: `Invitación enviada a ${inviteEmail.trim()}` });
      setInviteEmail('');
    } else {
      setInviteResult({ ok: false, msg: 'No se pudo enviar. Comprueba el email.' });
    }
  };

  // Separate owner from other members
  const ownerMember = currentAlbumMembers.find((m) => m.role === 'owner');
  const otherMembers = currentAlbumMembers.filter((m) => m.role !== 'owner');

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href={`/app/album/${albumId}`} className="text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">{currentAlbum.name}</h1>
              <p className="text-xs text-gray-400">Miembros y permisos</p>
            </div>
          </div>
          {settingsSaved && (
            <span className="text-xs text-green-600 font-medium">✓ Guardado</span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Sección: Invitar ─────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Invitar persona</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@invitado.com"
              required
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
            >
              <option value="viewer">Solo ver</option>
              <option value="editor">Editor (subir fotos)</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="submit"
              disabled={!inviteEmail.trim() || inviteSending}
              className="bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition"
            >
              {inviteSending ? 'Enviando…' : 'Invitar'}
            </button>
          </form>
          {inviteResult && (
            <p className={`text-xs mt-2 font-medium ${inviteResult.ok ? 'text-green-600' : 'text-red-500'}`}>
              {inviteResult.ok ? '✓ ' : '✗ '}{inviteResult.msg}
            </p>
          )}
        </section>

        {/* ── Sección: Miembros ────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Miembros del álbum
            <span className="ml-2 text-gray-400 font-normal normal-case">({currentAlbumMembers.length})</span>
          </h2>

          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : currentAlbumMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Aún no hay miembros. Invita a alguien arriba.
            </p>
          ) : (
            <ul className="space-y-2">
              {/* Owner row */}
              {ownerMember && (
                <li className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-sm font-bold text-rose-500">
                      {(ownerMember.userName || ownerMember.userEmail || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                        {ownerMember.userEmail || ownerMember.userName || ownerMember.userId}
                        {ownerMember.userId === userId && <span className="ml-1 text-xs text-gray-400">(Tú)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{ROLE_DESC.owner}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                    Propietario
                  </span>
                </li>
              )}

              {/* Other members */}
              {otherMembers.map((member) => (
                <li key={member.userId} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-500">
                      {(member.userName || member.userEmail || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                        {member.userEmail || member.userName || member.userId}
                      </p>
                      <p className="text-xs text-gray-400">{ROLE_DESC[member.role] || member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      disabled={changingRoleId === member.userId}
                      onChange={(e) => handleRoleChange(member, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-300 disabled:opacity-50 transition"
                    >
                      <option value="viewer">Solo ver</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={removingId === member.userId}
                      className="text-gray-300 hover:text-red-500 transition disabled:opacity-50 p-1 rounded-lg hover:bg-red-50"
                      title="Eliminar del álbum"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Sección: Protección de fotos ─────────────────────────── */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">Protección de fotos</h2>
          <p className="text-xs text-gray-400 mb-5">
            Cuando está activa, los visitantes ven las fotos con marca de agua y no pueden imprimirlas.
            Tú, como propietario, las ves siempre sin marca de agua.
          </p>

          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${watermarkEnabled ? 'bg-violet-100' : 'bg-gray-100'}`}>
                <svg className={`w-5 h-5 ${watermarkEnabled ? 'text-violet-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Marca de agua</p>
                <p className="text-xs text-gray-400">
                  {watermarkEnabled ? 'Activada — invitados ven fotos protegidas' : 'Desactivada — fotos sin protección'}
                </p>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={handleToggleWatermark}
              disabled={savingSettings}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${watermarkEnabled ? 'bg-violet-500' : 'bg-gray-200'} disabled:opacity-50`}
              role="switch"
              aria-checked={watermarkEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${watermarkEnabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </section>

        {/* ── Sección: Roles explicados ─────────────────────────────── */}
        <section className="bg-gray-50 rounded-3xl p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Guía de roles</h2>
          <dl className="space-y-2">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <div key={role} className="flex gap-3">
                <dt className="w-28 text-xs font-semibold text-gray-600 shrink-0">{label}</dt>
                <dd className="text-xs text-gray-400">{ROLE_DESC[role]}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AlbumSettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const albumId = typeof router.query.id === 'string' ? router.query.id : null;

  useEffect(() => {
    const authState = authBridge.getSharedAuthState();
    if (authState.isAuthenticated && authState.user) {
      const bridgeId = authState.user.email || authState.user.uid;
      localStorage.setItem(USER_ID_KEY, bridgeId);
      setUserId(bridgeId);
      setHydrated(true);
      return;
    }
    const stored = localStorage.getItem(USER_ID_KEY);
    setUserId(stored);
    setHydrated(true);
  }, []);

  if (!hydrated || !albumId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse text-sm">Cargando…</div>
      </div>
    );
  }

  if (!userId) {
    if (typeof window !== 'undefined') router.push('/app');
    return null;
  }

  return (
    <>
      <Head>
        <title>Miembros y permisos — Memories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MemoriesProvider apiBaseUrl={API_BASE} userId={userId} development={DEVELOPMENT}>
        <div className="min-h-screen bg-gray-50">
          <AlbumSettingsContent albumId={albumId} userId={userId} />
        </div>
      </MemoriesProvider>
    </>
  );
}
