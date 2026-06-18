import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import {
  MapPin,
  CreditCard,
  Truck,
  Check,
  MessageCircle,
  ShoppingBag,
  Zap,
  Filter,
  Droplet,
  Wind,
  Fuel,
  AirVent,
  ArrowLeft,
  ChevronRight,
  Package,
  Wrench,
  Copy,
} from 'lucide-react';
import {
  WHATSAPP_NUMBER,
  NGK_LINE_LABELS,
  DELIVERY_OPTIONS,
  PAYMENT_METHODS,
  STORE_PUBLIC_EMAIL,
} from '../lib/constants';
import { formatOilName } from '../lib/kitHelpers';
import { API_BASE } from '../lib/config';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const SKU_FIELD = {
  iridium: 'bujia_iridium_ix',
  platino: 'bujia_g_power',
  vpower:  'bujia_v_power',
  stock:   'bujia_stock',
};

const getSkuData = (bujia, tipoLinea) => bujia[SKU_FIELD[tipoLinea]] ?? null;

const capitalizeWords = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const SERVICES_OPTIONS = [
  {
    id: 'ninguno',
    label: 'Sin Instalación',
    cost: 0,
    icon: '🚗',
    desc: 'Solo entrega/envío de tus refacciones'
  },
  {
    id: 'basico',
    label: 'Servicio Básico',
    cost: 200,
    icon: '🔧',
    desc: 'Cambio de aceite y filtro de aceite (+$200.00)'
  },
  {
    id: 'medio',
    label: 'Servicio Medio',
    cost: 400,
    icon: '🛠️',
    desc: 'Cambio de aceite, filtro de aceite, filtro de aire y filtro de cabina (+$400.00)'
  },
  {
    id: 'completo',
    label: 'Servicio Completo',
    cost: 600,
    icon: '💎',
    desc: 'Cambio de aceite, filtro de aceite, filtro de aire, filtro de cabina y bujías (+$600.00)'
  }
];

const detectCardBrand = (number) => {
  const cleanNumber = number.replace(/\D/g, '');
  if (cleanNumber.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  return 'unknown';
};

/* ─── WhatsApp message builder ────────────────────────────────────────────── */

function buildConsolidatedMessage(items, deliveryOpt, paymentOpt, shipping, grandTotal, folio = null, servicioTaller = 'ninguno', paymentDetails = {}, datosEnvio = null) {
  const kits   = items.filter(i => i.type === 'kit');
  const piezas = items.filter(i => i.type === 'pieza');
  const filtrosSueltos = items.filter(i => i.type === 'filtro');
  const lines  = [];

  if (folio) {
    lines.push(`📋 *FOLIO DE COTIZACIÓN: #${folio}*`, ``);
  }

  // ── Kits ──────────────────────────────────────────────────────────────────
  if (kits.length > 0) {
    kits.forEach((item) => {
      const { bujia, tipoLinea, kit_afinacion, excludedParts = [], aceite_motor } = item;
      const label      = NGK_LINE_LABELS[tipoLinea] || tipoLinea;
      const skuData    = getSkuData(bujia, tipoLinea);
      const anios      = `${bujia.anio_inicio}–${bujia.anio_fin}`;
      const motor      = `${bujia.litros}L ${bujia.cilindros_config}${bujia.motor ? ` (${bujia.motor})` : ''}`;
      const isExcluded = (key) => excludedParts.includes(key);
      const kit = bujia.kit_afinacion || {};
      
      const getFilterMsg = (num, key, labelTxt) => {
        if (isExcluded(key)) return `~${num} *Filtro de ${labelTxt}:* (❌ Removido por el cliente)~`;
        const f = kit[key];
        if (f?.sku === 'SELLADO') return `${num} *Filtro de ${labelTxt}:* Sellado (No requiere cambio)`;
        if (f?.sku) return `${num} *Filtro de ${labelTxt}:* ${f.marca ? f.marca + ' ' : ''}${f.sku}`;
        return `${num} *Filtro de ${labelTxt}:* (Solicitado para este motor)`;
      };

      const oilMsg = aceite_motor
        ? (isExcluded('aceite_motor')
          ? `~6️⃣ *Aceite de Motor:* (❌ Removido por el cliente)~`
          : `6️⃣ *Aceite de Motor:* ${formatOilName(aceite_motor.tecnologia, aceite_motor.viscosidad)} (${aceite_motor.presentacion})`)
        : null;

      lines.push(
        `🔧 *Pedido de Kit de Afinación - +AFINACIÓN*`,
        ``,
        `🚗 *Vehículo:* ${bujia.marca} ${bujia.modelo} ${anios} ${motor}`,
        `-----------------------------------------`,
        isExcluded('bujias') ? `~1️⃣ *Bujías NGK:* (❌ Removido por el cliente)~` : `1️⃣ *Bujías NGK:* ${label} (SKU: ${skuData?.tipo ?? 'N/D'})`,
        getFilterMsg('2️⃣', 'filtro_aceite', 'Aceite'),
        getFilterMsg('3️⃣', 'filtro_aire', 'Aire'),
        getFilterMsg('4️⃣', 'filtro_gasolina', 'Gasolina'),
        getFilterMsg('5️⃣', 'filtro_cabina', 'Cabina'),
      );

      if (oilMsg) {
        lines.push(oilMsg);
      }
      lines.push(``);
    });
  }

  // ── Piezas individuales ────────────────────────────────────────────────────
  if (piezas.length > 0) {
    lines.push(`*── BUJÍAS INDIVIDUALES ──*`, ``);
    piezas.forEach((item, idx) => {
      const { bujia, tipoLinea } = item;
      const label   = NGK_LINE_LABELS[tipoLinea] || tipoLinea;
      const skuData = getSkuData(bujia, tipoLinea);
      lines.push(
        `*${idx + 1}. ${bujia.marca} ${bujia.modelo}*`,
        `   📅 ${bujia.anio_inicio}–${bujia.anio_fin} · ${bujia.litros}L ${bujia.cilindros_config}`,
        `   ✨ ${label} — ${skuData?.tipo ?? 'N/D'} | Código: ${skuData?.codigo ?? 'N/D'}`,
        `   📐 Calibración: ${bujia.calibracion_mm}mm`,
        ``,
      );
    });
  }

  // ── Filtros individuales ───────────────────────────────────────────────────
  if (filtrosSueltos.length > 0) {
    lines.push(`*── FILTROS INDIVIDUALES ──*`, ``);
    filtrosSueltos.forEach((item, idx) => {
      const { bujia, filterKey } = item;
      const f = bujia.kit_afinacion?.[filterKey];
      const labelTxt = filterKey === 'filtro_aceite' ? 'Aceite' : filterKey === 'filtro_aire' ? 'Aire' : filterKey === 'filtro_gasolina' ? 'Gasolina' : 'Cabina';
      lines.push(
        `*${idx + 1}. ${bujia.marca} ${bujia.modelo}*`,
        `   📅 ${bujia.anio_inicio}–${bujia.anio_fin} · ${bujia.litros}L ${bujia.cilindros_config}`,
        `   📦 Filtro de ${labelTxt}: ${f?.marca ? f.marca + ' ' : ''}${f?.sku && f.sku !== 'SELLADO' ? f.sku : 'Solicitado para este motor'}`,
        ``,
      );
    });
  }

  const serviceNames = { basico: 'Básico', medio: 'Medio', completo: 'Completo' };

  let pagoMsg = `💵 *Método de Pago:* ${paymentOpt?.icon || '💳'} ${paymentOpt?.label || 'N/D'}`;
  if (paymentOpt?.id === 'tarjeta' && paymentDetails.last4) {
    const brandName = paymentDetails.brand === 'visa' ? 'Visa' : paymentDetails.brand === 'mastercard' ? 'Mastercard' : paymentDetails.brand === 'amex' ? 'American Express' : 'Tarjeta';
    pagoMsg += ` (Pago en Línea con ${brandName} terminada en •••• ${paymentDetails.last4})`;
  } else if (paymentOpt?.id === 'efectivo' && paymentDetails.cashPaidWith) {
    pagoMsg += ` (Paga con: $${paymentDetails.cashPaidWith.toLocaleString('es-MX')} · Cambio: $${paymentDetails.changeAmount.toLocaleString('es-MX')})`;
  } else if (paymentOpt?.id === 'transferencia') {
    pagoMsg += ` (Se solicita CLABE para transferencia)`;
  } else if (paymentOpt?.id === 'deposito') {
    pagoMsg += ` (Se solicita número de tarjeta para depósito)`;
  }

  lines.push(
    `-----------------------------------------`,
    `📍 *Método de Entrega:* ${deliveryOpt?.icon || '🚚'} ${deliveryOpt?.label || 'N/D'}`,
    pagoMsg,
    servicioTaller !== 'ninguno' ? `🛠️ *Servicio en Taller:* Deseo agendar Servicio ${serviceNames[servicioTaller]} de instalación en sucursal Oblatos` : '',
    `🚚 *Envío:* ${shipping?.isFree ? '¡GRATIS!' : `$${shipping?.cost || 0}`}`,
    `💰 *Total Estimado:* $${grandTotal?.toLocaleString('es-MX') || 0}`
  );

  if (datosEnvio && (deliveryOpt?.id === 'zmg' || deliveryOpt?.id === 'foraneo')) {
    lines.push(
      ``,
      `📍 *DATOS DE ENVÍO:*`,
      `Recibe: ${datosEnvio.nombreRecibe}`,
      `Tel: ${datosEnvio.telefono}`,
      `Dirección: ${datosEnvio.calleNumero}, Col. ${datosEnvio.colonia}, ${datosEnvio.municipio}, C.P. ${datosEnvio.codigoPostal}`,
      `Referencias: ${datosEnvio.referencias || 'Ninguna'}`
    );
  } else if (deliveryOpt?.id === 'local') {
    lines.push(
      ``,
      `🏠 *El cliente pasará a recoger a la sucursal*`
    );
  }

  lines.push(
    ``,
    `Por favor, confirmen disponibilidad y precio. ¡Gracias!`
  );

  return lines.filter(line => line !== '').join('\n');
}

/* ─── Checkout Page Component ─────────────────────────────────────────────── */

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('status');
  const paymentFolio = searchParams.get('folio');

  const { items, subtotal, computeShipping, clearCart, servicioTaller, setServicioTaller } = useCart();

  const [selectedDelivery, setSelectedDelivery] = useState('local');
  const [selectedPayment, setSelectedPayment] = useState('tarjeta');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [datosEnvio, setDatosEnvio] = useState({
    nombreRecibe: '',
    telefono: '',
    calleNumero: '',
    colonia: '',
    codigoPostal: '',
    municipio: '',
    estado: '',
    referencias: ''
  });

  // States for payment methods
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cashPaidWith, setCashPaidWith] = useState('');
  const [copiedStatus, setCopiedStatus] = useState(null); // 'clabe' | 'tarjeta' | null

  useEffect(() => {
    if (paymentStatus === 'approved') {
      clearCart();
    } else if (paymentStatus === 'rejected') {
      setErrorMsg(`El pago de tu cotización #${paymentFolio} fue rechazado o cancelado. Por favor, intenta de nuevo.`);
    } else if (paymentStatus === 'pending') {
      setErrorMsg(`El pago de tu cotización #${paymentFolio} está pendiente. Te confirmaremos en cuanto Mercado Pago lo procese.`);
    }
  }, [paymentStatus, paymentFolio, clearCart]);

  const handleCopy = (text, type) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedStatus(type);
      setTimeout(() => {
        setCopiedStatus(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length > 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  const handleCardCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    const maxLen = detectCardBrand(cardNumber) === 'amex' ? 4 : 3;
    if (val.length > maxLen) val = val.slice(0, maxLen);
    setCardCvv(val);
  };

  const serviceCost = useMemo(() => {
    switch (servicioTaller) {
      case 'basico': return 200;
      case 'medio': return 400;
      case 'completo': return 600;
      default: return 0;
    }
  }, [servicioTaller]);

  // Recalculate shipping based on selected option and subtotal
  const shipping = useMemo(() => computeShipping(selectedDelivery), [computeShipping, selectedDelivery]);
  const grandTotal = subtotal + shipping.cost + serviceCost;

  const changeAmount = useMemo(() => {
    if (!cashPaidWith) return 0;
    const paid = parseFloat(cashPaidWith);
    if (isNaN(paid) || paid < grandTotal) return 0;
    return paid - grandTotal;
  }, [cashPaidWith, grandTotal]);

  // Direct page load check: if cart is empty, redirect back to catalog after short delay
  useEffect(() => {
    if (items.length === 0 && !paymentStatus) {
      const timer = setTimeout(() => {
        navigate('/catalogo');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [items, navigate, paymentStatus]);

  const selectedDeliveryOption = useMemo(() =>
    DELIVERY_OPTIONS.find(o => o.id === selectedDelivery),
    [selectedDelivery]
  );

  const selectedPaymentOption = useMemo(() =>
    PAYMENT_METHODS.find(o => o.id === selectedPayment),
    [selectedPayment]
  );

  const handleConfirmarPedido = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    // Validation for shipping details if selectedDelivery is zmg or foraneo
    if (selectedDelivery === 'zmg' || selectedDelivery === 'foraneo') {
      const { nombreRecibe, telefono, calleNumero, colonia, codigoPostal, municipio, estado } = datosEnvio;
      if (!nombreRecibe.trim() || !telefono.trim() || !calleNumero.trim() || !colonia.trim() || !codigoPostal.trim() || !municipio.trim() || !estado.trim()) {
        setErrorMsg('Por favor, completa todos los campos requeridos (*) del formulario de envío.');
        setIsSubmitting(false);
        return;
      }
      if (nombreRecibe.trim().length < 5 || !nombreRecibe.trim().includes(' ')) {
        setErrorMsg('Por favor, ingresa el nombre y apellido completos de quien recibe (mínimo 5 letras con un espacio).');
        setIsSubmitting(false);
        return;
      }
      if (telefono.replace(/\D/g, '').length !== 10) {
        setErrorMsg('El teléfono de contacto debe tener exactamente 10 dígitos.');
        setIsSubmitting(false);
        return;
      }
      if (!/\d/.test(calleNumero)) {
        setErrorMsg('La calle y número debe incluir al menos un número para indicar el número exterior (ej. Juárez 123).');
        setIsSubmitting(false);
        return;
      }
      const cpNum = parseInt(codigoPostal, 10);
      if (isNaN(cpNum) || cpNum < 1000 || cpNum > 99999 || codigoPostal.replace(/\D/g, '').length !== 5) {
        setErrorMsg('El código postal debe tener exactamente 5 dígitos y estar dentro del rango oficial de México (01000 a 99999).');
        setIsSubmitting(false);
        return;
      }
    }

    // Validation for cash payment
    if (selectedPayment === 'efectivo' && cashPaidWith) {
      const paid = parseFloat(cashPaidWith);
      if (isNaN(paid) || paid < grandTotal) {
        setErrorMsg(`El monto para pagar en efectivo debe ser igual o mayor a $${grandTotal.toLocaleString('es-MX')}`);
        setIsSubmitting(false);
        return;
      }
    }

    const paymentDetails = {
      brand: selectedPayment === 'tarjeta' ? 'Mercado Pago' : 'N/A',
      last4: selectedPayment === 'tarjeta' ? 'ONLINE' : 'N/A',
      cashPaidWith: cashPaidWith ? parseFloat(cashPaidWith) : null,
      changeAmount
    };

    try {
      const primerKit = items.find(i => i.type === 'kit');
      const vehiculo = primerKit
        ? {
            marca: primerKit.bujia.marca,
            modelo: primerKit.bujia.modelo,
            anios: `${primerKit.bujia.anio_inicio}–${primerKit.bujia.anio_fin}`,
            motor: primerKit.bujia.motor || '',
            litros: String(primerKit.bujia.litros || ''),
            cilindros: String(primerKit.bujia.cilindros_config || '')
          }
        : {
            marca: 'Varios / Bujías Sueltas',
            modelo: 'Cotización',
            anios: 'N/A'
          };

      const tipoBujia = primerKit ? (NGK_LINE_LABELS[primerKit.tipoLinea] || primerKit.tipoLinea) : 'stock';
      const bujiaSku = primerKit ? (getSkuData(primerKit.bujia, primerKit.tipoLinea)?.tipo || '') : '';

      const piezas = [];
      if (primerKit) {
        piezas.push({
          nombre: 'Bujías NGK',
          sku: bujiaSku,
          excluida: primerKit.excludedParts.includes('bujias')
        });
        
        const kit = primerKit.kit_afinacion || {};
        const isExcluded = (key) => primerKit.excludedParts.includes(key);
        const filtrosKeys = [
          { key: 'filtro_aceite', label: 'Filtro de Aceite' },
          { key: 'filtro_aire', label: 'Filtro de Aire' },
          { key: 'filtro_gasolina', label: 'Filtro de Gasolina' },
          { key: 'filtro_cabina', label: 'Filtro de Cabina' }
        ];
        filtrosKeys.forEach(({ key, label }) => {
          const f = kit[key];
          piezas.push({
            nombre: label,
            sku: f?.sku || '',
            excluida: isExcluded(key)
          });
        });
      }

      // Additional kits
      items.filter((i, idx) => i.type === 'kit' && idx > 0).forEach(kitItem => {
        piezas.push({
          nombre: `Kit Adicional: ${kitItem.bujia.marca} ${kitItem.bujia.modelo}`,
          sku: `Línea: ${NGK_LINE_LABELS[kitItem.tipoLinea] || kitItem.tipoLinea}`,
          excluida: false
        });
      });

      // Loose spark plugs
      items.filter(i => i.type === 'pieza').forEach(p => {
        piezas.push({
          nombre: `Bujía Individual: ${p.bujia.marca} ${p.bujia.modelo}`,
          sku: getSkuData(p.bujia, p.tipoLinea)?.tipo || '',
          excluida: false
        });
      });

      // Loose filters
      items.filter(i => i.type === 'filtro').forEach(fItem => {
        const { bujia, filterKey } = fItem;
        const labelTxt = filterKey === 'filtro_aceite' ? 'Aceite' : filterKey === 'filtro_aire' ? 'Aire' : filterKey === 'filtro_gasolina' ? 'Gasolina' : 'Cabina';
        piezas.push({
          nombre: `Filtro Individual de ${labelTxt}: ${bujia.marca} ${bujia.modelo}`,
          sku: bujia.kit_afinacion?.[filterKey]?.sku || 'Cotizar',
          excluida: false
        });
      });

      const aceite = (primerKit?.aceite_motor && !primerKit.excludedParts.includes('aceite_motor'))
        ? {
            marca: primerKit.aceite_motor.marca,
            viscosidad: primerKit.aceite_motor.viscosidad,
            tecnologia: primerKit.aceite_motor.tecnologia,
            presentacion: primerKit.aceite_motor.presentacion,
            litros: primerKit.aceite_motor.litros
          }
        : undefined;

      const detallesPago = {};
      if (selectedPayment === 'tarjeta') {
        detallesPago.metodo = 'Mercado Pago';
        detallesPago.tarjetaEnmascarada = 'ONLINE';
      } else if (selectedPayment === 'transferencia') {
        detallesPago.referencia = 'Transferencia Solicitada';
      } else if (selectedPayment === 'deposito') {
        detallesPago.instrucciones = 'Depósito en OXXO / Banamex';
      } else if (selectedPayment === 'efectivo') {
        detallesPago.pagoCon = cashPaidWith ? parseFloat(cashPaidWith) : grandTotal;
        detallesPago.cambio = changeAmount;
      }

      const payload = {
        vehiculo,
        tipoBujia,
        bujiaSku,
        piezas,
        aceite,
        servicioTaller,
        metodoPago: selectedPayment,
        detallesPago,
        direccionEnvio: (selectedDelivery === 'zmg' || selectedDelivery === 'foraneo') ? datosEnvio : null
      };

      const res = await fetch(`${API_BASE}/api/cotizaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error al registrar la cotización en el servidor');
      }

      const cotizacionGuardada = await res.json();
      const folio = cotizacionGuardada.folio;

      const msg = buildConsolidatedMessage(
        items,
        selectedDeliveryOption,
        selectedPaymentOption,
        shipping,
        grandTotal,
        folio,
        servicioTaller,
        paymentDetails,
        (selectedDelivery === 'zmg' || selectedDelivery === 'foraneo') ? datosEnvio : null
      );

      if (selectedPayment === 'tarjeta') {
        // Backup message to localStorage before redirect
        localStorage.setItem('mas_afinacion_last_order_msg', msg);

        // Call Mercado Pago preference creation endpoint
        const mpRes = await fetch(`${API_BASE}/api/checkout/create-preference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cotizacionId: cotizacionGuardada._id,
            totalCart: grandTotal
          })
        });

        if (!mpRes.ok) {
          const mpErr = await mpRes.json();
          throw new Error(mpErr.error || 'Error al iniciar pago en Mercado Pago');
        }

        const mpData = await mpRes.json();
        
        // Redirect user to Mercado Pago checkout
        window.location.href = mpData.sandbox_init_point || mpData.init_point;
      } else {
        // Direct WhatsApp order for offline payments
        const targetUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        clearCart();
        navigate('/catalogo');
      }

    } catch (err) {
      console.error('Error al procesar el pedido:', err);
      setErrorMsg(err.message || 'Error al procesar el pedido. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (paymentStatus === 'approved') {
    const handleSendWhatsAppSuccess = () => {
      const lastMsg = localStorage.getItem('mas_afinacion_last_order_msg') || '';
      const finalMsg = `[PAGADO POR MERCADO PAGO - FOLIO #${paymentFolio}]\n\n` + lastMsg;
      const targetUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMsg)}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      localStorage.removeItem('mas_afinacion_last_order_msg');
      navigate('/catalogo');
    };

    return (
      <>
        <Header />
        <main className="page flex flex-col items-center justify-center text-center px-4 py-20" style={{ minHeight: '75vh' }}>
          <div className="bg-[#0a0a0a] border border-primary/20 border-t-4 border-t-primary p-8 md:p-12 max-w-xl w-full shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
              <Check className="text-primary w-8 h-8" />
            </div>
            
            <h1 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-wider text-white mb-2">
              ¡Pago Aprobado!
            </h1>
            <p className="text-primary font-mono text-sm font-bold uppercase tracking-wider mb-6">
              Folio: #{paymentFolio}
            </p>
            
            <p className="text-gray-450 text-sm font-mono leading-relaxed mb-8">
              Tu cotización ha sido pagada con éxito a través de Mercado Pago. Hemos reservado tu kit de afinación y las refacciones seleccionadas en nuestra base de datos.
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleSendWhatsAppSuccess}
                className="w-full bg-[#62A81D] hover:bg-[#4e8717] text-white font-bold py-3.5 px-6 uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md select-none"
                style={{ border: 'none', clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
              >
                <MessageCircle size={16} />
                Enviar Confirmación por WhatsApp
              </button>
              
              <button
                onClick={() => {
                  localStorage.removeItem('mas_afinacion_last_order_msg');
                  navigate('/catalogo');
                }}
                className="w-full bg-transparent border border-gray-800 hover:border-gray-700 text-gray-500 hover:text-white font-mono text-[10px] py-2.5 uppercase tracking-wider transition-colors cursor-pointer"
              >
                Volver al Catálogo
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="page flex flex-col items-center justify-center text-center px-4 py-20" style={{ minHeight: '70vh' }}>
          <Package size={64} className="text-gray-600 mb-4 animate-bounce" />
          <h1 className="font-display font-extrabold text-2xl uppercase tracking-wider text-primary mb-2">Tu carrito está vacío</h1>
          <p className="text-gray-400 text-sm max-w-sm mb-6">
            No tienes productos seleccionados. Te redirigiremos al catálogo en unos segundos para que explores nuestros kits...
          </p>
          <button
            onClick={() => navigate('/catalogo')}
            className="bg-[#62A81D] hover:bg-[#4e8717] text-white font-bold py-2.5 px-6 uppercase tracking-wider text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            style={{ clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
          >
            Ir al catálogo
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page" style={{ paddingTop: '2rem', minHeight: '80vh' }}>
        {/* Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate('/catalogo')}
              className="group flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-primary transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
              Volver al Catálogo
            </button>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-wider text-primary">
              Proceso de Pago / Cotización
            </h1>
            <p className="text-gray-400 text-xs font-mono mt-1">Completa los datos de envío y pago para confirmar tu cotización.</p>
          </div>
        </div>

        {/* Checkout Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-16">
          
          {/* Left Column: Delivery & Payment options */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Delivery Methods Section */}
            <div className="bg-[#0a0a0a] border border-gray-800 border-t-2 border-t-primary p-6 md:p-8 rounded-none relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center gap-2.5 mb-6">
                <Truck className="text-primary" size={20} />
                <h2 className="font-display font-bold text-lg uppercase tracking-wide text-white">Método de Entrega</h2>
              </div>

              <div className="flex flex-col gap-4">
                {DELIVERY_OPTIONS.map((opt) => {
                  const sh = computeShipping(opt.id);
                  const isSelected = selectedDelivery === opt.id;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => setSelectedDelivery(opt.id)}
                      className={`flex items-start gap-4 p-4 border border-gray-800 hover:border-gray-700 bg-[#111111] transition-all cursor-pointer select-none relative ${
                        isSelected ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => setSelectedDelivery(opt.id)}
                        className="sr-only"
                      />
                      
                      <div className="text-xl flex-shrink-0">{opt.icon}</div>
                      
                      <div className="flex-1">
                        <span className="block font-bold text-sm text-white">{opt.label}</span>
                        {opt.address && (
                          <span className="flex items-center gap-1 text-gray-500 font-mono text-[10px] mt-1">
                            <MapPin size={10} /> {opt.address}
                          </span>
                        )}
                        {opt.note && (
                          <span className="block text-gray-500 font-mono text-[10px] mt-1">{opt.note}</span>
                        )}
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`font-mono text-xs font-bold ${sh.isFree ? 'text-primary' : 'text-white'}`}>
                          {sh.cost === 0 ? (
                            sh.isFree && opt.id === 'zmg' ? '¡GRATIS!' : 'Gratis'
                          ) : (
                            `$${sh.cost}`
                          )}
                        </span>
                        {isSelected && (
                          <div className="bg-primary/20 text-primary border border-primary/30 p-0.5 rounded-full mt-1">
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Free shipping banner */}
              {selectedDelivery === 'zmg' && (
                <div className={`mt-4 p-3 font-mono text-[11px] leading-relaxed border transition-colors ${
                  shipping.isFree 
                    ? 'bg-primary/5 text-primary border-primary/20' 
                    : 'bg-yellow-500/5 text-yellow-500/80 border-yellow-500/10'
                }`}>
                  {shipping.isFree ? (
                    <span>
                      🎉 ¡Envío GRATIS aplicado! {items.some(i => i.type === 'kit') ? 'Por llevar un Kit de Afinación Completo.' : 'Tu carrito supera $1,500.'}
                    </span>
                  ) : (
                    <span>
                      💡 Agrega un Kit de Afinación Completo o supera un subtotal de <strong>$1,500</strong> para activar envío GRATIS en ZMG.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Formulario de Envío (con animación fluida AnimatePresence) */}
            <AnimatePresence>
              {(selectedDelivery === 'zmg' || selectedDelivery === 'foraneo') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#0a0a0a] border border-gray-800 border-t-2 border-t-primary p-6 md:p-8 rounded-none relative overflow-hidden backdrop-blur-md">
                    <div className="flex items-center gap-2.5 mb-6">
                      <MapPin className="text-primary" size={20} />
                      <h2 className="font-display font-bold text-lg uppercase tracking-wide text-white">Datos de Envío</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Nombre de quién recibe *</label>
                        <input
                          type="text"
                          value={datosEnvio.nombreRecibe}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, nombreRecibe: e.target.value })}
                          onBlur={(e) => setDatosEnvio({ ...datosEnvio, nombreRecibe: capitalizeWords(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2.5 outline-none transition-colors"
                          placeholder="Ej. Juan Pérez"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Teléfono de contacto *</label>
                        <input
                          type="tel"
                          value={datosEnvio.telefono}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2.5 outline-none transition-colors"
                          placeholder="Ej. 3312345678"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Calle y Número *</label>
                        <input
                          type="text"
                          value={datosEnvio.calleNumero}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, calleNumero: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2.5 outline-none transition-colors"
                          placeholder="Ej. Av. Juárez 123 Int. 4"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Colonia *</label>
                        <input
                          type="text"
                          value={datosEnvio.colonia}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, colonia: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2.5 outline-none transition-colors"
                          placeholder="Ej. Centro"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Código Postal *</label>
                        <input
                          type="text"
                          value={datosEnvio.codigoPostal}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, codigoPostal: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2.5 outline-none transition-colors"
                          placeholder="Ej. 44100"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Municipio / Delegación *</label>
                        <input
                          type="text"
                          value={datosEnvio.municipio}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, municipio: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                          onBlur={(e) => setDatosEnvio({ ...datosEnvio, municipio: capitalizeWords(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2.5 outline-none transition-colors"
                          placeholder="Ej. Guadalajara"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Estado *</label>
                        <input
                          type="text"
                          value={datosEnvio.estado}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, estado: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                          onBlur={(e) => setDatosEnvio({ ...datosEnvio, estado: capitalizeWords(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2.5 outline-none transition-colors"
                          placeholder="Ej. Jalisco"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Referencias de entrega (opcional)</label>
                        <textarea
                          value={datosEnvio.referencias}
                          onChange={(e) => setDatosEnvio({ ...datosEnvio, referencias: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2.5 outline-none transition-colors min-h-[60px]"
                          placeholder="Ej. Portón negro, entre calle Independencia y Libertad..."
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Methods Section */}
            <div className="bg-[#0a0a0a] border border-gray-800 border-t-2 border-t-primary p-6 md:p-8 rounded-none relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center gap-2.5 mb-6">
                <CreditCard className="text-primary" size={20} />
                <h2 className="font-display font-bold text-lg uppercase tracking-wide text-white">Método de Pago</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = selectedPayment === pm.id;
                  return (
                    <label
                      key={pm.id}
                      onClick={() => setSelectedPayment(pm.id)}
                      className={`flex items-center justify-between p-4 border border-gray-800 hover:border-gray-700 bg-[#111111] transition-all cursor-pointer select-none ${
                        isSelected ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.id}
                        checked={isSelected}
                        onChange={() => setSelectedPayment(pm.id)}
                        className="sr-only"
                      />
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{pm.icon}</span>
                        <span className="font-bold text-xs text-white uppercase tracking-wider">{pm.label}</span>
                      </div>

                      {isSelected && (
                        <div className="bg-primary/20 text-primary border border-primary/30 p-0.5 rounded-full">
                          <Check size={10} />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Dynamic Payment Details/Form */}
              <div className="mt-6 border-t border-gray-800 pt-6">
                
                {selectedPayment === 'tarjeta' && (
                  <div className="bg-[#111111] border border-gray-850 p-6 flex flex-col gap-4 rounded-lg text-gray-400">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="text-primary" size={18} />
                        <span className="text-white font-bold text-xs uppercase tracking-wider">Pago en Línea Seguro</span>
                      </div>
                      <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded font-semibold border border-sky-500/20 font-mono">MERCADO PAGO</span>
                    </div>

                    <div className="space-y-3 leading-relaxed text-xs">
                      <p>
                        Serás redirigido a la plataforma oficial de <strong>Mercado Pago</strong> para completar tu transacción de manera 100% segura.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-neutral-900 border border-gray-800 flex flex-col items-center justify-center text-center">
                          <span className="text-lg">💳</span>
                          <span className="font-bold text-[10px] text-white uppercase tracking-wider mt-1">Tarjetas</span>
                          <span className="text-[9px] text-gray-500 mt-0.5">Crédito y Débito</span>
                        </div>
                        <div className="p-3 bg-neutral-900 border border-gray-800 flex flex-col items-center justify-center text-center">
                          <span className="text-lg">🏪</span>
                          <span className="font-bold text-[10px] text-white uppercase tracking-wider mt-1">Efectivo</span>
                          <span className="text-[9px] text-gray-500 mt-0.5">OXXO y Bancos</span>
                        </div>
                      </div>

                      <div className="bg-primary/5 text-primary border border-primary/10 p-3 text-[11px] font-mono leading-normal mt-2">
                        🔒 Tus datos financieros están protegidos por el cifrado nativo de Mercado Pago. +AFINACIÓN no almacena tu información de tarjeta.
                      </div>
                    </div>
                  </div>
                )}

                {selectedPayment === 'transferencia' && (
                  <div className="bg-[#111111] border border-gray-850 p-4 flex flex-col gap-4 font-mono text-xs text-gray-450">
                    <div className="border-b border-gray-850 pb-2 flex justify-between items-center">
                      <span className="text-white font-bold uppercase tracking-wider">Datos de Transferencia</span>
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-semibold border border-primary/20">Mercado Pago</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-gray-900">
                        <span>Banco:</span>
                        <strong className="text-white">Mercado Pago</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-900">
                        <span>Beneficiario:</span>
                        <strong className="text-white">A+ MÁS AFINACIÓN</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-900">
                        <span>CLABE:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-white">722969010894981197</strong>
                          <button
                            type="button"
                            onClick={() => handleCopy('722969010894981197', 'clabe')}
                            className="text-gray-500 hover:text-primary transition-colors cursor-pointer"
                          >
                            {copiedStatus === 'clabe' ? (
                              <span className="text-[10px] text-primary font-bold">¡Copiado!</span>
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Concepto:</span>
                        <strong className="text-white">Compra +AFINACIÓN</strong>
                      </div>
                    </div>

                    <div className="bg-amber-500/5 text-amber-500 border border-amber-500/10 p-3 leading-relaxed text-[11px]">
                      💡 Realiza la transferencia y, una vez completada, envía el comprobante de pago al confirmar tu cotización por WhatsApp.
                    </div>
                  </div>
                )}

                {selectedPayment === 'deposito' && (
                  <div className="bg-[#111111] border border-gray-850 p-4 flex flex-col gap-4 font-mono text-xs text-gray-450">
                    <div className="border-b border-gray-850 pb-2 flex justify-between items-center">
                      <span className="text-white font-bold uppercase tracking-wider">Depósito Bancario / OXXO</span>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-semibold border border-emerald-500/20">OXXO Pay & Ventanilla</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-gray-900">
                        <span>Establecimiento:</span>
                        <strong className="text-white">OXXO, 7-Eleven o Ventanilla BBVA</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-900">
                        <span>Tarjeta BBVA:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-white">4152 3134 5678 9012</strong>
                          <button
                            type="button"
                            onClick={() => handleCopy('4152313456789012', 'tarjeta')}
                            className="text-gray-500 hover:text-primary transition-colors cursor-pointer"
                          >
                            {copiedStatus === 'tarjeta' ? (
                              <span className="text-[10px] text-primary font-bold">¡Copiado!</span>
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-500/5 text-amber-500 border border-amber-500/10 p-3 leading-relaxed text-[11px] space-y-1">
                      <p>1️⃣ Ve a cualquier OXXO o ventanilla BBVA.</p>
                      <p>2️⃣ Solicita un depósito a la tarjeta BBVA que copiaste arriba.</p>
                      <p>3️⃣ Comparte una foto legible del ticket de pago por WhatsApp.</p>
                    </div>
                  </div>
                )}

                {selectedPayment === 'efectivo' && (
                  <div className="bg-[#111111] border border-gray-850 p-4 flex flex-col gap-4 font-mono text-xs text-gray-450">
                    <div className="border-b border-gray-850 pb-2 flex justify-between items-center">
                      <span className="text-white font-bold uppercase tracking-wider">Pago en Efectivo</span>
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-semibold border border-primary/20">Pago Contra Entrega</span>
                    </div>

                    <p className="leading-relaxed">
                      Paga de forma física al recoger tu orden en local o directamente al repartidor si estás dentro de la ZMG.
                    </p>

                    <div className="mt-2">
                      <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">¿Con cuánto vas a pagar? (Opcional)</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-gray-500 text-xs">$</span>
                        <input
                          type="text"
                          placeholder="Ej. 500, 1000, 1500"
                          value={cashPaidWith}
                          onChange={(e) => setCashPaidWith(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-primary/50 text-white font-mono text-xs p-2 pl-7 outline-none transition-colors"
                        />
                      </div>
                      {cashPaidWith && parseFloat(cashPaidWith) >= grandTotal ? (
                        <p className="mt-2 text-primary font-semibold text-[11px]">
                          🟢 Cambio estimado: ${(parseFloat(cashPaidWith) - grandTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                        </p>
                      ) : cashPaidWith ? (
                        <p className="mt-2 text-red-500 text-[11px]">
                          ⚠️ El monto de pago debe cubrir el total de ${grandTotal.toLocaleString('es-MX')}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Taller Services Section */}
            <div className="bg-[#0a0a0a] border border-gray-800 border-t-2 border-t-primary p-6 md:p-8 rounded-none relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center gap-2.5 mb-6">
                <Wrench className="text-primary" size={20} />
                <h2 className="font-display font-bold text-lg uppercase tracking-wide text-white">Servicio en Taller</h2>
              </div>

              <div className="flex flex-col gap-4">
                {SERVICES_OPTIONS.map((opt) => {
                  const isSelected = servicioTaller === opt.id;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => setServicioTaller(opt.id)}
                      className={`flex items-start gap-4 p-4 border border-gray-800 hover:border-gray-700 bg-[#111111] transition-all cursor-pointer select-none relative ${
                        isSelected ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="servicioTaller"
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => setServicioTaller(opt.id)}
                        className="sr-only"
                      />
                      
                      <div className="text-xl flex-shrink-0">{opt.icon}</div>
                      
                      <div className="flex-1">
                        <span className="block font-bold text-sm text-white">{opt.label}</span>
                        <span className="block text-gray-500 font-mono text-[10px] mt-1">{opt.desc}</span>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`font-mono text-xs font-bold ${opt.cost === 0 ? 'text-gray-500' : 'text-primary'}`}>
                          {opt.cost === 0 ? 'Gratis' : `+$${opt.cost}`}
                        </span>
                        {isSelected && (
                          <div className="bg-primary/20 text-primary border border-primary/30 p-0.5 rounded-full mt-1">
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {servicioTaller !== 'ninguno' && (
                <div className="mt-4 p-3 font-mono text-[11px] leading-relaxed border bg-primary/5 text-primary border-primary/20">
                  📍 Cita de instalación en sucursal: <strong>Oblatos</strong>. Se coordinará horario y fecha vía WhatsApp.
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Order Summary & Checkout sticky card */}
          <div className="lg:sticky lg:top-24 flex flex-col gap-6">
            
            <div className="bg-[#0a0a0a] border border-gray-800 border-t-2 border-t-primary p-6 rounded-none backdrop-blur-md">
              <h2 className="font-display font-bold text-base uppercase tracking-wider text-white mb-4 border-bottom border-gray-800 pb-3">
                Resumen de Compra
              </h2>

              {/* Items Breakdown list */}
              <div className="max-h-72 overflow-y-auto mb-6 pr-1 flex flex-col gap-3 scrollbar-thin">
                {items.map((item) => {
                  const label = NGK_LINE_LABELS[item.tipoLinea] || item.tipoLinea;
                  const getKitName = () => `${item.bujia.marca} ${item.bujia.modelo}`;
                  
                  return (
                    <div key={item.id} className="p-3 bg-[#111111] border border-gray-800/60 flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {item.type === 'kit' && <ShoppingBag size={12} className="text-primary" />}
                          {item.type === 'pieza' && <Zap size={12} className="text-sky-400" />}
                          {item.type === 'filtro' && <Filter size={12} className="text-yellow-500" />}
                          
                          <span className="font-bold text-xs text-white truncate max-w-[150px]">
                            {item.type === 'kit' ? getKitName() : `${item.bujia.marca} ${item.bujia.modelo}`}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-primary">
                          Qty: {item.qty}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1">
                        <span>
                          {item.type === 'kit' && `Kit Completo (${label})`}
                          {item.type === 'pieza' && `Bujía Individual (${label})`}
                          {item.type === 'filtro' && `Filtro de ${item.filterKey.replace('filtro_', '')}`}
                        </span>
                        {item.type === 'kit' && (
                          <span className="text-gray-400">
                            {item.aceite_motor ? 6 - item.excludedParts.length : 5 - item.excludedParts.length} pzs
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cost Summary Breakdown */}
              <div className="border-t border-gray-850 pt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-500">Subtotal Estimado</span>
                  <span className="text-white">${subtotal.toLocaleString('es-MX')}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-500">Costo de Envío</span>
                  <span className={`font-bold ${shipping.isFree ? 'text-primary' : 'text-white'}`}>
                    {shipping.isFree ? '¡GRATIS!' : `$${shipping.cost}`}
                  </span>
                </div>

                {servicioTaller !== 'ninguno' && (
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-500">Servicio en Taller ({servicioTaller === 'basico' ? 'Básico' : servicioTaller === 'medio' ? 'Medio' : 'Completo'})</span>
                    <span className="text-white font-bold">+${serviceCost}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-gray-850 pt-3">
                  <span className="font-display font-bold text-sm uppercase tracking-wide text-white">Total Estimado</span>
                  <span className="font-mono text-base font-extrabold text-primary">
                    ${grandTotal.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-gray-500 leading-normal font-mono mt-4 pt-3 border-t border-gray-850">
                * Los precios son orientativos y se confirmarán con el asesor vía WhatsApp antes de procesar el cobro real.
              </p>

              {errorMsg && (
                <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 text-[11px] font-mono mt-4 text-center">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <div className="mt-6 flex flex-col gap-3">
                <button
                  disabled={isSubmitting}
                  onClick={handleConfirmarPedido}
                  className="w-full bg-[#62A81D] hover:bg-[#4e8717] disabled:opacity-55 text-white font-bold py-3.5 px-6 uppercase tracking-wider text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-[0.98] select-none"
                  style={{ border: 'none', clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
                >
                  {selectedPayment === 'tarjeta' ? <CreditCard size={16} /> : <MessageCircle size={16} />}
                  {isSubmitting 
                    ? (selectedPayment === 'tarjeta' ? 'Conectando con Mercado Pago Seguro...' : 'Registrando Folio...')
                    : (selectedPayment === 'tarjeta' ? 'Proceder al Pago en Línea' : 'Confirmar por WhatsApp')}
                </button>
                
                <button
                  onClick={() => navigate('/catalogo')}
                  className="w-full bg-transparent border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-mono text-xs py-2 px-4 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Seguir Comprando
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
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
        </span>
      </footer>
    </>
  );
}
