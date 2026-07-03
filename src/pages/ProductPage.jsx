import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ShoppingBag, 
  Zap, 
  Filter, 
  Droplet, 
  Wind, 
  Fuel, 
  AirVent, 
  CheckCircle, 
  ChevronRight, 
  ArrowLeft, 
  ShieldAlert, 
  Clock, 
  RotateCcw, 
  CreditCard 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import YMMSearch from '../components/YMMSearch';
import { API_BASE } from '../lib/config';
import { calculateOilPrice, formatOilName } from '../lib/kitHelpers';
import { MOTOR_OIL_BRANDS } from '../lib/constants';

const filterItems = [
  { key: 'filtro_aceite', name: 'Filtro de Aceite', sub: 'Cartucho / Sellado metálico', img: '/images/filtro_aceite.png' },
  { key: 'filtro_aire', name: 'Filtro de Aire', sub: 'Panel de filtración de motor', img: '/images/filtro_aire.png' },
  { key: 'filtro_gasolina', name: 'Filtro de Gasolina', sub: 'In-tank o de línea metálica', img: '/images/filtro_gasolina.png' },
  { key: 'filtro_cabina', name: 'Filtro de Cabina', sub: 'Polen y purificación de aire acondicionado', img: '/images/filtro_cabina.png' }
];

// SVG Brand Logos (crisp vectors)
const BrandLogos = {
  NGK: () => (
    <svg className="brand-svg-logo" viewBox="0 0 100 40" width="80" height="30" fill="currentColor">
      <rect width="100%" height="100%" fill="#E50020" rx="4" />
      <text x="50" y="26" fontFamily="var(--display)" fontWeight="900" fontSize="22" fill="#FFFFFF" textAnchor="middle">NGK</text>
    </svg>
  ),
  MOBIL: () => (
    <svg className="brand-svg-logo" viewBox="0 0 100 30" width="80" height="24" fill="currentColor">
      <text x="50" y="22" fontFamily="var(--display)" fontWeight="900" fontSize="22" letterSpacing="-1" fill="#0A5EA7" textAnchor="middle">
        M<tspan fill="#E31B23">o</tspan>bil
      </text>
    </svg>
  ),
  CASTROL: () => (
    <svg className="brand-svg-logo" viewBox="0 0 120 30" width="90" height="22" fill="currentColor">
      <path d="M10 25 L35 5 L60 25 Z" fill="#00833E" />
      <path d="M22 25 L40 10 L50 25 Z" fill="#EE3124" />
      <text x="88" y="21" fontFamily="var(--display)" fontWeight="900" fontSize="18" fill="#00833E" textAnchor="middle">Castrol</text>
    </svg>
  ),
  INTERFIL: () => (
    <svg className="brand-svg-logo" viewBox="0 0 100 30" width="95" height="24" fill="currentColor">
      <text x="50" y="22" fontFamily="var(--display)" fontWeight="800" fontSize="18" letterSpacing="1" fill="#000" textAnchor="middle">
        INTER<tspan fill="var(--primary)">FIL</tspan>
      </text>
    </svg>
  )
};

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addKit, items, openCart } = useCart();

  // ── States ────────────────────────────────────────────────────────────────
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Variant selector states
  const [selectedLine, setSelectedLine] = useState('iridium');
  const [aceiteSelected, setAceiteSelected] = useState(null);
  const [justAdded, setJustAdded] = useState(false);



  // ── Fetch Kit Data ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/kits/${id}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('404');
          throw new Error('Error al conectar con la base de datos.');
        }
        return res.json();
      })
      .then(data => {
        setKit(data);
        
        // Pick default spark plug line
        const lines = ['iridium', 'platino', 'vpower', 'stock'];
        const defaultLine = lines.find(l => data[`bujia_${l === 'stock' ? 'stock' : l === 'platino' ? 'g_power' : l === 'vpower' ? 'v_power' : 'iridium_ix'}`]?.tipo) || 'stock';
        setSelectedLine(defaultLine);

        // Pick default oil recommendation
        const anio = parseInt(data.anio_inicio, 10) || 2015;
        const cilindros = (data.cilindros_config || '').toUpperCase();
        let viscosidad = anio >= 2016 ? '5W-30' : anio >= 2010 ? '10W-30' : '20W-50';
        let tecnologia = anio >= 2010 ? 'Semisintético' : 'Mineral';
        let litros = cilindros.includes('8') ? 6 : cilindros.includes('6') ? 5 : 4;
        let pres = litros === 5 ? 'Garrafa (5 Litros)' : litros > 5 ? `Garrafa (4L) + ${litros - 4} Botella(s) (1L)` : 'Garrafa (4 Litros)';
        
        setAceiteSelected({
          marca: 'Mobil Super',
          viscosidad,
          tecnologia,
          litros,
          presentacion: pres
        });

        // Small delay to let loader animation display sutilly
        setTimeout(() => {
          setLoading(false);
        }, 800);
      })
      .catch(err => {
        console.error(err);
        setError(err.message === '404' ? '404' : 'Error al cargar los datos del kit.');
        setLoading(false);
      });
  }, [id]);

  // ── Variant selectors helpers ─────────────────────────────────────────────
  const availableLines = useMemo(() => {
    if (!kit) return [];
    const lines = [];
    if (kit.bujia_stock?.tipo) lines.push({ key: 'stock', label: 'Stock / OEM' });
    if (kit.bujia_v_power?.tipo) lines.push({ key: 'vpower', label: 'V-Power' });
    if (kit.bujia_g_power?.tipo) lines.push({ key: 'platino', label: 'G-Power Platino' });
    if (kit.bujia_iridium_ix?.tipo) lines.push({ key: 'iridium', label: 'Iridium IX' });
    return lines;
  }, [kit]);

  const activeBujia = useMemo(() => {
    if (!kit) return null;
    const fieldMap = {
      stock: 'bujia_stock',
      vpower: 'bujia_v_power',
      platino: 'bujia_g_power',
      iridium: 'bujia_iridium_ix'
    };
    return kit[fieldMap[selectedLine]];
  }, [kit, selectedLine]);

  // ── Dynamic Pricing ────────────────────────────────────────────────────────
  const totalCost = useMemo(() => {
    if (!kit || !kit.kit_afinacion) return 0;
    const filtersCost = kit.kit_afinacion.costo_total ?? 340;
    
    let plugsCost = 0;
    if (kit.kit_afinacion.bujias) {
      const bujiasPriceObj = kit.kit_afinacion.bujias[selectedLine];
      plugsCost = bujiasPriceObj?.precio_total ?? 200;
    }
    
    const oilCost = aceiteSelected ? calculateOilPrice(kit.anio_inicio, aceiteSelected.tecnologia, aceiteSelected.litros) : 0;
    return filtersCost + plugsCost + oilCost;
  }, [kit, selectedLine, aceiteSelected]);

  // ── Cart Handlers ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!kit) return;
    addKit(kit, selectedLine, [], aceiteSelected);
    setJustAdded(true);
    openCart();
    setTimeout(() => setJustAdded(false), 2500);
  };

  const isKitInCart = useMemo(() => {
    if (!kit) return false;
    const cartId = `kit-${kit.id}-${selectedLine}`;
    return items.some(i => i.id === cartId);
  }, [items, kit, selectedLine]);

  // ── Redirect search helper (for 404 search) ──────────────────────────────
  const handleRedirectSearch = (params) => {
    const query = new URLSearchParams();
    if (params.marca) query.append('marca', params.marca);
    if (params.modelo) query.append('modelo', params.modelo);
    if (params.anio) query.append('anio', params.anio);
    navigate(`/catalogo?${query.toString()}`);
  };

  // ── Render States ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Header />
        <main className="product-page-loading">
          <div className="technical-loader-container" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div className="car-loader-animation">
              <svg viewBox="0 0 200 80" width="160" height="64" fill="none" stroke="currentColor">
                {/* Sleek sports car body line */}
                <path
                  d="M 35 60 A 12 12 0 0 1 59 60 L 141 60 A 12 12 0 0 1 165 60 L 185 60 C 190 60 192 57 190 52 L 182 45 L 155 42 C 148 42 143 38 140 33 L 125 18 C 122 14 117 12 112 12 L 75 12 C 70 12 66 14 63 18 L 48 35 C 45 42 38 45 35 45 L 20 45 C 15 45 12 47 15 52 Z"
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.35"
                />
                
                {/* Back spinning wheel */}
                <g className="spinning-wheel" style={{ transformOrigin: '47px 60px' }}>
                  <circle cx="47" cy="60" r="10" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
                  <circle cx="47" cy="60" r="3" stroke="var(--primary)" strokeWidth="1" fill="none" />
                  <line x1="47" y1="50" x2="47" y2="70" stroke="var(--primary)" strokeWidth="1" />
                  <line x1="37" y1="60" x2="57" y2="60" stroke="var(--primary)" strokeWidth="1" />
                </g>

                {/* Front spinning wheel */}
                <g className="spinning-wheel" style={{ transformOrigin: '153px 60px' }}>
                  <circle cx="153" cy="60" r="10" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
                  <circle cx="153" cy="60" r="3" stroke="var(--primary)" strokeWidth="1" fill="none" />
                  <line x1="153" y1="50" x2="153" y2="70" stroke="var(--primary)" strokeWidth="1" />
                  <line x1="143" y1="60" x2="163" y2="60" stroke="var(--primary)" strokeWidth="1" />
                </g>

                {/* Dotted scanning road line */}
                <line x1="10" y1="72" x2="190" y2="72" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
              </svg>
            </div>
            
            <div className="loader-text-block">
              <h2 className="technical-loader-title" style={{ fontSize: '1.15rem', color: 'var(--text)' }}>
                VERIFICANDO COMPATIBILIDAD...
              </h2>
              <p className="technical-loader-subtitle" style={{ fontSize: '0.72rem', color: 'var(--primary)' }}>
                Buscando especificaciones YMM exactas
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !kit) {
    return (
      <>
        <Header />
        <main className="product-page-error">
          <div className="error-card">
            <ShieldAlert size={56} className="error-icon" />
            <h2 className="error-title">
              {error === '404' ? 'Kits de Afinación no encontrados' : 'Error de Conexión'}
            </h2>
            <p className="error-description">
              {error === '404' 
                ? 'No encontramos un kit compatible con el ID especificado en la base de datos.' 
                : 'Hubo un error al recuperar la información del kit. Inténtalo más tarde.'}
            </p>
            <div className="error-search-box">
              <h3 className="error-search-title">// BUSCAR OTRO VEHÍCULO</h3>
              <YMMSearch onSearch={handleRedirectSearch} onReset={() => {}} />
            </div>
            <Link to="/catalogo" className="error-back-link">
              <ArrowLeft size={16} /> Volver al Catálogo General
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ── Real Data Render ──────────────────────────────────────────────────────
  const vehicleLabel = `${kit.marca} ${kit.modelo}`;
  const motorConfig = `${kit.litros}L ${kit.cilindros_config || 'N/A'}${kit.motor && kit.motor !== '-' ? ` (${kit.motor})` : ''}`;
  const yearsLabel = `${kit.anio_inicio}–${kit.anio_fin}`;

  return (
    <>
      <Helmet>
        <title>{`Kit de Afinación Exacto — ${vehicleLabel} (${yearsLabel}) | +AFINACIÓN`}</title>
        <meta name="description" content={`Adquiere el kit de afinación exacto garantizado para tu ${vehicleLabel} (${yearsLabel}) motor ${motorConfig}. Incluye bujías NGK ${availableLines.map(l => l.label).join(', ')} y filtros premium.`} />
      </Helmet>

      <Header />
      <CartDrawer />

      <main className="product-page-detail">
        {/* Navigation Breadcrumb & Vehicle Change */}
        <div className="product-nav-bar">
          <Link to="/catalogo" className="breadcrumb-back">
            <ArrowLeft size={16} /> Volver a Catálogo
          </Link>
          <div className="breadcrumb-change">
            <span>Vehículo Confirmado ✓</span>
            <Link to="/catalogo" className="btn-change-vehicle">¿No es tu vehículo? Cambiar</Link>
          </div>
        </div>

        {/* Product Page Main Grid */}
        <div className="product-grid">
          
          {/* LEFT COLUMN: Technical specs & breakdown */}
          <div className="product-main-content">
            
            {/* Header of product */}
            <header className="product-detail-header">
              <span className="confirmed-pill">COMPATIBILIDAD CONFIRMADA ✓</span>
              <h1 className="product-title">Kit de Afinación — {vehicleLabel} {yearsLabel}</h1>
              <p className="product-subtitle">Especificaciones de motor: {motorConfig} · Aspiración {kit.aspiracion === 'T' ? 'Turbo 🌀' : kit.aspiracion === 'SC' ? 'Supercargado ⬡' : 'Natural'}</p>
            </header>

            {/* Desglose del kit (Breakdown Table) */}
            <section className="product-section breakdown-section">
              <h3 className="section-title">// COMPONENTES INCLUIDOS EN EL KIT</h3>
              <p className="section-subtitle">Cada componente ha sido verificado según el número de parte oficial de fábrica.</p>
              
              <div className="table-responsive">
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Refacción</th>
                      <th>Marca</th>
                      <th>Número de Parte (SKU)</th>
                      <th className="text-right">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 1. Spark Plugs */}
                    {activeBujia?.tipo && (
                      <tr>
                        <td>
                          <div className="part-meta">
                            <img src="/images/bujia_ngk.png" alt="Bujía NGK" className="part-thumbnail" />
                            <div>
                              <span className="part-name">Bujías de Motor</span>
                              <span className="part-sub">Línea NGK {selectedLine.toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="brand-logo-wrap"><BrandLogos.NGK /></div>
                        </td>
                        <td className="font-mono part-sku">{activeBujia.tipo} {activeBujia.codigo ? `#${activeBujia.codigo}` : ''}</td>
                        <td className="text-right font-mono font-bold">{((kit.cilindros_config || '').match(/\d+/) || [4])[0]} pzas</td>
                      </tr>
                    )}

                    {/* 2 to 5. Filters (Always show 4 rows with fallbacks) */}
                    {filterItems.map(item => {
                      const filterData = kit.kit_afinacion?.[item.key];
                      const isSellado = filterData?.sku === 'SELLADO';
                      
                      let brandText = 'Premium';
                      let showInterfilLogo = false;
                      let showOemLabel = false;
                      
                      if (filterData) {
                        if (isSellado) {
                          showOemLabel = true;
                        } else if (filterData.marca?.toUpperCase() === 'INTERFIL') {
                          showInterfilLogo = true;
                        } else if (filterData.marca) {
                          brandText = filterData.marca;
                        }
                      }

                      let skuText = 'N/D';
                      let qtyText = '1 pza';
                      
                      if (isSellado) {
                        skuText = item.key === 'filtro_gasolina' ? 'Filtro Sellado (No requiere)' : 'No requiere';
                        qtyText = item.key === 'filtro_gasolina' ? '0 pzas' : '1 pza';
                      } else if (filterData?.sku) {
                        skuText = filterData.sku;
                      } else {
                        skuText = 'Código en verificación · Cotizar';
                      }

                      return (
                        <tr key={item.key}>
                          <td>
                            <div className="part-meta">
                              <img src={item.img} alt={item.name} className="part-thumbnail" />
                              <div>
                                <span className="part-name">{item.name}</span>
                                <span className="part-sub">{item.sub}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="brand-logo-wrap">
                              {showOemLabel ? (
                                <span className="fallback-brand-text">OEM</span>
                              ) : showInterfilLogo ? (
                                <BrandLogos.INTERFIL />
                              ) : (
                                <span className="fallback-brand-text">{brandText}</span>
                              )}
                            </div>
                          </td>
                          <td className="font-mono part-sku">
                            {skuText}
                          </td>
                          <td className="text-right font-mono font-bold">{qtyText}</td>
                        </tr>
                      );
                    })}

                    {/* 6. Motor Oil */}
                    {aceiteSelected && (
                      <tr>
                        <td>
                          <div className="part-meta">
                            <img src="/images/aceite_motor.png" alt="Aceite Motor" className="part-thumbnail" />
                            <div>
                              <span className="part-name">Aceite de Motor Surtido</span>
                              <span className="part-sub">{aceiteSelected.presentacion}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="brand-logo-wrap">
                            {aceiteSelected.marca.toUpperCase().includes('MOBIL') ? <BrandLogos.MOBIL /> : aceiteSelected.marca.toUpperCase().includes('CASTROL') ? <BrandLogos.CASTROL /> : <span className="fallback-brand-text">{aceiteSelected.marca}</span>}
                          </div>
                        </td>
                        <td className="font-mono part-sku">{formatOilName(aceiteSelected.tecnologia, aceiteSelected.viscosidad)}</td>
                        <td className="text-right font-mono font-bold">{aceiteSelected.litros} L</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Compatibilidad Confirmada (Technical Grid Check) */}
            <section className="product-section technical-check-section">
              <h3 className="section-title">// COMPATIBILIDAD TÉCNICA CERTIFICADA</h3>
              <div className="tech-check-grid">
                <div className="tech-check-item">
                  <span className="tech-label">Marca/Modelo:</span>
                  <span className="tech-value">{kit.marca} {kit.modelo}</span>
                </div>
                <div className="tech-check-item">
                  <span className="tech-label">Rango de Años:</span>
                  <span className="tech-value">{yearsLabel}</span>
                </div>
                <div className="tech-check-item">
                  <span className="tech-label">Cilindrada/Motor:</span>
                  <span className="tech-value">{kit.litros}L {kit.cilindros_config || 'N/A'}</span>
                </div>
                {kit.motor && kit.motor !== '-' && (
                  <div className="tech-check-item">
                    <span className="tech-label">Código de Motor:</span>
                    <span className="tech-value font-mono">{kit.motor}</span>
                  </div>
                )}
                {kit.calibracion_mm && (
                  <div className="tech-check-item">
                    <span className="tech-label">Calibración Bujías:</span>
                    <span className="tech-value font-mono">{kit.calibracion_mm} mm</span>
                  </div>
                )}
              </div>
              <div className="tech-guarantee-alert">
                <CheckCircle size={20} className="text-primary" />
                <span>Garantía de Compatibilidad Ajuste Exacto 100%. Si ordenas este kit y no le queda a tu vehículo tal como se describe, la devolución es totalmente gratuita.</span>
              </div>
            </section>

            {/* Respaldo de marca */}
            <section className="product-section brands-backup-section">
              <h3 className="section-title">// RESPALDO DE MARCAS DE EQUIPO ORIGINAL</h3>
              <p className="section-subtitle">Este kit integra componentes con certificaciones de equipo original. Garantías válidas directamente con los fabricantes.</p>
              
              <div className="brands-logos-grid">
                <div className="brand-card">
                  <BrandLogos.NGK />
                  <p className="brand-description">NGK Spark Plugs Co: Líder mundial en bujías. Encendido instantáneo, mayor rendimiento de combustible y reducción de emisiones.</p>
                </div>
                <div className="brand-card">
                  <BrandLogos.INTERFIL />
                  <p className="brand-description">Interfil Filtros: Filtración automotriz premium. Retención superior de impurezas que protege la vida útil de los componentes internos del motor.</p>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Sticky Sidebar purchase details & variant customizer */}
          <div className="product-sidebar">
            <div className="sticky-sidebar-content">
              
              <div className="sidebar-header-mobile-only">
                <span className="sidebar-mobile-title">{vehicleLabel}</span>
                <span className="sidebar-mobile-motor">{motorConfig}</span>
              </div>

              {/* Selector de variantes: Bujías */}
              <div className="sidebar-customizer-block">
                <label className="customizer-label">Línea de Bujías NGK</label>
                <div className="customizer-plugs-group">
                  {availableLines.map(line => (
                    <button
                      key={line.key}
                      className={`btn-plug-select ${selectedLine === line.key ? 'active' : ''}`}
                      onClick={() => setSelectedLine(line.key)}
                    >
                      <span className="bullet" />
                      <span>{line.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de variantes: Aceite */}
              {aceiteSelected && (
                <div className="sidebar-customizer-block">
                  <label className="customizer-label">Personalización de Aceite</label>
                  
                  <div className="customizer-oil-row">
                    <div className="form-group-custom">
                      <label>Marca</label>
                      <select
                        value={aceiteSelected.marca}
                        onChange={(e) => setAceiteSelected(prev => ({ ...prev, marca: e.target.value }))}
                      >
                        {MOTOR_OIL_BRANDS.map(brand => (
                          <option key={brand.id} value={brand.label}>{brand.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group-custom">
                      <label>Viscosidad</label>
                      <select
                        value={aceiteSelected.viscosidad}
                        onChange={(e) => setAceiteSelected(prev => ({ ...prev, viscosidad: e.target.value }))}
                      >
                        <option value="5W-30">5W-30</option>
                        <option value="10W-30">10W-30</option>
                        <option value="10W-40">10W-40</option>
                        <option value="20W-50">20W-50</option>
                      </select>
                    </div>
                  </div>

                  <div className="customizer-oil-row" style={{ marginTop: '0.75rem' }}>
                    <div className="form-group-custom">
                      <label>Tecnología</label>
                      <select
                        value={aceiteSelected.tecnologia}
                        onChange={(e) => {
                          const tech = e.target.value;
                          let visc = aceiteSelected.viscosidad;
                          if (tech === 'Sintético') visc = '5W-30';
                          else if (tech === 'Mineral') visc = '20W-50';
                          setAceiteSelected(prev => ({ ...prev, tecnologia: tech, viscosidad: visc }));
                        }}
                      >
                        <option value="Sintético">Sintético</option>
                        <option value="Semisintético">Semi-Sintético</option>
                        <option value="Mineral">Multigrado</option>
                      </select>
                    </div>

                    <div className="form-group-custom">
                      <label>Litros</label>
                      <select
                        value={aceiteSelected.litros}
                        onChange={(e) => {
                          const l = parseInt(e.target.value, 10);
                          let pres = l === 5 ? 'Garrafa (5 Litros)' : l > 5 ? `Garrafa (4L) + ${l - 4} Botella(s) (1L)` : 'Garrafa (4 Litros)';
                          setAceiteSelected(prev => ({ ...prev, litros: l, presentacion: pres }));
                        }}
                      >
                        <option value={4}>4 Litros</option>
                        <option value={5}>5 Litros</option>
                        <option value={6}>6 Litros</option>
                        <option value={7}>7 Litros</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Price & CTA (Sticky Container) */}
              <div className="price-checkout-container">
                <div className="availability-tag">
                  <span className="availability-dot" />
                  <span>En Stock: 8 unidades · Envío inmediato</span>
                </div>
                
                <div className="price-row-display">
                  <span className="price-label">PRECIO DEL KIT CONFIGURADO:</span>
                  <div className="price-number-wrap font-mono">
                    <span className="price-currency">MXN</span>
                    <span className="price-value">
                      ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button
                  className={`btn-purchase-cta ${isKitInCart || justAdded ? 'added' : ''}`}
                  onClick={handleAddToCart}
                  disabled={isKitInCart}
                >
                  <ShoppingBag size={20} />
                  <span>
                    {justAdded
                      ? '¡Kit Agregado! ✓'
                      : isKitInCart
                      ? 'Kit en Carrito ✓'
                      : 'Agregar Kit Completo al Carrito'}
                  </span>
                </button>
              </div>

              {/* Trust Bar (Just below CTA) */}
              <div className="trust-bar-sidebar">
                <div className="trust-item">
                  <ShieldAlert size={16} className="trust-icon" />
                  <div>
                    <strong>Ajuste Exacto Garantizado:</strong>
                    <span>100% compatible con {vehicleLabel}.</span>
                  </div>
                </div>
                <div className="trust-item">
                  <Clock size={16} className="trust-icon" />
                  <div>
                    <strong>Entrega Estimada:</strong>
                    <span>Local en ZMG gratis (24h) o nacional (48h).</span>
                  </div>
                </div>
                <div className="trust-item">
                  <CreditCard size={16} className="trust-icon" />
                  <div>
                    <strong>Pagos Seguros:</strong>
                    <span>Tarjetas, SPEI o Efectivo en Sucursal.</span>
                  </div>
                </div>
                <div className="trust-item">
                  <RotateCcw size={16} className="trust-icon" />
                  <div>
                    <strong>Devoluciones Sencillas:</strong>
                    <span>30 días de garantía sin preguntas.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}
