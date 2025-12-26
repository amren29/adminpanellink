"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import Button from "@/components/ui/button/Button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/10 mb-4">
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                            Something went wrong
                        </h2>
                        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                            We encountered an unexpected error. Please try reloading the page.
                        </p>

                        {/* Optional: Show error message in dev mode */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 rounded bg-gray-100 p-3 text-left text-xs font-mono text-gray-700 dark:bg-gray-900 dark:text-gray-300 overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <Button onClick={this.handleReload} className="w-full">
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
