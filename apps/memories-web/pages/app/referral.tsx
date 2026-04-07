/**
 * /app/referral — Programa de referidos de Memories.
 * Modelo: 5 referidos convertidos = 1 evento Boda gratis.
 */
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useReferral, REFERRALS_PER_REWARD } from '../../hooks/useReferral';
import { useAuth } from '../../hooks/useAuth';

function StatCard({ value, label, icon }: { value: number | string; label: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-2 min-w-[120px]">
      <span className="text-3xl">{icon}</span>
      <span className="text-3xl font-extrabold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 text-center leading-snug">{label}</span>
    </div>
  );
}

function ProgressBar({ converted }: { converted: number }) {
  const progress = converted % REFERRALS_PER_REWARD;
  const pct = (progress / REFERRALS_PER_REWARD) * 100;
  const remaining = REFERRALS_PER_REWARD - progress;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-700">Progreso hacia el próximo evento gratis</span>
        <span className="text-sm font-bold text-rose-500">{progress}/{REFERRALS_PER_REWARD}</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-3 rounded-full bg-rose-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {progress === 0
            ? 'Consigue tus primeros referidos'
            : `${progress} ${progress === 1 ? 'referido' : 'referidos'} activados`}
        </span>
        {remaining < REFERRALS_PER_REWARD && (
          <span className="text-xs font-semibold text-rose-500">
            {remaining} más para un evento gratis 🎁
          </span>
        )}
      </div>
    </div>
  );
}

export default function ReferralPage() {
  const { userId, hydrated } = useAuth();
  const { code, referralLink, stats, loading, apiSupported } = useReferral();
  const [copied, setCopied] = useState(false);

  if (!hydrated || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Cargando…</div>
      </div>
    );
  }

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareWhatsApp = () => {
    if (!referralLink) return;
    const text = encodeURIComponent(
      `¡Guarda los recuerdos de tu boda con Memories! 📸 Regístrate gratis aquí: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    if (!referralLink) return;
    const subject = encodeURIComponent('Te invito a usar Memories para tu boda');
    const body = encodeURIComponent(
      `Hola,\n\nTe recomiendo Memories, la app para álbumes colaborativos de bodas. ¡Perfecta para guardar todos los recuerdos de tu día especial!\n\nRegístrate gratis con mi enlace: ${referralLink}\n\n¡Espero que lo disfrutes!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Head>
        <title>Programa de referidos — Memories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
            <Link href="/app" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm">
              ← Mis álbumes
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              <span className="text-lg font-bold text-rose-500">Memories</span>
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🎁</div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
              Invita 5 parejas, gana 1 evento gratis
            </h1>
            <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
              Por cada 5 amigos que activen un plan de pago con tu enlace,{' '}
              <strong className="text-rose-500">consigues 1 evento Boda completamente gratis</strong>.
              ¡Sin límite de veces!
            </p>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">
              Cómo funciona
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { step: '1', icon: '🔗', title: 'Comparte tu enlace', desc: 'Envíalo por WhatsApp, email o redes.' },
                { step: '2', icon: '📝', title: 'Tus amigos se registran', desc: 'Crean su cuenta con tu código.' },
                { step: '3', icon: '🎉', title: 'Acumulas referidos', desc: 'Con 5 activaciones, recibes 1 evento Boda gratis.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="flex-1 flex flex-col items-center text-center gap-2 p-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 font-bold text-lg">
                    {step}
                  </div>
                  <span className="text-2xl">{icon}</span>
                  <span className="font-semibold text-gray-900 text-sm">{title}</span>
                  <span className="text-xs text-gray-500 leading-relaxed">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Referral link box */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8 animate-pulse h-40" />
          ) : !apiSupported ? (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 mb-8 text-center">
              <div className="text-3xl mb-3">🚧</div>
              <p className="text-rose-700 font-semibold mb-1">Próximamente disponible</p>
              <p className="text-rose-500 text-sm">
                El programa de referidos está en proceso de activación.
                Recibirás una notificación cuando esté listo.
              </p>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <ProgressBar converted={stats.converted} />

              {/* Share box */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Tu enlace personal
                </h2>
                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 mb-4">
                  <span className="flex-1 text-sm text-gray-700 font-mono truncate">
                    {referralLink}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-rose-500 text-white hover:bg-rose-600'
                    }`}
                  >
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white rounded-2xl py-3 text-sm font-semibold hover:bg-green-600 transition"
                  >
                    <span>📱</span> WhatsApp
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white rounded-2xl py-3 text-sm font-semibold hover:bg-gray-900 transition"
                  >
                    <span>✉️</span> Email
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Tus estadísticas
                </h2>
                <div className="flex gap-4 justify-center flex-wrap">
                  <StatCard value={stats.invited} label="Registros" icon="👥" />
                  <StatCard value={stats.converted} label="Activaciones" icon="💳" />
                  <StatCard
                    value={stats.freeEvents > 0 ? `+${stats.freeEvents}` : '0'}
                    label="Eventos gratis"
                    icon="🎁"
                  />
                </div>

                {stats.freeEvents > 0 && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                    <p className="text-green-700 font-semibold text-sm">
                      🎉 ¡Has ganado {stats.freeEvents} evento{stats.freeEvents !== 1 ? 's' : ''} Boda gratis!
                      El equipo de Memories te contactará para activarlo.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Terms */}
          <p className="text-center text-xs text-gray-400 mt-10 leading-relaxed">
            Un referido válido requiere que el amigo active el plan Boda o Boda Plus.
            Cada 5 activaciones recibes 1 evento Boda (valorado en €19) gratis.
            Sin límite de eventos acumulables. No transferible.
          </p>
        </main>
      </div>
    </>
  );
}
