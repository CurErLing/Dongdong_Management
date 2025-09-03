import React, { useMemo } from 'react';
import { VARIANTS, SIZES } from '../../constants/styles';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// 样式配置对象，使用useMemo优化
const useButtonStyles = () => {
  return useMemo(() => ({
    variants: {
      primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white border-blue-600 hover:border-blue-700',
      secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white border-gray-600 hover:border-gray-700',
      success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white border-green-600 hover:border-green-700',
      warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white border-yellow-600 hover:border-yellow-700',
      error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white border-red-600 hover:border-red-700',
      ghost: 'bg-transparent hover:bg-gray-100 focus:ring-blue-500 text-gray-700 border-transparent hover:border-gray-200 dark:hover:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-700',
      outline: 'bg-transparent hover:bg-gray-50 focus:ring-blue-500 text-gray-700 border-gray-300 hover:border-gray-400 dark:hover:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:border-gray-500',
    },
    sizes: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    },
    base: 'inline-flex items-center justify-center font-medium rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  }), []);
};

// 加载图标组件
const LoadingSpinner: React.FC = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const styles = useButtonStyles();
  
  // 使用useMemo优化样式计算
  const buttonClasses = useMemo(() => {
    const variantStyle = styles.variants[variant];
    const sizeStyle = styles.sizes[size];
    const widthStyle = fullWidth ? 'w-full' : '';
    
    return [
      styles.base,
      variantStyle,
      sizeStyle,
      widthStyle,
      className
    ].filter(Boolean).join(' ');
  }, [styles, variant, size, fullWidth, className]);

  const isDisabled = disabled || loading;

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
