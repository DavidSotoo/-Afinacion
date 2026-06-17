const express = require('express');
const router = express.Router();
const PrecioFiltro = require('../models/PrecioFiltro');
const auth = require('../middleware/auth');
const vehiculosRouter = require('./vehiculos');

// GET /api/filtros - Obtener todos los filtros (ordenados por marca y clave)
router.get('/', async (req, res) => {
  try {
    const filtros = await PrecioFiltro.find({}).sort({ marca: 1, clave: 1 });
    res.json(filtros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/filtros - Crear un filtro (requiere auth)
router.post('/', auth, async (req, res) => {
  try {
    const { clave, marca, descripcion, precio } = req.body;
    if (!clave || precio === undefined) {
      return res.status(400).json({ error: 'La clave y el precio son obligatorios.' });
    }

    const claveUpper = clave.trim().toUpperCase();
    const marcaUpper = (marca || 'UNIFIL').trim().toUpperCase();

    // Validar duplicado por la combinación de clave + marca
    const existe = await PrecioFiltro.findOne({ clave: claveUpper, marca: marcaUpper });
    if (existe) {
      return res.status(400).json({ error: `Ya existe un filtro de la marca ${marcaUpper} registrado con la clave ${claveUpper}.` });
    }

    const nuevoFiltro = new PrecioFiltro({
      clave: claveUpper,
      marca: marcaUpper,
      descripcion: descripcion || '',
      precio: Number(precio)
    });

    await nuevoFiltro.save();
    vehiculosRouter.invalidatePriceCache();
    res.status(201).json({ ok: true, filtro: nuevoFiltro });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/filtros/:id - Actualizar un filtro (requiere auth)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { clave, marca, descripcion, precio } = req.body;

    const filtro = await PrecioFiltro.findById(id);
    if (!filtro) {
      return res.status(404).json({ error: 'Filtro no encontrado.' });
    }

    const nextClave = clave !== undefined ? clave.trim().toUpperCase() : filtro.clave;
    const nextMarca = marca !== undefined ? marca.trim().toUpperCase() : (filtro.marca || 'UNIFIL');

    // Si cambia la clave o la marca, validar duplicidad
    if (nextClave !== filtro.clave || nextMarca !== (filtro.marca || 'UNIFIL')) {
      const existe = await PrecioFiltro.findOne({ clave: nextClave, marca: nextMarca });
      if (existe) {
        return res.status(400).json({ error: `Ya existe otro filtro de la marca ${nextMarca} registrado con la clave ${nextClave}.` });
      }
      filtro.clave = nextClave;
      filtro.marca = nextMarca;
    }

    if (descripcion !== undefined) filtro.descripcion = descripcion;
    if (precio !== undefined) filtro.precio = Number(precio);

    await filtro.save();
    vehiculosRouter.invalidatePriceCache();
    res.json({ ok: true, filtro });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/filtros/:id - Eliminar un filtro (requiere auth)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const filtro = await PrecioFiltro.findByIdAndDelete(id);
    if (!filtro) {
      return res.status(404).json({ error: 'Filtro no encontrado.' });
    }
    vehiculosRouter.invalidatePriceCache();
    res.json({ ok: true, message: 'Filtro eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/filtros/bulk-adjust - Ajuste de precios en bloque por porcentaje (requiere auth)
router.post('/bulk-adjust', auth, async (req, res) => {
  try {
    const { marca, porcentaje } = req.body;
    if (!marca || porcentaje === undefined || isNaN(porcentaje)) {
      return res.status(400).json({ error: 'La marca y el porcentaje son obligatorios.' });
    }

    const brandUpper = marca.trim().toUpperCase();
    const pct = Number(porcentaje);
    const multiplier = 1 + (pct / 100);

    // Update prices using MongoDB aggregation update pipeline to round to 2 decimal places
    const result = await PrecioFiltro.updateMany(
      { marca: brandUpper },
      [
        {
          $set: {
            precio: {
              $round: [{ $multiply: ['$precio', multiplier] }, 2]
            }
          }
        }
      ],
      { updatePipeline: true }
    );

    // Invalidate vehicle price cache
    vehiculosRouter.invalidatePriceCache();

    res.json({
      ok: true,
      message: `Precios de la marca ${brandUpper} actualizados con éxito.`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error in bulk adjustment for filters:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
