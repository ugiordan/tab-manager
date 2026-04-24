import React from "react";

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: "#c9190b" }}>
          <p style={{ fontWeight: 600 }}>Something went wrong</p>
          <p style={{ fontSize: 12 }}>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })} style={{ marginTop: 8 }}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
