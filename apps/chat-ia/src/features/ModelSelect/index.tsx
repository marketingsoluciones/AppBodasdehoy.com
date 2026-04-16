import { Select, type SelectProps } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Infinity } from 'lucide-react';
import { memo, useMemo } from 'react';

import { ModelItemRender, ProviderItemRender, TAG_CLASSNAME } from '@/components/ModelSelect';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { EnabledProviderWithModels } from '@/types/aiProvider';

const useStyles = createStyles(({ css, prefixCls }) => ({
  popup: css`
    &.${prefixCls}-select-dropdown .${prefixCls}-select-item-option-grouped {
      padding-inline-start: 12px;
    }
  `,
  select: css`
    .${prefixCls}-select-selection-item {
      .${TAG_CLASSNAME} {
        display: none;
      }
    }
  `,
}));

interface ModelOption {
  label: any;
  provider: string;
  value: string;
}

interface ModelSelectProps {
  defaultValue?: { model: string; provider?: string };
  onChange?: (props: { model: string; provider: string }) => void;
  showAbility?: boolean;
  value?: { model: string; provider?: string };
}

const ModelSelect = memo<ModelSelectProps>(({ value, onChange, showAbility = true }) => {
  const enabledList = useEnabledChatModels();

  const { styles } = useStyles();

  // ✅ Determinar si Auto está seleccionado para mostrar ícono verde
  const isAutoActive = value?.provider === 'auto' || value?.model === 'auto';

  const options = useMemo<SelectProps['options']>(() => {
    // ✅ Determinar qué modo auto está activo
    const isAutoMaxActive = value?.provider === 'auto-max' || value?.model === 'auto-max';

    // ✅ AUTO: Primera opción - Selección automática (optimizado para costo)
    const autoOption = {
      label: (
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <Infinity
            size={18}
            strokeWidth={2.5}
            style={{
              color: isAutoActive ? '#52c41a' : '#8c8c8c',
              transition: 'color 0.2s',
            }}
          />
          <span>
            <strong style={{ color: isAutoActive ? '#52c41a' : 'inherit' }}>Auto</strong> -
            Selección automática (optimizado para costo)
          </span>
        </div>
      ),
      provider: 'auto',
      value: 'auto/auto',
    };

    // ✅ AUTO MAX: Segunda opción - Selección automática (máxima calidad)
    const autoMaxOption = {
      label: (
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
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
        </div>
      ),
      provider: 'auto-max',
      value: 'auto-max/auto-max',
    };

    const getChatModels = (provider: EnabledProviderWithModels) =>
      provider.children.map((model) => ({
        label: <ModelItemRender {...model} {...model.abilities} showInfoTag={showAbility} />,
        provider: provider.id,
        value: `${provider.id}/${model.id}`,
      }));

    if (enabledList.length === 1) {
      const provider = enabledList[0];
      const providerOptions = getChatModels(provider);

      // ✅ Agregar "Auto" y "Auto Max" como primeras opciones
      return [autoOption, autoMaxOption, ...providerOptions];
    }

    const providerOptions = enabledList.map((provider) => ({
      label: (
        <ProviderItemRender
          logo={provider.logo}
          name={provider.name}
          provider={provider.id}
          source={provider.source}
        />
      ),
      options: getChatModels(provider),
    }));

    // ✅ Agregar "Auto" y "Auto Max" como primeras opciones
    return [autoOption, autoMaxOption, ...providerOptions];
  }, [enabledList, isAutoActive]);

  return (
    <Select
      className={styles.select}
      classNames={{
        popup: { root: styles.popup },
      }}
      defaultValue={
        value?.provider === 'auto'
          ? 'auto/auto'
          : value?.provider === 'auto-max'
            ? 'auto-max/auto-max'
            : `${value?.provider}/${value?.model}` || 'auto/auto'
      }
      onChange={(value, option) => {
        if (value === 'auto/auto') {
          onChange?.({ model: 'auto', provider: 'auto' });
        } else if (value === 'auto-max/auto-max') {
          onChange?.({ model: 'auto-max', provider: 'auto-max' });
        } else {
          const model = value.split('/').slice(1).join('/');
          onChange?.({ model, provider: (option as unknown as ModelOption).provider });
        }
      }}
      options={options}
      popupMatchSelectWidth={false}
      value={
        value?.provider === 'auto'
          ? 'auto/auto'
          : value?.provider === 'auto-max'
            ? 'auto-max/auto-max'
            : `${value?.provider}/${value?.model}` || 'auto/auto'
      }
    />
  );
});

export default ModelSelect;
