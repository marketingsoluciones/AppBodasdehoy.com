import { FC, useEffect, useRef, ChangeEvent } from "react";

interface TextareaProps {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxRows?: number;
  minRows?: number;
  allowEnter?: boolean;
  defaultValue?: string;
}

const DEFAULT_MAX_ROWS = 8;
const DEFAULT_MIN_ROWS = 1;

export const Textarea: FC<TextareaProps> = ({
  value,
  setValue,
  placeholder,
  className = "",
  maxRows = DEFAULT_MAX_ROWS,
  minRows = DEFAULT_MIN_ROWS,
  allowEnter = true,
  defaultValue
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const calculateRows = (text: string): number => {
    if (!text?.trim()) return minRows;
    const lines = text.split('\n');
    let totalLines = 0;
    for (const line of lines) {
      const estimatedCharsPerLine = 50; // Aproximación basada en el ancho del textarea
      const lineCount = Math.ceil(line.length / estimatedCharsPerLine);
      totalLines += Math.max(1, lineCount);
    }
    return Math.max(minRows, Math.min(maxRows, totalLines));
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    const newValue = target.value;
    setValue(newValue);
    const newRows = calculateRows(newValue);
    target.rows = newRows;
  };

  const updateRows = () => {
    if (textareaRef.current) {
      const newRows = calculateRows(value);
      textareaRef.current.rows = newRows;
    }
  };

  useEffect(() => {
    updateRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (defaultValue && !value) {
      setValue(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !allowEnter) {
      e.preventDefault();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={minRows}
      style={{ resize: 'none' }}
      className={`rounded-lg border-[1px] border-gray-300 text-xs w-[100%] overflow-y-scroll focus:ring-0 focus:outline-none focus:border-primary pr-8 ${className}`}
    />
  );
};