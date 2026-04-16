import React, { forwardRef, useEffect, useMemo, useRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  indeterminate?: boolean;
  tooltip?: string;
};

export const IndeterminateCheckbox = forwardRef<HTMLInputElement, Props>(
  ({ indeterminate, className, tooltip, ...rest }, ref) => {
    const internalRef = useRef<HTMLInputElement | null>(null);
    const resolvedRef = (ref as React.RefObject<HTMLInputElement>) ?? internalRef;
    const combinedClassName = useMemo(() => {
      const baseClasses = "rounded-full text-primary border-gray-300 focus:outline-none focus:ring-0 focus:ring-offset-0";
      return className ? `${baseClasses} ${className}` : baseClasses;
    }, [className]);

    useEffect(() => {
      if (!resolvedRef.current) return;
      resolvedRef.current.indeterminate = Boolean(indeterminate);
    }, [resolvedRef, indeterminate]);

    const { title, ...restWithoutTitle } = rest;

    return (
      <span className="relative inline-flex items-center group">
        <input
          type="checkbox"
          ref={resolvedRef}
          className={combinedClassName}
          {...restWithoutTitle}
        />
        {tooltip && (
          <span className="pointer-events-none absolute bottom-full translate-y-1/2 translate-x-5 whitespace-nowrap rounded bg-gray-800 px-2 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {tooltip}
          </span>
        )}
      </span>
    );
  });
IndeterminateCheckbox.displayName = "IndeterminateCheckbox";