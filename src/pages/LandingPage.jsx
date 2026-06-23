import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import { STORE_PUBLIC_EMAIL, CATALOG_STATS } from '../lib/constants';
import { ArrowRight } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="landing-page">
        <motion.div 
          className="landing-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="landing-banner-wrap" variants={itemVariants}>
            <img 
              src="/Main.webp" 
              alt="MÁS AFINACIÓN - Kits exactos para tu auto" 
              className="landing-banner-img"
            />
          </motion.div>

          <motion.div className="hero-stats-bar" aria-label="Estadísticas del catálogo" variants={containerVariants}>
            <motion.div className="stat-item" variants={itemVariants}>
              <div className="stat-num">{CATALOG_STATS.total}<span>+</span></div>
              <div className="stat-label">Aplicaciones</div>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <div className="stat-num">{CATALOG_STATS.brands}</div>
              <div className="stat-label">Marcas</div>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <div className="stat-num">5</div>
              <div className="stat-label">Piezas por kit</div>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <div className="stat-num">{CATALOG_STATS.models}</div>
              <div className="stat-label">Modelos</div>
            </motion.div>
          </motion.div>

          <motion.div className="landing-action" variants={itemVariants}>
            <button 
              className="btn-enter-catalog"
              onClick={() => navigate('/catalogo')}
              aria-label="Entrar al catálogo de afinación"
            >
              Entrar al Catálogo
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </motion.div>
      </main>

      <footer className="site-footer" aria-label="Pie de página">
        <div className="footer-columns">
          {/* Columna 1: Brand & Trust */}
          <div className="footer-col">
            <img src="/logo.jpeg" alt="A+ MÁS AFINACIÓN" className="footer-logo-img" />
            <p className="footer-about">
              Especialistas en kits de afinación automotriz exactos por marca, modelo y año. Tu auto en manos de expertos.
            </p>
            <div className="footer-payments">
              <span className="payment-badge">VISA</span>
              <span className="payment-badge">MC</span>
              <span className="payment-badge">MERCADOPAGO</span>
              <span className="payment-badge">SSL SECURE</span>
            </div>
          </div>
          
          {/* Columna 2: Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Enlaces Útiles</h4>
            <ul className="footer-links">
              <li><a href="/">Inicio</a></li>
              <li><a href="/catalogo">Catálogo de Kits</a></li>
              <li><a href="/catalogo#tienda">Ubicación y Horarios</a></li>
            </ul>
          </div>
          
          {/* Columna 3: Contact & Warranty */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contacto & Garantía</h4>
            <p className="footer-contact-info">
              Jalisco, México<br/>
              <a href={`mailto:${STORE_PUBLIC_EMAIL}`} className="footer-email-link">{STORE_PUBLIC_EMAIL}</a>
            </p>
            <div className="warranty-badge">
              🛡️ GARANTÍA DE AJUSTE EXACTO 100%
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} +AFINACIÓN · KITS EXACTOS PARA TU AUTO BY RAIO</p>
        </div>
      </footer>
    </>
  );
}
