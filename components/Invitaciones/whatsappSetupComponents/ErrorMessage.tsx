interface ErrorMessageProps {
  error: string;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div className="mb-4 p-3 bg-red-50 border-[1px] border-red-200 rounded-md">
      <p className="font-body text-xs text-red-600">{error}</p>
    </div>
  );
}

