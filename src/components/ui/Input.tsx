import React, { useMemo, forwardRef } from 'react';
import { SIZES } from '../../constants/styles';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: keyof typeof SIZES;
  error?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
}

// 样式配置对象
const useInputStyles = () => {
  return useMemo(() => ({
    sizes: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2.5 text-base',
      xl: 'px-4 py-3 text-lg',
    },
    base: 'block w-full border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    states: {
      default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
    },
  }), []);
};

// 图标容器组件
const IconContainer: React.FC<{
  position: 'left' | 'right';
  children: React.ReactNode;
}> = ({ position, children }) => (
  <div className={`absolute inset-y-0 ${position === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
    <span className="text-gray-400">{children}</span>
  </div>
);

// 标签组件
const InputLabel: React.FC<{
  htmlFor: string;
  children: React.ReactNode;
}> = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
  >
    {children}
  </label>
);

// 帮助文本组件
const HelperText: React.FC<{
  text: string;
  type: 'default' | 'error' | 'success';
}> = ({ text, type }) => {
  const textColor = useMemo(() => {
    switch (type) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  }, [type]);

  return (
    <p className={`mt-1 text-sm ${textColor}`}>
      {text}
    </p>
  );
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'md',
  error = false,
  success = false,
  leftIcon,
  rightIcon,
  label,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const styles = useInputStyles();
  
  // 生成唯一ID
  const inputId = useMemo(() => 
    id || `input-${Math.random().toString(36).substr(2, 9)}`, 
    [id]
  );

  // 计算样式类名
  const inputClasses = useMemo(() => {
    const sizeStyle = styles.sizes[size];
    const stateStyle = error ? styles.states.error : success ? styles.states.success : styles.states.default;
    const iconPadding = leftIcon ? 'pl-10' : '';
    const rightIconPadding = rightIcon ? 'pr-10' : '';
    
    return [
      styles.base,
      sizeStyle,
      stateStyle,
      iconPadding,
      rightIconPadding,
      className
    ].filter(Boolean).join(' ');
  }, [styles, size, error, success, leftIcon, rightIcon, className]);

  // 确定帮助文本类型
  const helperTextType = useMemo(() => {
    if (error) return 'error';
    if (success) return 'success';
    return 'default';
  }, [error, success]);

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && <InputLabel htmlFor={inputId}>{label}</InputLabel>}
      
      <div className="relative">
        {leftIcon && <IconContainer position="left">{leftIcon}</IconContainer>}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && <IconContainer position="right">{rightIcon}</IconContainer>}
      </div>
      
      {helperText && (
        <HelperText text={helperText} type={helperTextType} />
      )}
    </div>
  );
});

Input.displayName = 'Input';
