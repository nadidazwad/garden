import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './app/App.tsx'

const Overview = import.meta.env.DEV ? lazy(() => import('./dev/Overview.tsx')) : null
const PhoneEditor = import.meta.env.DEV ? lazy(() => import('./dev/PhoneEditor.tsx')) : null
const page = location.pathname

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Overview && page === '/__overview' ? <Overview /> : PhoneEditor && page === '/__overview/phone' ? <PhoneEditor /> : <App />}
  </StrictMode>,
)
