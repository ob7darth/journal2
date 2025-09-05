import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// Add debug logging
console.log('🔄 main.tsx loaded');
console.log('🔄 Environment variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

const rootElement = document.getElementById('root');
console.log('🔄 Root element found:', !!rootElement);

if (!rootElement) {
  console.error('🚨 Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found</div>';
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('🔄 React root created successfully');
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    console.log('🔄 App rendered successfully');
  } catch (error) {
    console.error('🚨 Error rendering app:', error);
    document.body.innerHTML = `<div style="padding: 20px; color: red;">Error rendering app: ${error}</div>`;
  }
}