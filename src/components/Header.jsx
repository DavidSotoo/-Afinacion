import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { WHATSAPP_NUMBER } from '../lib/constants';

export default function Header() {
  const { totalItems, openCart } = useCart();
  const location = useLocation();

  const handleScrollToStore = (e) => {
    e.preventDefault();
    const storeSec = document.querySelector('.store-section');
    if (storeSec) {
      storeSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // If on landing, redirect to /catalogo first
      window.location.href = '/catalogo#tienda';
    }
  };

  const handleGeneralWhatsapp = () => {
    const text = encodeURIComponent('¡Hola! Me gustaría cotizar unas refacciones y bujías para mi auto.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  return (
    <header className="site-header">
      <Link to="/" className="logo" aria-label="Volver al inicio">
        <img src="/logo.jpeg" alt="A+ MÁS AFINACIÓN" style={{ height: '40px', marginRight: '10px' }} />
      </Link>

      <nav className="header-nav" aria-label="Navegación principal">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Inicio</Link>
        <Link to="/catalogo" className={location.pathname === '/catalogo' ? 'active' : ''}>Catálogo / Buscador</Link>
        <a href="#contacto" onClick={handleScrollToStore}>Ubicación y Horarios</a>
      </nav>

      <div className="header-actions">
        {/* Cart button — opens the drawer */}
        <button
          className="cart-btn"
          onClick={openCart}
          aria-label={`Carrito: ${totalItems} pieza${totalItems !== 1 ? 's' : ''} seleccionada${totalItems !== 1 ? 's' : ''}`}
        >
          <ShoppingCart size={18} />
          {totalItems > 0 && (
            <span className="cart-badge" aria-live="polite">{totalItems}</span>
          )}
        </button>

        <button 
          className="header-badge" 
          onClick={handleGeneralWhatsapp}
          aria-label="Solicitar cotización por WhatsApp"
        >
          <MessageCircle size={14} style={{ marginRight: '6px' }} />
          Contacto
        </button>
      </div>
    </header>
  );
}
