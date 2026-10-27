import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Limpeza de service workers residuais de outros projetos no localhost:5173
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
