import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registrato:', registration.scope);
        
        // Controlla aggiornamenti
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Nuova versione disponibile');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Registrazione SW fallita:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
