import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-ink mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2 border border-border rounded
          text-body placeholder-placeholder
          focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent
          disabled:bg-surface-alt disabled:cursor-not-allowed
          ${error ? 'border-red focus:ring-red' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red mt-1">{error}</p>
      )}
    </div>
  );
}
