import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { totalItems, openCart } = useCart();

  return (
    <header className="site-header">
      <a href="#" className="logo">
        <img src="/logo.jpeg" alt="A+ MÁS AFINACIÓN" style={{ height: '40px', marginRight: '10px' }} />
      </a>

      <nav className="header-nav" aria-label="Navegación principal">
        <a href="#" className="active">Catálogo</a>
        <a href="#">Marcas</a>
        <a href="#">Técnico</a>
        <a href="#">Contacto</a>
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

        <button className="header-badge" aria-label="Solicitar cotización">
          Cotizar Ahora
        </button>
      </div>
    </header>
  );
}
