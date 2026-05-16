import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items,  setItems]  = useState([]);
  const [isOpen, setIsOpen] = useState(false);

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
  const addKit = useCallback((bujia, tipoLinea) => {
    setItems(prev => {
      const id = makeId('kit', bujia.id, tipoLinea);
      if (prev.some(i => i.id === id)) return prev;

      const kitItem = {
        type:         'kit',
        id,
        bujia,
        tipoLinea,
        kit_afinacion: bujia.kit_afinacion,   // 4 filtros
        qty:          1,
        excludedParts: [],                    // Keys of removed parts (e.g. 'bujias', 'filtro_aceite')
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

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        // Pieza
        addItem,
        removeItem,
        // Kit
        addKit,
        removeKit,
        toggleKitPart,
        // Drawer
        isOpen,
        openCart,
        closeCart,
        clearCart,
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
