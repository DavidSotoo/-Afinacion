import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { DELIVERY_OPTIONS, FREE_SHIPPING_THRESHOLD } from '../lib/constants';
import { calculateOilPrice } from '../lib/kitHelpers';

/**
 * Precio de referencia por tipo de ítem (MXN).
 * Estos son precios orientativos para calcular el subtotal y
 * activar el umbral de envío gratis. El precio real se confirma
 * con el asesor vía WhatsApp.
 */
const ITEM_PRICES = {
  kit:    899,   // Kit de Afinación Completo (precio base orientativo)
  pieza:  120,   // Bujía individual
  filtro:  85,   // Filtro individual
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items,  setItems]  = useState(() => {
    try {
      const saved = localStorage.getItem('mas_afinacion_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading cart from localStorage", e);
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [servicioTaller, setServicioTaller] = useState('ninguno');

  // Sync with localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('mas_afinacion_cart', JSON.stringify(items));
    } catch (e) {
      console.error("Error saving cart to localStorage", e);
    }
  }, [items]);

  // ── Drawer controls ────────────────────────────────────────────────────────
  const openCart  = useCallback(() => setIsOpen(true),  []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  // ── ID helpers ─────────────────────────────────────────────────────────────
  const makeId = (type, bujiaId, tipoLinea) => `${type}-${bujiaId}-${tipoLinea}`;

  // ── Pieza individual (bujías only) ─────────────────────────────────────────
  const addItem = useCallback((bujia, tipoLinea) => {
    setItems(prev => {
      const id = makeId('pieza', bujia.id, tipoLinea);
      if (prev.some(i => i.id === id)) return prev;
      return [...prev, { type: 'pieza', id, bujia, tipoLinea, qty: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  // ── Filtro individual ──────────────────────────────────────────────────────
  const addFiltro = useCallback((bujia, filterKey) => {
    setItems(prev => {
      const id = makeId('filtro', bujia.id, filterKey);
      if (prev.some(i => i.id === id)) return prev;
      return [...prev, { type: 'filtro', id, bujia, filterKey, qty: 1 }];
    });
    setIsOpen(true);
  }, []);

  // ── Kit de Afinación Completo (5 piezas) ───────────────────────────────────
  /**
   * Add a full 5-piece kit to the cart.
   *
   * Stored structure:
   *   { type: 'kit', id, bujia, tipoLinea, kit_afinacion, qty: 1 }
   *
   * bujia.kit_afinacion holds the 4 filter placeholders.
   * The 5th piece (bujías) is identified by tipoLinea.
   *
   * @param {Object} bujia      - Catalog record (must have kit_afinacion)
   * @param {string} tipoLinea  - NGK line key ('iridium' | 'platino' | 'vpower' | 'stock')
   */
  const addKit = useCallback((bujia, tipoLinea, initialExcluded = [], aceiteSelected = null) => {
    setItems(prev => {
      const id = makeId('kit', bujia.id, tipoLinea);
      if (prev.some(i => i.id === id)) return prev;

      const kitItem = {
        type:         'kit',
        id,
        bujia,
        tipoLinea,
        kit_afinacion: bujia.kit_afinacion,
        qty:          1,
        excludedParts: initialExcluded,
        aceite_motor:  aceiteSelected
      };
      return [...prev, kitItem];
    });
    setIsOpen(true);
  }, []);

  const removeKit = useCallback((itemId) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const toggleKitPart = useCallback((kitId, partKey) => {
    setItems(prev => prev.map(item => {
      if (item.id !== kitId || item.type !== 'kit') return item;
      const isExcluded = item.excludedParts.includes(partKey);
      const newExcluded = isExcluded
        ? item.excludedParts.filter(k => k !== partKey)
        : [...item.excludedParts, partKey];
      return { ...item, excludedParts: newExcluded };
    }));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // ── Computed totals ──────────────────────────────────────────────────
  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items],
  );

  /** Subtotal dinámico en MXN basado en costos del backend y exclusiones. */
  const subtotal = useMemo(
    () => items.reduce((sum, item) => {
      if (item.type === 'kit') {
        let kitPrice = 0;
        const kit = item.bujia.kit_afinacion || {};
        const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
        
        keys.forEach(k => {
          if (!item.excludedParts.includes(k)) {
            const f = kit[k];
            kitPrice += (f && f.costo !== undefined) ? f.costo : 85;
          }
        });

        if (!item.excludedParts.includes('bujias')) {
          const bujiasPriceObj = item.bujia.kit_afinacion?.bujias?.[item.tipoLinea];
          const bujiasPrice = (bujiasPriceObj && bujiasPriceObj.precio_total !== undefined)
            ? bujiasPriceObj.precio_total
            : 200;
          kitPrice += bujiasPrice;
        }

        if (item.aceite_motor && !item.excludedParts.includes('aceite_motor')) {
          kitPrice += calculateOilPrice(item.bujia.anio_inicio, item.aceite_motor.tecnologia, item.aceite_motor.litros);
        }

        return sum + kitPrice * item.qty;
      } else if (item.type === 'pieza') {
        const bujiasPriceObj = item.bujia.kit_afinacion?.bujias?.[item.tipoLinea];
        const bujiasPrice = (bujiasPriceObj && bujiasPriceObj.precio_unitario !== undefined)
          ? bujiasPriceObj.precio_unitario
          : 120;
        return sum + bujiasPrice * item.qty;
      } else if (item.type === 'filtro') {
        const f = item.bujia.kit_afinacion?.[item.filterKey];
        const filterPrice = (f && f.costo !== undefined) ? f.costo : 85;
        return sum + filterPrice * item.qty;
      }
      return sum;
    }, 0),
    [items],
  );

  /** ¿El carrito tiene al menos un Kit de Afinación Completo? */
  const hasKit = useMemo(() => items.some(i => i.type === 'kit'), [items]);

  /**
   * Calcula el costo de envío para una opción dada.
   * Regla de negocio:
   *   ZMG → $0 si (tiene Kit de Afinación Completo) OR (subtotal > $1,500)
   *   Todos los demás → baseCost fijo.
   *
   * @param {string} deliveryId  - id de la opción (local | zmg | foraneo)
   * @returns {{ cost: number, isFree: boolean }}
   */
  const computeShipping = useCallback((deliveryId) => {
    const option = DELIVERY_OPTIONS.find(o => o.id === deliveryId);
    if (!option) return { cost: 0, isFree: false };

    if (option.id === 'zmg') {
      const qualifiesFree = hasKit || subtotal > FREE_SHIPPING_THRESHOLD;
      return { cost: qualifiesFree ? 0 : option.baseCost, isFree: qualifiesFree };
    }
    return { cost: option.baseCost, isFree: option.baseCost === 0 };
  }, [hasKit, subtotal]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        computeShipping,
        // Pieza
        addItem,
        removeItem,
        // Filtro
        addFiltro,
        // Kit
        addKit,
        removeKit,
        toggleKitPart,
        // Drawer
        isOpen,
        openCart,
        closeCart,
        clearCart,
        // Servicio Taller
        servicioTaller,
        setServicioTaller,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
