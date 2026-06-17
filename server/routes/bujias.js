const express = require('express');
const router = express.Router();
const PrecioBujia = require('../models/PrecioBujia');
const auth = require('../middleware/auth');
const vehiculosRouter = require('./vehiculos');

// GET /api/bujias - Obtener todas las bujías
router.get('/', async (req, res) => {
  try {
    const bujias = await PrecioBujia.find({}).sort({ sku: 1 });
    res.json(bujias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bujias - Crear una bujía (requiere auth)
router.post('/', auth, async (req, res) => {
  try {
    const { sku, descripcion, precio_cliente } = req.body;
    if (!sku || precio_cliente === undefined) {
      return res.status(400).json({ error: 'El SKU y el precio cliente son obligatorios.' });
    }

    const skuUpper = sku.trim().toUpperCase();

    // Validar duplicado
    const existe = await PrecioBujia.findOne({ sku: skuUpper });
    if (existe) {
      return res.status(400).json({ error: `Ya existe una bujía registrada con el SKU ${skuUpper}.` });
    }

    const nuevaBujia = new PrecioBujia({
      sku: skuUpper,
      descripcion: descripcion || '',
      precio_cliente: Number(precio_cliente)
    });

    await nuevaBujia.save();
    vehiculosRouter.invalidatePriceCache();
    res.status(201).json({ ok: true, bujia: nuevaBujia });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bujias/:id - Actualizar una bujía (requiere auth)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, descripcion, precio_cliente } = req.body;

    const bujia = await PrecioBujia.findById(id);
    if (!bujia) {
      return res.status(404).json({ error: 'Bujía no encontrada.' });
    }

    if (sku) {
      const skuUpper = sku.trim().toUpperCase();
      // Si cambia el SKU, validar que no choque
      if (skuUpper !== bujia.sku) {
        const existe = await PrecioBujia.findOne({ sku: skuUpper });
        if (existe) {
          return res.status(400).json({ error: `Ya existe otra bujía registrada con el SKU ${skuUpper}.` });
        }
        bujia.sku = skuUpper;
      }
    }

    if (descripcion !== undefined) bujia.descripcion = descripcion;
    if (precio_cliente !== undefined) bujia.precio_cliente = Number(precio_cliente);

    await bujia.save();
    vehiculosRouter.invalidatePriceCache();
    res.json({ ok: true, bujia });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bujias/:id - Eliminar una bujía (requiere auth)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const bujia = await PrecioBujia.findByIdAndDelete(id);
    if (!bujia) {
      return res.status(404).json({ error: 'Bujía no encontrada.' });
    }
    vehiculosRouter.invalidatePriceCache();
    res.json({ ok: true, message: 'Bujía eliminada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bujias/bulk-adjust - Ajuste de precios en bloque por porcentaje (requiere auth)
router.post('/bulk-adjust', auth, async (req, res) => {
  try {
    const { porcentaje } = req.body;
    if (porcentaje === undefined || isNaN(porcentaje)) {
      return res.status(400).json({ error: 'El porcentaje es obligatorio.' });
    }

    const pct = Number(porcentaje);
    const multiplier = 1 + (pct / 100);

    // Update client prices using MongoDB aggregation update pipeline to round to 2 decimal places
    const result = await PrecioBujia.updateMany(
      {},
      [
        {
          $set: {
            precio_cliente: {
              $round: [{ $multiply: ['$precio_cliente', multiplier] }, 2]
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
      message: `Precios de bujías actualizados con éxito.`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error in bulk adjustment for bujias:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
