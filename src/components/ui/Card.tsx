import React, { useMemo } from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}

// 样式配置对象
const useCardStyles = () => {
  return useMemo(() => ({
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    },
    shadow: {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    },
    base: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200',
  }), []);
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false,
  onClick,
}) => {
  const styles = useCardStyles();
  
  const cardClasses = useMemo(() => {
    const baseStyle = styles.base;
    const shadowStyle = styles.shadow[shadow];
    const hoverStyle = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';
    
    return [
      baseStyle,
      shadowStyle,
      hoverStyle,
      className
    ].filter(Boolean).join(' ');
  }, [styles, shadow, hover, className]);

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  border = true,
}) => {
  const headerClasses = useMemo(() => {
    const baseStyle = 'px-6 py-4';
    const borderStyle = border ? 'border-b border-gray-200 dark:border-gray-700' : '';
    
    return [
      baseStyle,
      borderStyle,
      className
    ].filter(Boolean).join(' ');
  }, [border, className]);

  return (
    <div className={headerClasses}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
  padding = 'md',
}) => {
  const styles = useCardStyles();
  const paddingStyle = styles.padding[padding];

  return (
    <div className={paddingStyle ? `${paddingStyle} ${className}`.trim() : className}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  border = true,
}) => {
  const footerClasses = useMemo(() => {
    const baseStyle = 'px-6 py-4';
    const borderStyle = border ? 'border-t border-gray-200 dark:border-gray-700' : '';
    
    return [
      baseStyle,
      borderStyle,
      className
    ].filter(Boolean).join(' ');
  }, [border, className]);

  return (
    <div className={footerClasses}>
      {children}
    </div>
  );
};
