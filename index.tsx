import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// 起動時の安全性を確保
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);

  // マウント確認ログ
  console.log("React is mounting...");

  root.render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Failed to mount application:", error);
  // index.htmlのwindow.onerrorがこれをキャッチして表示します
  throw error;
}