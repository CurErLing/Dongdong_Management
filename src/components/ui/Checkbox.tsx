import React from 'react';
import { SIZES } from '../../constants/styles';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: keyof typeof SIZES;
  label?: string;
  helperText?: string;
  error?: boolean;
  success?: boolean;
  indeterminate?: boolean;
  className?: string;
}

const sizeStyles = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

export const Checkbox: React.FC<CheckboxProps> = ({
  size = 'md',
  label,
  helperText,
  error = false,
  success = false,
  indeterminate = false,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const sizeStyle = sizeStyles[size];

  const stateStyles = error
    ? 'border-red-300 focus:ring-red-500 text-red-600'
    : success
    ? 'border-green-300 focus:ring-green-500 text-green-600'
    : 'border-gray-300 focus:ring-blue-500 text-blue-600 dark:border-gray-600 dark:focus:ring-blue-400 dark:text-blue-400';

  return (
    <div className={className}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={checkboxId}
            type="checkbox"
            className={`
              ${sizeStyle}
              rounded border
              focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${stateStyles}
            `.trim()}
            ref={(el) => {
              if (el && indeterminate) {
                el.indeterminate = true;
              }
            }}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label
              htmlFor={checkboxId}
              className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {label}
            </label>
            {helperText && (
              <p
                className={`mt-1 ${
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
        )}
      </div>
    </div>
  );
};
