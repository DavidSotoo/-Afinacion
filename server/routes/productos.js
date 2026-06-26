const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filtro = {};

    // Filtrado por búsqueda (busca en nombre o SKU usando expresiones regulares)
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Usamos .lean() para obtener objetos JS planos y optimizar rendimiento
    const productosDb = await Producto.find(filtro).lean();

    // Lógica de cálculo al vuelo: ((Precio_Lista * 1.16) * 1.40)
    const productosConPrecioCalculado = productosDb.map(producto => {
      const precioLista = producto.precioLista || 0;
      const precioFinal = (precioLista * 1.16) * 1.40;

      return {
        ...producto,
        // Redondeamos a 2 decimales para enviar un dato limpio al cliente
        precioCliente: parseFloat(precioFinal.toFixed(2))
      };
    });

    res.json(productosConPrecioCalculado);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
