import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * GlobalErrorBoundary catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to the console
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Render fallback UI when an error occurs
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <i className="fa-solid fa-bug text-3xl"></i>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-4">
              問題が発生しました
            </h1>
            <p className="text-slate-500 text-center mb-6 text-sm">
              アプリケーションのレンダリング中に予期せぬエラーが発生しました。
            </p>
            
            <div className="bg-slate-100 p-4 rounded-xl mb-6 overflow-auto max-h-40 border border-slate-200">
              <code className="text-xs text-red-600 font-mono break-all">
                {this.state.error?.message || 'Unknown Error'}
              </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <i className="fa-solid fa-rotate-right mr-2"></i>
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    // Explicitly cast to any to resolve "Property 'props' does not exist" TS error
    return (this as any).props.children;
  }
}