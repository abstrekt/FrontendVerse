import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AnnouncerProvider } from './hooks/useAnnouncer';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AnnouncerProvider>
        <App />
      </AnnouncerProvider>
    </ErrorBoundary>
  </StrictMode>,
);
