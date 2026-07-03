const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Vehiculo = require('../models/Vehiculo');
const { enrichVehiculosWithPrices } = require('../lib/pricingHelpers');
const antiscaping = require('../middleware/antiscaping');

/**
 * GET /api/kits/:id
 * Fetches details for a specific tuning kit by vehicle ID.
 * Enriches the record with live product prices.
 */
router.get('/:id', antiscaping, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de kit inválido' });
    }
    
    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Kit de afinación no encontrado' });
    }

    const enrichedList = await enrichVehiculosWithPrices([vehiculo]);
    res.json(enrichedList[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
