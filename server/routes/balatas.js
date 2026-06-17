const express = require('express');
const router = express.Router();
const Balata = require('../models/Balata');
const auth = require('../middleware/auth');
const vehiculosRouter = require('./vehiculos');

// GET /api/balatas - Obtener todas las balatas
router.get('/', async (req, res) => {
  try {
    const balatas = await Balata.find({}).sort({ sku_dynamic: 1 });
    res.json(balatas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/balatas - Crear una balata (requiere auth)
router.post('/', auth, async (req, res) => {
  try {
    const { marca, sku_dynamic, sku_equivalente_wagner, fmsi, posicion, vehiculos_compatibles } = req.body;
    
    if (!sku_dynamic || !sku_equivalente_wagner || !fmsi || !posicion) {
      return res.status(400).json({ error: 'SKU Dynamic, SKU Equivalente Wagner, FMSI y Posición son obligatorios.' });
    }

    const skuDynUpper = sku_dynamic.trim().toUpperCase();

    // Validar duplicado
    const existe = await Balata.findOne({ sku_dynamic: skuDynUpper });
    if (existe) {
      return res.status(400).json({ error: `Ya existe una balata registrada con el SKU Dynamic ${skuDynUpper}.` });
    }

    // Validar posicion enum
    if (!['Delantero', 'Trasero'].includes(posicion)) {
      return res.status(400).json({ error: 'La posición debe ser "Delantero" o "Trasero".' });
    }

    // Validar compatibles
    let compatibles = [];
    if (Array.isArray(vehiculos_compatibles)) {
      for (const v of vehiculos_compatibles) {
        if (!v.modelo || v.anio_inicio === undefined || v.anio_fin === undefined) {
          return res.status(400).json({ error: 'Cada vehículo compatible debe tener modelo, anio_inicio y anio_fin.' });
        }
        compatibles.push({
          modelo: v.modelo.trim().toUpperCase(), // Normalizado a mayúsculas para emparejamiento exacto/difuso
          anio_inicio: Number(v.anio_inicio),
          anio_fin: Number(v.anio_fin),
          especificaciones: v.especificaciones || ''
        });
      }
    }

    const nuevaBalata = new Balata({
      marca: marca || 'Dynamic',
      sku_dynamic: skuDynUpper,
      sku_equivalente_wagner: sku_equivalente_wagner.trim().toUpperCase(),
      fmsi: fmsi.trim(),
      posicion,
      vehiculos_compatibles: compatibles
    });

    await nuevaBalata.save();
    vehiculosRouter.invalidatePriceCache();
    res.status(201).json({ ok: true, balata: nuevaBalata });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/balatas/:id - Actualizar una balata (requiere auth)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { marca, sku_dynamic, sku_equivalente_wagner, fmsi, posicion, vehiculos_compatibles } = req.body;

    const balata = await Balata.findById(id);
    if (!balata) {
      return res.status(404).json({ error: 'Balata no encontrada.' });
    }

    if (sku_dynamic) {
      const skuDynUpper = sku_dynamic.trim().toUpperCase();
      if (skuDynUpper !== balata.sku_dynamic) {
        const existe = await Balata.findOne({ sku_dynamic: skuDynUpper });
        if (existe) {
          return res.status(400).json({ error: `Ya existe otra balata registrada con el SKU Dynamic ${skuDynUpper}.` });
        }
        balata.sku_dynamic = skuDynUpper;
      }
    }

    if (sku_equivalente_wagner) {
      balata.sku_equivalente_wagner = sku_equivalente_wagner.trim().toUpperCase();
    }

    if (fmsi !== undefined) balata.fmsi = fmsi.trim();
    if (marca !== undefined) balata.marca = marca || 'Dynamic';
    
    if (posicion) {
      if (!['Delantero', 'Trasero'].includes(posicion)) {
        return res.status(400).json({ error: 'La posición debe ser "Delantero" o "Trasero".' });
      }
      balata.posicion = posicion;
    }

    if (vehiculos_compatibles !== undefined) {
      if (!Array.isArray(vehiculos_compatibles)) {
        return res.status(400).json({ error: 'vehiculos_compatibles debe ser un arreglo.' });
      }

      let compatibles = [];
      for (const v of vehiculos_compatibles) {
        if (!v.modelo || v.anio_inicio === undefined || v.anio_fin === undefined) {
          return res.status(400).json({ error: 'Cada vehículo compatible debe tener modelo, anio_inicio y anio_fin.' });
        }
        compatibles.push({
          modelo: v.modelo.trim().toUpperCase(),
          anio_inicio: Number(v.anio_inicio),
          anio_fin: Number(v.anio_fin),
          especificaciones: v.especificaciones || ''
        });
      }
      balata.vehiculos_compatibles = compatibles;
    }

    await balata.save();
    vehiculosRouter.invalidatePriceCache();
    res.json({ ok: true, balata });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/balatas/:id - Eliminar una balata (requiere auth)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const balata = await Balata.findByIdAndDelete(id);
    if (!balata) {
      return res.status(404).json({ error: 'Balata no encontrada.' });
    }
    vehiculosRouter.invalidatePriceCache();
    res.json({ ok: true, message: 'Balata eliminada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
