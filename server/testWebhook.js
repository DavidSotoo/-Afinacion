/**
 * testWebhook.js
 * 
 * Script de prueba para simular una notificación IPN/Webhook de Mercado Pago aprobada.
 * Dispara un evento local directo contra el servidor express en http://localhost:5000/api/webhooks/mercadopago.
 */

const http = require('http');

const args = process.argv.slice(2);
const folio = args[0];

if (!folio) {
  console.log('⚠️  Uso: node testWebhook.js <FOLIO>');
  console.log('   Ejemplo: node testWebhook.js AF-1234\n');
  process.exit(1);
}

// Payload to simulate payment.created webhook
const payload = JSON.stringify({
  action: 'payment.created',
  type: 'payment',
  data: {
    id: `TEST-PAYMENT-${Math.floor(100000 + Math.random() * 900000)}`
  },
  external_reference: folio,
  status: 'approved'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: `/api/webhooks/mercadopago?external_reference=${encodeURIComponent(folio)}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`📡 Enviando simulación de pago aprobado para Folio: ${folio}...`);

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`🟢 Servidor respondió con estatus: ${res.statusCode}`);
    console.log(`📝 Respuesta del servidor: ${body}`);
    if (res.statusCode === 200) {
      console.log('✅ Simulación completada exitosamente. Revisa la base de datos y el panel administrativo.');
    } else {
      console.log('❌ Ocurrió un error al procesar el webhook.');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error conectando al servidor local (¿está encendido en el puerto 5000?): ${e.message}`);
});

req.write(payload);
req.end();
