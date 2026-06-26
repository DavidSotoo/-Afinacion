import React, { useState, useEffect } from 'react';

export default function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const obtenerProductos = async () => {
      setCargando(true);
      try {
        const urlBackend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const respuesta = await fetch(`${urlBackend}/api/productos?search=${encodeURIComponent(busqueda)}`);
        const data = await respuesta.json();
        setProductos(data);
      } catch (error) {
        console.error('Error al obtener los productos:', error);
      } finally {
        setCargando(false);
      }
    };

    // Debounce de 300ms para evitar múltiples llamadas mientras el usuario escribe
    const timer = setTimeout(() => obtenerProductos(), 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  return (
    <div className="productos-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#666' }}>Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#666' }}>No se encontraron productos.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {productos.map((producto) => (
            <div key={producto._id} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: '#fff',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>{producto.nombre}</h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#777' }}>SKU: {producto.sku}</p>
                {producto.marca && <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#777' }}>Marca: {producto.marca}</p>}
              </div>
              <div style={{
                paddingTop: '15px',
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#555' }}>Precio Final</span>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#2e7d32' }}>
                  ${producto.precioCliente?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
