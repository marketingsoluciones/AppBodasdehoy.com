/**
 * GuestUpsellPage — Pantalla interstitial para rutas protegidas cuando el usuario es guest.
 * Muestra el beneficio de la sección bloqueada + CTA para registrarse.
 * Se usa en lugar de redirigir silenciosamente a login.
 */
import { FC } from 'react';
import Link from 'next/link';
import { AuthContextProvider } from '../../context';

interface GuestUpsellPageProps {
  /** Nombre de la sección bloqueada, ej. "Presupuesto" */
  section: string;
  /** Descripción breve de lo que la sección ofrece */
  description: string;
  /** Emoji decorativo */
  icon?: string;
  /** Bullets de beneficios */
  benefits?: string[];
}

const GuestUpsellPage: FC<GuestUpsellPageProps> = ({ section, description, icon = '✨', benefits = [] }) => {
  const { config } = AuthContextProvider();
  const pathLogin = config?.pathLogin || "/login";
  const registerHref = pathLogin.includes("?") ? `${pathLogin}&q=register` : `${pathLogin}?q=register`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center bg-base">
      <div className="max-w-md w-full flex flex-col items-center gap-5">
        <div className="text-5xl">{icon}</div>
        <h1 className="font-display text-2xl font-semibold text-gray-800">
          {section}
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          {description}
        </p>

        {benefits.length > 0 && (
          <ul className="text-left w-full flex flex-col gap-2 bg-pink-50 rounded-xl p-4">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-pink-500 mt-0.5">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3 w-full mt-2">
          <Link
            href={registerHref}
            className="w-full py-3 rounded-full bg-primary text-white font-medium text-sm hover:opacity-80 transition text-center"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href={pathLogin}
            className="text-sm text-gray-600 hover:text-primary transition"
          >
            Ya tengo cuenta — Iniciar sesión
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuestUpsellPage;
