import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initOfflineAutoSync } from './lib/offlineSync.ts';

// Initialize offline background sync handlers
initOfflineAutoSync();

// Register Service Worker for PWA & Background Sync
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => console.log('[PWA] Service Worker registered:', reg.scope),
      (err) => console.warn('[PWA] Service Worker registration failed:', err)
    );
  });
} else if ('serviceWorker' in navigator) {
  // Register in dev/preview environment as well
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('[PWA Dev] SW registration note:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
