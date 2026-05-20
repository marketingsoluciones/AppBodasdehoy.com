'use client';

import { Form, type FormGroupItemType, Input } from '@lobehub/ui';
import { Skeleton } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { enableAuth } from '@/const/auth';
import { FORM_STYLE } from '@/const/layoutTokens';
import AvatarWithUpload from '@/features/AvatarWithUpload';
import UserAvatar from '@/features/User/UserAvatar';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';

// SPRINT-N 2026-05-19 — migración Clerk-out:
// SSOProvidersList era una UI que mostraba providers NextAuth (Google, GitHub, etc).
// bodasdehoy usa Firebase via api-ia → no se renderiza ningún provider list.

const Client = memo<{ mobile?: boolean }>(({ mobile }) => {
  const [isLoginWithNextAuth, isLogin] = useUserStore((s) => [
    authSelectors.isLoginWithNextAuth(s),
    authSelectors.isLogin(s),
  ]);
  const [nickname, username, userProfile, loading] = useUserStore((s) => [
    userProfileSelectors.nickName(s),
    userProfileSelectors.username(s),
    userProfileSelectors.userProfile(s),
    !s.isLoaded,
  ]);

  const [form] = Form.useForm();
  const { t } = useTranslation('auth');

  if (loading)
    return (
      <Skeleton
        active
        paragraph={{ rows: 6 }}
        style={{ padding: mobile ? 16 : undefined }}
        title={false}
      />
    );

  const profile: FormGroupItemType = {
    children: [
      {
        children: enableAuth && !isLogin ? <UserAvatar /> : <AvatarWithUpload />,
        label: t('profile.avatar'),
        layout: 'horizontal',
        minWidth: undefined,
      },
      {
        children: <Input disabled />,
        label: t('profile.username'),
        name: 'username',
      },
      {
        children: <Input disabled />,
        hidden: !isLoginWithNextAuth || !userProfile?.email,
        label: t('profile.email'),
        name: 'email',
      },
      // SPRINT-N 2026-05-19: SSOProvidersList eliminado (NextAuth fuera).
    ],
    title: t('tab.profile'),
  };
  return (
    <Form
      form={form}
      initialValues={{
        email: userProfile?.email || '--',
        username: nickname || username,
      }}
      items={[profile]}
      itemsType={'group'}
      variant={'borderless'}
      {...FORM_STYLE}
    />
  );
});

export default Client;
