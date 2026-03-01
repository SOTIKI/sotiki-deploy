import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App.js'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5_000 } } })
const root = document.getElementById('root')
if (!root) throw new Error('No #root')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #e8e8e8; font-family: -apple-system, sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)