import React from "react";
import ReactDOM from "react-dom/client";
import "@xterm/xterm/css/xterm.css";
import { App } from "./App";
import "./styles.css";

const ErrorFallback = ({ error }: { error: any }) => (
  <div style={{ padding: "40px", background: "#1e1e1e", color: "#ff8888", fontFamily: "monospace", minHeight: "100vh" }}>
    <h2>Render Error!</h2>
    <pre>{error?.stack || String(error)}</pre>
  </div>
);

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any) {
    console.error("ErrorBoundary caught an error:", error);
  }
  render() {
    if (this.state.hasError) return <ErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
