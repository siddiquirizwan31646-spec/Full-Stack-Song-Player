// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'sonner'
import { UserProvider } from './context/userContext'
import { AuthProvider } from './context/AuthContext'

// AuthProvider must be OUTSIDE UserProvider so UserProvider can
// optionally read from AuthContext if needed, and so both share
// the same localStorage-based auth state on mount.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <App />
        <Toaster richColors position="top-right" />
      </UserProvider>
    </AuthProvider>
  </StrictMode>,
)
