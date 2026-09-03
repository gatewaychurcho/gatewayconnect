import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Recovered from boundary error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#001122] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-xl font-bold font-serif-church text-[#D4AF37] mb-2">
            Gateway Connect Recovery
          </h1>
          <p className="text-sm text-white/70 max-w-md mb-6 leading-relaxed">
            The application encountered a temporary browser environment exception. In-memory mode is active.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-[#001F3F] font-bold text-sm shadow-lg hover:scale-105 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Gateway Connect</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

