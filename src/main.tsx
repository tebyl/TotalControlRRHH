import { StrictMode, Component, type ReactNode, type ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F6F8FB", fontFamily: "sans-serif" }}>
          <div style={{ background: "white", border: "1px solid #FCA5A5", borderRadius: 16, padding: "2rem", maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: "#991B1B", marginBottom: 8 }}>Error inesperado</h2>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
              La aplicación encontró un error. Tus datos en localStorage están intactos.
            </p>
            <pre style={{ background: "#FEF2F2", color: "#DC2626", padding: 12, borderRadius: 8, fontSize: 12, textAlign: "left", marginBottom: 20, overflowX: "auto" }}>
              {(this.state.error as Error).message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 14 }}
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
