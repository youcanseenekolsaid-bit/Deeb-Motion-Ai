import React, { useMemo } from "react";
import { transform } from "sucrase";
import * as Remotion from "remotion";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: 20, backgroundColor: "black", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: "24px" }}>
          <div>
            <h3 style={{ marginBottom: "10px" }}>Runtime Error</h3>
            <p style={{ fontSize: "16px", opacity: 0.8 }}>{this.state.error?.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const DynamicVideo: React.FC<{ code: string }> = ({ code }) => {
  const Component = useMemo(() => {
    if (!code) return null;
    try {
      const compiled = transform(code, {
        transforms: ["typescript", "jsx", "imports"],
        jsxRuntime: "classic",
      }).code;

      const exports: any = {};
      const require = (moduleName: string) => {
        if (moduleName === "react") return React;
        if (moduleName === "remotion") return Remotion;
        throw new Error(`Module ${moduleName} not found`);
      };

      const executeCode = new Function("exports", "require", "React", compiled);
      executeCode(exports, require, React);

      const Component = exports.default || (() => <div style={{ color: "white" }}>No default export found</div>);
      Component.displayName = "GeneratedVideo";
      
      const SafeComponent = (props: any) => (
        <ErrorBoundary>
          <Component {...props} />
        </ErrorBoundary>
      );
      SafeComponent.displayName = "SafeGeneratedVideo";
      return SafeComponent;
    } catch (err: any) {
      console.error("Compilation error:", err);
      const ErrorComponent = () => (
        <div style={{ color: "red", padding: 20, backgroundColor: "black", width: "100%", height: "100%" }}>
          Error compiling video code: {err.message}
        </div>
      );
      ErrorComponent.displayName = "ErrorComponent";
      return ErrorComponent;
    }
  }, [code]);

  if (!Component) return null;

  return <Component />;
};
