import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import { CartProvider } from './context/CartContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const App         = lazy(() => import('./App.jsx'))
const Checkout    = lazy(() => import('./pages/Checkout.jsx'))
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'))

// Fallback loader for Suspense
const LoadingFallback = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
    <div style={{ color: 'var(--primary)', fontFamily: 'var(--mono)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>CARGANDO...</div>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/"          element={<LandingPage />} />
                <Route path="/catalogo"  element={<App />} />
                <Route path="/checkout"  element={<Checkout />} />
                <Route path="/producto/:id" element={<ProductPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
