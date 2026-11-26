import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}) => {
  const baseClass = 'font-medium rounded transition-all';
  const variantClass = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];
  const sizeClass = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  }[size];

  return (
    <button className={`${baseClass} ${variantClass} ${sizeClass} ${className}`} {...props} />
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = (props) => {
  return (
    <input
      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      {...props}
    />
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Avatar: React.FC<{ name: string; size?: 'small' | 'medium' | 'large' }> = ({
  name,
  size = 'medium',
}) => {
  const initial = name.charAt(0).toUpperCase();
  const sizeClass = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base',
  }[size];

  return (
    <div className={`${sizeClass} rounded-full bg-blue-600 text-white flex items-center justify-center font-bold`}>
      {initial}
    </div>
  );
};
