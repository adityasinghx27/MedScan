import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("App Loader: Starting initialisation...");

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
        <App />
      </React.StrictMode>
    );
    console.log("App Loader: Render signal sent successfully.");
  } catch (error) {
    console.error("App Loader: CRITICAL ERROR during render:", error);
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: #e11d48; text-align: center; font-family: sans-serif;">
          <h1 style="font-size: 24px; font-weight: bold;">Launch Failed</h1>
          <p style="margin-top: 10px;">The application encountered a technical error during startup.</p>
          <pre style="text-align: left; background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 12px; margin-top: 20px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
          <button onclick="window.location.reload()" style="margin-top: 20px; background: #0d9488; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer;">Retry Launch</button>
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
