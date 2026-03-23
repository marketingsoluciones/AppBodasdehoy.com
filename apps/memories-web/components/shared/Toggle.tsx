interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
  activeColor?: string;
}

export default function Toggle({ enabled, onChange, disabled, label, activeColor = 'bg-violet-500' }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-300 ${enabled ? activeColor : 'bg-gray-200'} disabled:opacity-50`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}
