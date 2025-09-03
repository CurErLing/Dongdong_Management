import React from 'react';
import { SIZES } from '../../constants/styles';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: keyof typeof SIZES;
  error?: boolean;
  success?: boolean;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  rows?: number;
}

const sizeStyles = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
  xl: 'px-4 py-3 text-lg',
};

export const Textarea: React.FC<TextareaProps> = ({
  size = 'md',
  error = false,
  success = false,
  label,
  helperText,
  fullWidth = false,
  rows = 3,
  className = '',
  id,
  ...props
}) => {
  const baseStyles = `
    block w-full
    border rounded-md
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    resize-vertical
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizeStyle = sizeStyles[size];
  
  const stateStyles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : success
    ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400';

  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`
          ${baseStyles}
          ${sizeStyle}
          ${stateStyles}
          ${className}
        `.trim()}
        {...props}
      />
      {helperText && (
        <p
          className={`mt-1 text-sm ${
            error
              ? 'text-red-600 dark:text-red-400'
              : success
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};
