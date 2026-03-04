import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

export type FilterMode = 'include' | 'exclude';

export interface FilterOption {
  value: string;
  label?: string;
  labelKey?: string;
}

interface FilterSelectWithModeProps {
  label?: string;
  labelKey?: string;
  name: string;
  options: FilterOption[];
  value: string;
  mode: FilterMode;
  includeLabel?: string;
  includeLabelKey?: string;
  excludeLabel?: string;
  excludeLabelKey?: string;
  onChangeValue: (newValue: string) => void;
  onChangeMode: (newMode: FilterMode) => void;
  disabled?: boolean;
  allValue?: string;
}

export const FilterSelectWithMode: FC<FilterSelectWithModeProps> = ({
  label,
  labelKey,
  name,
  options,
  value,
  mode,
  includeLabel,
  excludeLabel,
  includeLabelKey,
  excludeLabelKey,
  onChangeValue,
  onChangeMode,
  disabled = false,
  allValue = 'all',
}) => {
  const { t } = useTranslation();
  const isModeDisabled = disabled || value === allValue;

  const resolvedLabel = useMemo(() => {
    if (labelKey) return t(labelKey);
    return label ?? "";
  }, [label, labelKey, t]);

  const resolvedIncludeLabel = useMemo(() => {
    if (includeLabelKey) return t(includeLabelKey);
    if (includeLabel) return includeLabel;
    return t("Incluir", { defaultValue: "Incluir" });
  }, [includeLabel, includeLabelKey, t]);

  const resolvedExcludeLabel = useMemo(() => {
    if (excludeLabelKey) return t(excludeLabelKey);
    if (excludeLabel) return excludeLabel;
    return t("Excluir", { defaultValue: "Excluir" });
  }, [excludeLabel, excludeLabelKey, t]);

  const resolvedOptions = useMemo(() => {
    return options.map((option) => ({
      ...option,
      displayLabel: option.labelKey ? t(option.labelKey) : option.label ?? option.value,
    }));
  }, [options, t]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">{resolvedLabel}</label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] font-medium text-gray-700">
            <input
              type="radio"
              name={name}
              value="include"
              checked={mode === 'include'}
              onChange={() => onChangeMode('include')}
              disabled={isModeDisabled}
              className="rounded-full text-blue-600 border-gray-300 focus:outline-none focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
            />
            {resolvedIncludeLabel}
          </label>
          <label className="flex items-center gap-1 text-[10px] font-medium text-gray-700">
            <input
              type="radio"
              name={name}
              value="exclude"
              checked={mode === 'exclude'}
              onChange={() => onChangeMode('exclude')}
              disabled={isModeDisabled}
              className="rounded-full text-blue-600 border-gray-300 focus:outline-none focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
            />
            {resolvedExcludeLabel}
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(event) => onChangeValue(event.target.value)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled}
        >
          {resolvedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.displayLabel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

