import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name?: string): string {
  if (!name) return 'bg-muted';
  const colors = [
    'bg-blue bg-opacity-20',
    'bg-red bg-opacity-20',
    'bg-green bg-opacity-20',
    'bg-purple bg-opacity-20',
    'bg-amber bg-opacity-20',
  ];
  const hash = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return colors[hash % colors.length];
}

export function Avatar({
  src,
  alt = 'avatar',
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full
        ${sizeStyles[size]}
        ${src ? 'bg-border' : getColorFromName(name)}
        overflow-hidden
        font-semibold text-body
        ${className}
      `}
      title={name}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
