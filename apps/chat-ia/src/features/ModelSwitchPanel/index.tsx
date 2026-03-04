import { ActionIcon, Icon } from '@lobehub/ui';
import { Switch } from 'antd';
import { createStyles } from 'antd-style';
import type { ItemType } from 'antd/es/menu/interface';
import { Infinity, LucideArrowRight, LucideBolt } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, type ReactNode, memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ModelItemRender, ProviderItemRender } from '@/components/ModelSelect';
import UpgradeToMaxModal from '@/components/UpgradeToMaxModal';
import { isDeprecatedEdition } from '@/const/version';
import ActionDropdown from '@/features/ChatInput/ActionBar/components/ActionDropdown';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/slices/chat';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { EnabledProviderWithModels } from '@/types/aiProvider';

const useStyles = createStyles(({ css, prefixCls }) => ({
  menu: css`
    .${prefixCls}-dropdown-menu-item {
      display: flex;
      gap: 8px;
    }
    .${prefixCls}-dropdown-menu {
      &-item-group-title {
        padding-inline: 8px;
      }

      &-item-group-list {
        margin: 0 !important;
      }
    }
  `,
  tag: css`
    cursor: pointer;
  `,
}));

const menuKey = (provider: string, model: string) => `${provider}-${model}`;

interface IProps {
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  updating?: boolean;
}

const ModelSwitchPanel = memo<IProps>(({ children, onOpenChange, open }) => {
  const { t } = useTranslation('components');
  const { styles, theme } = useStyles();
  const [model, provider, updateAgentConfig] = useAgentStore((s) => [
    agentSelectors.currentAgentModel(s),
    agentSelectors.currentAgentModelProvider(s),
    s.updateAgentConfig,
  ]);
  const { showLLM } = useServerConfigStore(featureFlagsSelectors);
  const router = useRouter();
  const enabledList = useEnabledChatModels();

  // ✅ Estado para modal de suscripción
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ✅ Obtener plan de suscripción del usuario
  const subscriptionPlan = useUserStore((s) => s.subscriptionPlan);

  // ✅ Verificar si el usuario tiene plan MAX (150€/mes)
  // Plan MAX puede ser: 'max', 'pro', 'enterprise', 'ultimate', 'premium'
  const maxPlans = ['max', 'pro', 'enterprise', 'ultimate', 'premium'] as const;
  const hasMaxPlan =
    subscriptionPlan && maxPlans.includes(subscriptionPlan as (typeof maxPlans)[number]);

  const items = useMemo<ItemType[]>(() => {
    // ✅ Determinar qué modo auto está seleccionado
    const isAutoActive = provider === 'auto' || model === 'auto';
    const isAutoMaxActive = provider === 'auto-max' || model === 'auto-max';
    const isAnyAutoMode = isAutoActive || isAutoMaxActive;

    // ✅ SWITCH AUTO: Primera opción - Toggle para activar/desactivar Auto (como Cursor)
    const autoSwitchOption: ItemType = {
      key: 'auto-switch',
      label: (
        <Flexbox
          align={'center'}
          gap={12}
          horizontal
          justify="space-between"
          style={{ width: '100%' }}
        >
          <Flexbox align={'center'} gap={8} horizontal>
            <Infinity
              size={18}
              strokeWidth={2.5}
              style={{
                color: isAnyAutoMode ? '#52c41a' : '#8c8c8c',
                transition: 'color 0.2s',
              }}
            />
            <span>
              <strong style={{ color: isAnyAutoMode ? '#52c41a' : 'inherit' }}>Auto</strong> -
              Selección automática inteligente
            </span>
          </Flexbox>
          <Switch
            checked={isAnyAutoMode}
            onChange={async (checked) => {
              if (checked) {
                // Activar Auto (por defecto usa Auto, no Auto Max)
                await updateAgentConfig({ model: 'auto', provider: 'auto' });
              } else {
                // Desactivar Auto - usar el último modelo seleccionado o el default
                // Si no hay modelo previo, usar el primer modelo disponible
                if (enabledList.length > 0 && enabledList[0].children.length > 0) {
                  const firstModel = enabledList[0].children[0];
                  await updateAgentConfig({
                    model: firstModel.id,
                    provider: enabledList[0].id,
                  });
                }
              }
            }}
            size="small"
          />
        </Flexbox>
      ),
      onClick: async () => {
        // Toggle Auto
        if (isAnyAutoMode) {
          // Desactivar Auto
          if (enabledList.length > 0 && enabledList[0].children.length > 0) {
            const firstModel = enabledList[0].children[0];
            await updateAgentConfig({
              model: firstModel.id,
              provider: enabledList[0].id,
            });
          }
        } else {
          // Activar Auto
          await updateAgentConfig({ model: 'auto', provider: 'auto' });
        }
      },
    };

    // ✅ AUTO MAX: Segunda opción - Selección automática (máxima calidad)
    // ✅ SIEMPRE visible, pero requiere plan MAX para activar
    const autoMaxOption: ItemType = {
      key: 'auto-max-auto-max',
      label: (
        <Flexbox
          align={'center'}
          gap={12}
          horizontal
          justify="space-between"
          style={{ width: '100%' }}
        >
          <Flexbox align={'center'} gap={8} horizontal>
            <Infinity
              size={18}
              strokeWidth={2.5}
              style={{
                color: isAutoMaxActive ? '#52c41a' : '#8c8c8c',
                transition: 'color 0.2s',
              }}
            />
            <span>
              <strong style={{ color: isAutoMaxActive ? '#52c41a' : 'inherit' }}>Auto Max</strong> -
              Selección automática (máxima calidad)
            </span>
          </Flexbox>
          <Switch
            checked={isAutoMaxActive}
            onChange={async (checked) => {
              if (checked) {
                // ✅ Verificar si tiene plan MAX antes de activar
                if (!hasMaxPlan) {
                  // Mostrar modal de suscripción
                  setShowUpgradeModal(true);
                  return;
                }
                // Activar Auto Max
                await updateAgentConfig({ model: 'auto-max', provider: 'auto-max' });
              } else {
                // Desactivar Auto Max - volver a Auto o modelo específico
                if (enabledList.length > 0 && enabledList[0].children.length > 0) {
                  const firstModel = enabledList[0].children[0];
                  await updateAgentConfig({
                    model: firstModel.id,
                    provider: enabledList[0].id,
                  });
                } else {
                  // Si no hay modelos, volver a Auto
                  await updateAgentConfig({ model: 'auto', provider: 'auto' });
                }
              }
            }}
            size="small"
          />
        </Flexbox>
      ),
      onClick: async () => {
        // Toggle Auto Max
        if (isAutoMaxActive) {
          // Desactivar Auto Max
          if (enabledList.length > 0 && enabledList[0].children.length > 0) {
            const firstModel = enabledList[0].children[0];
            await updateAgentConfig({
              model: firstModel.id,
              provider: enabledList[0].id,
            });
          } else {
            await updateAgentConfig({ model: 'auto', provider: 'auto' });
          }
        } else {
          // ✅ Verificar si tiene plan MAX antes de activar
          if (!hasMaxPlan) {
            // Mostrar modal de suscripción
            setShowUpgradeModal(true);
            return;
          }
          // Activar Auto Max
          await updateAgentConfig({ model: 'auto-max', provider: 'auto-max' });
        }
      },
    };

    const getModelItems = (provider: EnabledProviderWithModels) => {
      const items = provider.children.map((model) => ({
        key: menuKey(provider.id, model.id),
        label: <ModelItemRender {...model} {...model.abilities} />,
        onClick: async () => {
          await updateAgentConfig({ model: model.id, provider: provider.id });
        },
      }));

      // if there is empty items, add a placeholder guide
      if (items.length === 0)
        return [
          {
            key: `${provider.id}-empty`,
            label: (
              <Flexbox gap={8} horizontal style={{ color: theme.colorTextTertiary }}>
                {t('ModelSwitchPanel.emptyModel')}
                <Icon icon={LucideArrowRight} />
              </Flexbox>
            ),
            onClick: () => {
              router.push(
                isDeprecatedEdition
                  ? '/settings?active=llm'
                  : `/settings?active=provider&provider=${provider.id}`,
              );
            },
          },
        ];

      return items;
    };

    if (enabledList.length === 0)
      return [
        autoSwitchOption, // ✅ Switch Auto (como Cursor)
        autoMaxOption, // ✅ Auto Max siempre visible
        {
          key: `no-provider`,
          label: (
            <Flexbox gap={8} horizontal style={{ color: theme.colorTextTertiary }}>
              {t('ModelSwitchPanel.emptyProvider')}
              <Icon icon={LucideArrowRight} />
            </Flexbox>
          ),
          onClick: () => {
            router.push(isDeprecatedEdition ? '/settings?active=llm' : `/settings?active=provider`);
          },
        },
      ];

    // otherwise show with provider group
    // ✅ Agregar Switch Auto y Auto Max como primeras opciones antes de los grupos de proveedores
    return [
      autoSwitchOption, // ✅ Switch Auto (como Cursor)
      autoMaxOption, // ✅ Auto Max siempre visible
      ...enabledList.map((provider) => ({
        children: getModelItems(provider),
        key: provider.id,
        label: (
          <Flexbox horizontal justify="space-between">
            <ProviderItemRender
              logo={provider.logo}
              name={provider.name}
              provider={provider.id}
              source={provider.source}
            />
            {showLLM && (
              <Link
                href={
                  isDeprecatedEdition
                    ? '/settings?active=llm'
                    : `/settings?active=provider&provider=${provider.id}`
                }
              >
                <ActionIcon
                  icon={LucideBolt}
                  size={'small'}
                  title={t('ModelSwitchPanel.goToSettings')}
                />
              </Link>
            )}
          </Flexbox>
        ),
        type: 'group' as const,
      })),
    ];
  }, [enabledList, provider, model, updateAgentConfig, theme, t, router, showLLM]);

  const icon = <div className={styles.tag}>{children}</div>;

  return (
    <Fragment>
      <ActionDropdown
        menu={{
          // @ts-expect-error 等待 antd 修复
          activeKey:
            provider === 'auto' || model === 'auto'
              ? 'auto-switch'
              : provider === 'auto-max' || model === 'auto-max'
                ? 'auto-max-auto-max'
                : menuKey(provider, model),
          className: styles.menu,
          items,
          // 不加限高就会导致面板超长，顶部的内容会被隐藏
          // https://github.com/user-attachments/assets/9c043c47-42c5-46ef-b5c1-bee89376f042
          style: {
            maxHeight: 550,
            overflowY: 'scroll',
          },
        }}
        onOpenChange={onOpenChange}
        open={open}
        placement={'topLeft'}
        prefetch
      >
        {icon}
      </ActionDropdown>
      <UpgradeToMaxModal
        onClose={() => setShowUpgradeModal(false)}
        onSubscribe={async () => {
          // ✅ TODO: Implementar lógica de suscripción
          // Por ahora, redirigir a página de suscripción o llamar a API
          console.log('Suscribirse a plan MAX (150€/mes)');
          // window.location.href = '/subscription?plan=max';
        }}
        open={showUpgradeModal}
      />
    </Fragment>
  );
});

export default ModelSwitchPanel;
