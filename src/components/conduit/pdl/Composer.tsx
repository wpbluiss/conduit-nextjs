"use client";

// pdl — Composer
// Contract: specs/praxis-design-language/contracts/foundations.md §2.13
//
// Glassmorphic input shell. Multiline textarea (Fraunces italic),
// optional header row above for pickers/chips, optional footer row
// below for action buttons. Submits on cmd/ctrl+Enter when onSubmit
// provided.

import { useCallback, type ReactNode } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  /** Rendered ABOVE the textarea — typically kind / scope pickers. */
  header?: ReactNode;
  /** Rendered BELOW the textarea on the right — typically action buttons. */
  footer?: ReactNode;
  className?: string;
  rows?: number;
  maxLength?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  header,
  footer,
  className,
  rows = 3,
  maxLength,
  autoFocus,
  disabled,
}: Props) {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        onSubmit &&
        (e.metaKey || e.ctrlKey) &&
        e.key === "Enter" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit],
  );

  return (
    <div className={`pdl-composer pdl-glass${className ? ` ${className}` : ""}`}>
      {header}
      <textarea
        className="pdl-composer-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={disabled}
      />
      {footer && <div className="pdl-composer-row">{footer}</div>}
    </div>
  );
}
