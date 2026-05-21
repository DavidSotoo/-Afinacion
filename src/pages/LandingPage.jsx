import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import { CATALOG_STATS } from '../lib/catalog';
import { STORE_PUBLIC_EMAIL } from '../lib/constants';
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
        <span className="footer-logo">
          <img src="/logo.jpeg" alt="A+ MÁS AFINACIÓN" style={{ height: '24px' }} />
        </span>
        <span className="footer-copy">
          KITS EXACTOS PARA TU AUTO BY RAIO
          <br />
          <a href={`mailto:${STORE_PUBLIC_EMAIL}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9em', marginTop: '4px', display: 'inline-block' }}>
            {STORE_PUBLIC_EMAIL}
          </a>
        </span>
        <span className="footer-right">
          <span className="footer-tag">MX · Jalisco</span>
          <a
            href="/admin"
            className="admin-link"
            aria-label="Acceso administración"
            title="Panel de administración"
          >
            ⚙
          </a>
        </span>
      </footer>
    </>
  );
}
