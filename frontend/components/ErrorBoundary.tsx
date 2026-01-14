
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Standard React Error Boundary component.
 * Monitors the child component tree for runtime errors and provides a fallback UI.
 */
// Inherit from Component<Props, State> directly to ensure proper typing.
export class SovereignErrorBoundary extends Component<Props, State> {
  // Initialize state property.
  public state: State = {
    hasError: false,
    error: null
  };

  /**
   * Static lifecycle method called when a child component throws an error.
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method for side effects after an error is caught.
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Nexus Critical Glitch caught by boundary:", error, errorInfo);
  }

  /**
   * Resets the boundary's state to allow the application to recover.
   */
  private handleReset = (): void => {
    // Accessing setState via any cast to resolve property recognition issues in the current TS environment.
    (this as any).setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    // Accessing state and props via any cast to resolve property recognition issues in the current TS environment.
    const { hasError, error } = (this as any).state;
    const { children } = (this as any).props;

    if (hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 glass-card border-red-500/30 bg-red-500/[0.02] text-center space-y-8 animate-in fade-in duration-1000">
          <div className="w-24 h-24 rounded-[2rem] bg-red-600/10 border-2 border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_50px_rgba(239,68,246,0.2)]">
            <ShieldAlert size={48} className="animate-pulse" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Neural Re-routing Required</h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              A collision in the latent space occurred. The node has been isolated to prevent systemic corruption.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3"
            >
              <RefreshCw size={16} /> Re-establish Link
            </button>
            <button 
              onClick={this.handleReset}
              className="px-8 py-4 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Attempt Hot-Fix
            </button>
          </div>
          <div className="pt-8 opacity-20 font-mono text-[10px] text-red-400">
            ERROR_LOG: {error?.message || "UNKNOWN_DEVIATION"}
          </div>
        </div>
      );
    }

    return children;
  }
}
