const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cotizacion = require('../models/Cotizacion');

// Generador de folio único e.g. AF-8392
async function generarFolioUnico() {
  let existe = true;
  let folio = '';
  
  while (existe) {
    const numRandom = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    folio = `AF-${numRandom}`;
    
    // Verificamos si existe en DB
    const coincidencia = await Cotizacion.findOne({ folio });
    if (!coincidencia) {
      existe = false;
    }
  }
  return folio;
}

// @route   POST api/cotizaciones
// @desc    Crear una nueva cotización y generar folio
router.post('/', async (req, res) => {
  try {
    const { vehiculo, tipoBujia, bujiaSku, piezas, aceite, servicioTaller, metodoPago, detallesPago, direccionEnvio } = req.body;
    
    if (!vehiculo || !vehiculo.marca || !vehiculo.modelo) {
      return res.status(400).json({ error: 'Falta información esencial del vehículo' });
    }

    const folio = await generarFolioUnico();

    const nuevaCotizacion = new Cotizacion({
      folio,
      vehiculo,
      tipoBujia,
      bujiaSku,
      piezas,
      aceite,
      servicioTaller,
      metodoPago,
      detallesPago,
      direccionEnvio
    });

    const guardada = await nuevaCotizacion.save();
    res.status(201).json(guardada);
  } catch (err) {
    console.error('Error al guardar cotización:', err.message);
    res.status(500).json({ error: 'Error del servidor al registrar cotización' });
  }
});

// @route   GET api/cotizaciones
// @desc    Obtener todas las cotizaciones ordenadas por fecha (recientes primero)
router.get('/', auth, async (req, res) => {
  try {
    const lista = await Cotizacion.find().sort({ fecha: -1 });
    res.json(lista);
  } catch (err) {
    console.error('Error al obtener cotizaciones:', err.message);
    res.status(500).json({ error: 'Error del servidor al listar cotizaciones' });
  }
});

// @route   PUT api/cotizaciones/:id/status
// @desc    Actualizar el estatus de la cotización
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { estatus } = req.body;
    if (!['Pendiente', 'Atendida', 'Cancelada', 'Pagado / Listo para surtir'].includes(estatus)) {
      return res.status(400).json({ error: 'Estatus no válido' });
    }

    const cotizacion = await Cotizacion.findByIdAndUpdate(
      req.params.id,
      { estatus },
      { new: true }
    );

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    res.json(cotizacion);
  } catch (err) {
    console.error('Error al actualizar estatus:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// @route   DELETE api/cotizaciones/:id
// @desc    Eliminar una cotización
router.delete('/:id', auth, async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByIdAndDelete(req.params.id);
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    res.json({ message: 'Cotización eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar cotización:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
