import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Recovered from boundary error:', error, errorInfo);
  }

  // Fixes the app in real time without infinite reload loops
  handleReset = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('gcz_stream_attendance_history_v1');
        window.localStorage.removeItem('gcz_stream_viewers_v1');
        window.localStorage.removeItem('gcz_live_sermon_v1');
      }
    } catch {}
    this.setState({ hasError: false, error: null });
  };

  // Fresh Start: Cleans logs, streaming states, resets cache while preserving all registered users, groups & profiles
  handleFreshStart = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const allUsers = window.localStorage.getItem('gcz_all_users') || window.localStorage.getItem('gcz_all_users_v1');
        const currUser = window.localStorage.getItem('gcz_current_user') || window.localStorage.getItem('gcz_current_user_v1');
        const avatars = window.localStorage.getItem('gcz_permanent_custom_avatars') || window.localStorage.getItem('gcz_permanent_custom_avatars_v1');
        const chatGroups = window.localStorage.getItem('gcz_chat_groups_v1');
        const directMsgs = window.localStorage.getItem('gcz_direct_messages');
        
        window.localStorage.clear();
        
        if (allUsers) {
          window.localStorage.setItem('gcz_all_users', allUsers);
          window.localStorage.setItem('gcz_all_users_v1', allUsers);
        }
        if (currUser) {
          window.localStorage.setItem('gcz_current_user', currUser);
          window.localStorage.setItem('gcz_current_user_v1', currUser);
        }
        if (avatars) {
          window.localStorage.setItem('gcz_permanent_custom_avatars', avatars);
          window.localStorage.setItem('gcz_permanent_custom_avatars_v1', avatars);
        }
        if (chatGroups) window.localStorage.setItem('gcz_chat_groups_v1', chatGroups);
        if (directMsgs) window.localStorage.setItem('gcz_direct_messages', directMsgs);
      }
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 shadow-sm animate-pulse">
            <AlertTriangle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-serif-church text-primary mb-2 tracking-wide">
            Gateway Connect Recovery
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
            The application intercepted an interface state exception. Click below to instantly recover in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Fix & Recover in Real Time</span>
            </button>

            <button
              onClick={this.handleFreshStart}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-sm border border-border shadow-xs transition-all cursor-pointer"
              title="Clears all logs and corrupt cache starting afresh, keeping your users and accounts intact"
            >
              <span>Fresh Start (Keep Users)</span>
            </button>
          </div>

          {this.state.error && (
            <div className="max-w-md w-full text-left">
              <button
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-muted-foreground hover:text-foreground underline mb-2 cursor-pointer"
              >
                {this.state.showDetails ? 'Hide error details' : 'Show technical error details'}
              </button>
              {this.state.showDetails && (
                <pre className="p-3 rounded-lg bg-card border border-destructive/30 text-[11px] text-destructive overflow-x-auto whitespace-pre-wrap break-words font-mono">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

