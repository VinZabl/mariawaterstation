import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { StoreProvider } from './context/StoreContext'

// Apply saved font size immediately to avoid flash
const savedFontSize = localStorage.getItem('admin_font_size') || 'default';
document.documentElement.setAttribute('data-font-size', savedFontSize);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
