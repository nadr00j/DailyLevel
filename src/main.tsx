import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useAuthStore } from '@/stores/useAuthStore'

// Inicializar autenticação antes de renderizar o app
useAuthStore.getState().initialize().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
