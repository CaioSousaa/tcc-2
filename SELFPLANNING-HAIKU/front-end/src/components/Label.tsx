import React from 'react';

interface LabelProps {
  name: string;
  color?: string;
  onRemove?: () => void;
  onClick?: () => void;
  small?: boolean;
  className?: string;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  red: { bg: 'bg-red-bg', text: 'text-red' },
  blue: { bg: 'bg-blue-bg', text: 'text-blue' },
  green: { bg: 'bg-green-bg', text: 'text-green' },
  amber: { bg: 'bg-amber-bg', text: 'text-amber-text' },
  purple: { bg: 'bg-purple-bg', text: 'text-purple' },
};

export function Label({
  name,
  color = 'blue',
  onRemove,
  onClick,
  small = false,
  className = '',
}: LabelProps) {
  const colors = colorMap[color] || colorMap.blue;
  const paddingClass = small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <div
      className={`
        inline-flex items-center gap-1
        ${colors.bg} ${colors.text}
        rounded font-medium cursor-pointer
        hover:opacity-80 transition-opacity
        ${paddingClass}
        ${className}
      `}
      onClick={onClick}
    >
      <span>{name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-60"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
