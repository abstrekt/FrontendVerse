import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './utils/monacoSetup';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
