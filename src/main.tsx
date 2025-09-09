import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { register } from './serviceWorkerRegistration';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Register service worker for PWA functionality
register({
  onSuccess: (registration) => {
    console.log('PWA successfully registered:', registration);
  },
  onUpdate: (registration) => {
    console.log('New PWA version available:', registration);
  }
});
