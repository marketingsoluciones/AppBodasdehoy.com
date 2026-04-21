/**
 * GuestTrialBanner — Banner superior para módulos en modo prueba.
 * NO bloquea el módulo, solo avisa que los datos se perderán sin registro.
 */
import { FC } from 'react';
import Link from 'next/link';
import { AuthContextProvider } from '../../context';
import { useTranslation } from 'react-i18next';

const GuestTrialBanner: FC = () => {
  const { config } = AuthContextProvider();
  const { t } = useTranslation();
  const pathLogin = config?.pathLogin || '/login';
  const registerHref = pathLogin.includes('?') ? `${pathLogin}&q=register` : `${pathLogin}?q=register`;

  return (
    <div className="w-full bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-200 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-xs text-gray-700">
        <span className="font-semibold">{t('guest.trial.label', { defaultValue: 'Modo prueba' })}</span>
        {' — '}
        {t('guest.trial.message', { defaultValue: 'Regístrate gratis para guardar tus datos permanentemente.' })}
      </p>
      <Link
        href={registerHref}
        className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-medium hover:opacity-80 transition whitespace-nowrap"
      >
        {t('guest.trial.cta', { defaultValue: 'Crear cuenta gratis' })}
      </Link>
    </div>
  );
};

export default GuestTrialBanner;
