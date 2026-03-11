
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("App Loader: Starting initialisation...");

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#e11d48', textAlign: 'center', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>App Crashed</h1>
          <p style={{ marginTop: '10px' }}>An error occurred while rendering the app.</p>
          <pre style={{ textAlign: 'left', background: '#f1f5f9', padding: '15px', borderRadius: '8px', fontSize: '12px', marginTop: '20px', overflow: 'auto' }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', background: '#0d9488', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const mountApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("App Loader: FATAL - Could not find root element '#root'");
      return;
    }

    console.log("App Loader: Root element found. Creating React root...");
    const root = ReactDOM.createRoot(rootElement);
    
    console.log("App Loader: Rendering App component...");
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("App Loader: Render signal sent successfully.");
  } catch (error) {
    console.error("App Loader: CRITICAL ERROR during render:", error);
    // index.html global error handler will catch this, but just in case:
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: #e11d48; text-align: center; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; height: 100vh;">
          <h1 style="font-size: 24px; font-weight: bold;">Launch Failed</h1>
          <p style="margin-top: 10px;">React failed to mount.</p>
          <pre style="text-align: left; background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 12px; margin-top: 20px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
          <button onclick="window.location.reload()" style="margin-top: 20px; background: #0d9488; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer;">Retry</button>
        </div>
      `;
    }
  }
};

// Start the mount process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
