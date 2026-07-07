import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrivyProvider
      appId="cmr9y0qq800wa0cl5bq8og3tf"
      config={{
        loginMethods: ['wallet', 'email', 'google'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>,
)
