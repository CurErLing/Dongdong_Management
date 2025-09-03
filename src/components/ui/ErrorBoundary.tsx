import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert } from './Alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 调用错误处理回调
    this.props.onError?.(error, errorInfo);
    
    // 可以在这里发送错误到错误监控服务
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 自定义错误UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="p-6 max-w-md mx-auto">
          <Alert
            type="error"
            title="组件错误"
            closable={false}
          >
            <div className="space-y-3">
              <p>抱歉，组件出现了错误。</p>
              {this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer hover:text-red-700 dark:hover:text-red-300">
                    查看错误详情
                  </summary>
                  <pre className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                重试
              </button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// 函数式组件的错误边界Hook
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    throw error;
  }

  return setError;
}
