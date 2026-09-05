'use client';

/**
 * A4 (23-jul) — Cuentas vinculadas del usuario Bodas (Firebase via api-mcp).
 *
 * Sustituye a la antigua SSOProvidersList de NextAuth (borrada en C8, commit
 * 61b44df0): misma ubicación en Perfil, pero la fuente ahora es api-mcp GraphQL
 * (getUserSSOProviders / unlinkSSOProvider), que lee los providerData del
 * usuario Firebase del tenant. Identidad = JWT Bodas (Authorization del
 * apolloClient → proxy /api/graphql → api-mcp context.user).
 */
import { gql } from '@apollo/client';
import { ActionIcon, List } from '@lobehub/ui';
import { Skeleton } from 'antd';
import { Unlink } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { modal, notification } from '@/components/AntdStaticMethods';
import AuthIcons from '@/components/NextAuth/AuthIcons';
import { apolloClient } from '@/libs/graphql/client';

const { Item } = List;

interface SSOProvider {
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  providerId: string;
  uid?: string | null;
}

const GET_USER_SSO_PROVIDERS = gql`
  query GetUserSSOProviders {
    getUserSSOProviders {
      providerId
      uid
      email
      displayName
      photoURL
      phoneNumber
    }
  }
`;

const UNLINK_SSO_PROVIDER = gql`
  mutation UnlinkSSOProvider($providerId: String!) {
    unlinkSSOProvider(providerId: $providerId) {
      providerId
      uid
      email
      displayName
      photoURL
      phoneNumber
    }
  }
`;

// providerId de Firebase → clave de icono de AuthIcons + etiqueta legible.
const PROVIDER_META: Record<string, { icon: string; label: string }> = {
  'facebook.com': { icon: 'default', label: 'Facebook' },
  'google.com': { icon: 'google', label: 'Google' },
  'password': { icon: 'default', label: 'Email y contraseña' },
  'phone': { icon: 'default', label: 'Teléfono' },
};

const providerMeta = (providerId: string) =>
  PROVIDER_META[providerId] ?? { icon: 'default', label: providerId };

export const SSOProvidersList = memo(() => {
  const { t } = useTranslation('auth');
  const [providers, setProviders] = useState<SSOProvider[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, errors } = await apolloClient.query<{ getUserSSOProviders: SSOProvider[] }>({
        fetchPolicy: 'network-only',
        query: GET_USER_SSO_PROVIDERS,
      });
      if (errors?.length) throw new Error(errors[0].message);
      setProviders(data?.getUserSSOProviders ?? []);
      setLoadError(null);
    } catch (error: any) {
      // Sin sesión Bodas (UNAUTHENTICATED) u otro fallo: no romper el Perfil.
      setProviders([]);
      setLoadError(error?.message || 'error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allowUnlink = (providers?.length ?? 0) > 1;

  const handleUnlink = useCallback(
    (provider: SSOProvider) => {
      const { label } = providerMeta(provider.providerId);
      if (!allowUnlink) {
        // Debe quedar al menos una forma de iniciar sesión.
        notification.error({
          message: t(
            'profile.sso.unlink.forbidden',
            'No puedes desvincular tu único método de acceso.',
          ),
        });
        return;
      }
      modal.confirm({
        content: t(
          'profile.sso.unlink.description',
          `Dejarás de poder iniciar sesión con ${label} (${provider.email || provider.phoneNumber || provider.uid || ''}). Podrás volver a vincularla iniciando sesión con ese método.`,
        ),
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            const { data, errors } = await apolloClient.mutate<{
              unlinkSSOProvider: SSOProvider[];
            }>({
              mutation: UNLINK_SSO_PROVIDER,
              variables: { providerId: provider.providerId },
            });
            if (errors?.length) throw new Error(errors[0].message);
            // La mutation devuelve la lista actualizada — fuente de verdad.
            setProviders(data?.unlinkSSOProvider ?? []);
            notification.success({
              message: t('profile.sso.unlink.success', `${label} desvinculada.`),
            });
          } catch (error: any) {
            notification.error({
              message: t(
                'profile.sso.unlink.error',
                `No se pudo desvincular ${label}: ${error?.message || 'error desconocido'}`,
              ),
            });
          }
        },
        title: t('profile.sso.unlink.title', `¿Desvincular ${label}?`),
      });
    },
    [allowUnlink, t],
  );

  if (providers === null) return <Skeleton active paragraph={{ rows: 2 }} title={false} />;

  if (providers.length === 0)
    return (
      <Flexbox style={{ color: '#84848F', fontSize: 12 }}>
        {loadError
          ? t('profile.sso.loadError', 'No se pudieron cargar tus cuentas vinculadas.')
          : t('profile.sso.empty', 'Sin cuentas vinculadas.')}
      </Flexbox>
    );

  return (
    <Flexbox>
      {providers.map((item) => {
        const { icon, label } = providerMeta(item.providerId);
        return (
          <Item
            actions={
              <ActionIcon
                disabled={!allowUnlink}
                icon={Unlink}
                onClick={() => handleUnlink(item)}
                size={'small'}
                title={
                  allowUnlink
                    ? t('profile.sso.unlink.action', 'Desvincular')
                    : t(
                        'profile.sso.unlink.forbidden',
                        'No puedes desvincular tu único método de acceso.',
                      )
                }
              />
            }
            avatar={
              item.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={label}
                  src={item.photoURL}
                  style={{ borderRadius: '50%', height: 36, width: 36 }}
                />
              ) : (
                AuthIcons(icon)
              )
            }
            description={item.email || item.phoneNumber || item.uid || undefined}
            key={item.providerId}
            showAction
            title={label}
          />
        );
      })}
    </Flexbox>
  );
});

SSOProvidersList.displayName = 'SSOProvidersList';

export default SSOProvidersList;
