const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cotizacion = require('../models/Cotizacion');
const rateLimit = require('express-rate-limit');

// Rate limiter specifically for creating quotes
const cotizacionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window per IP
  message: { error: 'Demasiadas cotizaciones creadas desde esta IP. Por favor intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Generador de folio único e.g. AF-8392 (Evita bucles infinitos - BUG LOGIC-04)
async function generarFolioUnico() {
  let intentos = 0;
  const maxIntentos = 50;
  
  while (intentos < maxIntentos) {
    const numRandom = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    const folio = `AF-${numRandom}`;
    
    // Verificamos si existe en DB
    const coincidencia = await Cotizacion.findOne({ folio });
    if (!coincidencia) {
      return folio;
    }
    intentos++;
  }
  
  // Fallback seguro: número de 6 dígitos si el pool de 4 dígitos está lleno
  const numRandomLarge = Math.floor(100000 + Math.random() * 900000);
  return `AF-${numRandomLarge}`;
}

// @route   POST api/cotizaciones
// @desc    Crear una nueva cotización y generar folio
router.post('/', cotizacionLimiter, async (req, res) => {
  try {
    const { vehiculo, tipoBujia, bujiaSku, piezas, aceite, servicioTaller, metodoPago, detallesPago, direccionEnvio } = req.body;
    
    if (!vehiculo || !vehiculo.marca || !vehiculo.modelo) {
      return res.status(400).json({ error: 'Falta información esencial del vehículo' });
    }

    // Validate shipping address if provided
    if (direccionEnvio) {
      const { nombreRecibe, telefono, calleNumero, colonia, codigoPostal, municipio, estado } = direccionEnvio;
      
      if (!nombreRecibe || !telefono || !calleNumero || !colonia || !codigoPostal || !municipio || !estado) {
        return res.status(400).json({ error: 'Por favor, completa todos los campos requeridos de la dirección de envío.' });
      }
      
      const nRecibe = String(nombreRecibe).trim();
      if (nRecibe.length < 5 || !nRecibe.includes(' ')) {
        return res.status(400).json({ error: 'Por favor, ingresa el nombre y apellido completos de quien recibe (mínimo 5 letras con un espacio).' });
      }
      
      const cleanPhone = String(telefono).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: 'El teléfono de contacto debe tener exactamente 10 dígitos.' });
      }
      
      if (!/\d/.test(String(calleNumero))) {
        return res.status(400).json({ error: 'La calle y número debe incluir al menos un número para indicar el número exterior (ej. Juárez 123).' });
      }
      
      const cleanCP = String(codigoPostal).replace(/\D/g, '');
      const cpNum = parseInt(cleanCP, 10);
      if (cleanCP.length !== 5 || isNaN(cpNum) || cpNum < 1000 || cpNum > 99999) {
        return res.status(400).json({ error: 'El código postal debe tener exactamente 5 dígitos y estar dentro del rango oficial de México (01000 a 99999).' });
      }
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
