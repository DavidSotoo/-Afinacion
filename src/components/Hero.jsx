import React from 'react';
import { motion } from 'framer-motion';

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

export default function Hero({ totalRecords, uniqueModels, brands }) {
  return (
    <>
      <motion.section 
        className="hero" 
        aria-label="Banner Principal"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-banner-wrap" variants={itemVariants}>
          <img 
            src="/Main.jpeg" 
            alt="MÁS AFINACIÓN - Kits exactos para tu auto" 
            className="hero-banner-img"
          />
        </motion.div>

        <motion.div className="hero-stats-bar" aria-label="Estadísticas del catálogo" variants={containerVariants}>
          <motion.div className="stat-item" variants={itemVariants}>
            <div className="stat-num" id="stat-total">{totalRecords}<span>+</span></div>
            <div className="stat-label">Aplicaciones</div>
          </motion.div>
          <motion.div className="stat-item" variants={itemVariants}>
            <div className="stat-num" id="stat-brands">{brands}</div>
            <div className="stat-label">Marcas</div>
          </motion.div>
          <motion.div className="stat-item" variants={itemVariants}>
            <div className="stat-num">5</div>
            <div className="stat-label">Piezas por kit</div>
          </motion.div>
          <motion.div className="stat-item" variants={itemVariants}>
            <div className="stat-num" id="stat-models">{uniqueModels}</div>
            <div className="stat-label">Modelos cubiertos</div>
          </motion.div>
        </motion.div>
      </motion.section>

      <div className="divider" role="separator" />
    </>
  );
}
