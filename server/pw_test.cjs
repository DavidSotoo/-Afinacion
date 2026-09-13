const { chromium } = require('playwright');
const mongoose = require('mongoose');

// Connect to DB to check the created folios later
require('dotenv').config({ path: 'server/.env' });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- EXECUTING SCENARIO 1 ---');
  // Iridium, Mobil Super Sintético 5L, Servicio Medio
  await page.goto('http://localhost:5173/catalogo');
  await page.selectOption('select.sel-marca', 'Chevrolet');
  await page.selectOption('select.sel-modelo', 'Suburban');
  await page.selectOption('select.sel-anio', '1994');
  await page.click('button:has-text("BUSCAR")');
  await page.waitForSelector('text=VER KITS DE AFINACIÓN');
  await page.click('text=VER KITS DE AFINACIÓN');
  
  await page.waitForSelector('text=Iridium IX');
  
  // Choose Iridium
  await page.click('div:has-text("Iridium IX") button:has-text("Agregar Kit Completo al Carrito")');
  
  // Cart opens, wait for drawer
  await page.waitForSelector('.fixed.inset-y-0.right-0');
  
  // Ensure Synthetic 5L
  await page.selectOption('select[aria-label="Aceite de motor"]', { label: 'Mobil Super Sintético 5W-30 (Garrafa 5 Litros)' });
  
  // IR AL CHECKOUT
  await page.click('button:has-text("IR AL CHECKOUT")');
  
  // Checkout page
  await page.waitForSelector('text=Proceso de Pago');
  
  // Delivery
  await page.click('input[value="taller"]'); // Instalación en Taller
  
  // Service
  await page.click('input[value="medio"]'); // Servicio Medio
  
  // Wait for total calculation update
  await page.waitForTimeout(500);
  
  // Get Frontend total
  let totalText = await page.textContent('.text-3xl.font-bold');
  console.log('FRONTEND TOTAL (Escenario 1):', totalText);
  
  // Payment Method
  await page.click('input[value="tarjeta"]'); // Mercado Pago
  
  // Fill form
  await page.fill('input[placeholder="Tu nombre completo"]', 'Test Automático S1');
  await page.fill('input[placeholder="Teléfono"]', '3331112222');
  
  // Capture the POST request to API
  let folio1 = null;
  page.on('response', async res => {
    if (res.url().includes('/api/cotizaciones') && res.request().method() === 'POST') {
      const body = await res.json();
      folio1 = body.folio;
      console.log('POST /api/cotizaciones SUCCESS -> Folio:', folio1);
    }
  });
  
  // Submit
  await page.click('button:has-text("CONFIRMAR PEDIDO")');
  
  // Wait for it to proceed to MP or finish
  await page.waitForTimeout(3000);

  // ----------------------------------------------------
  console.log('\n--- EXECUTING SCENARIO 2 ---');
  // Clear cart & go back to catalog
  await page.goto('http://localhost:5173/catalogo');
  // clear cart by clicking the cart icon, then Vaciar carrito
  await page.click('button:has-text("0")'); // This opens cart? No, it might not be 0.
  // Actually, we can clear local storage
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.selectOption('select.sel-marca', 'Chevrolet');
  await page.selectOption('select.sel-modelo', 'Suburban');
  await page.selectOption('select.sel-anio', '1994');
  await page.click('button:has-text("BUSCAR")');
  await page.waitForSelector('text=VER KITS DE AFINACIÓN');
  await page.click('text=VER KITS DE AFINACIÓN');
  
  await page.waitForSelector('text=Stock / Original');
  
  // Add Stock kit
  // We need to click the specific button inside the Stock card.
  await page.click('text=Stock / Original >> .. >> button:has-text("Agregar Kit Completo")');
  
  // Cart drawer opens
  await page.waitForSelector('.fixed.inset-y-0.right-0');
  
  // Exclude air filter
  // It's a checkbox next to Filtro de Aire
  // Let's click the span or input near 'Filtro de Aire'
  // Playwright text selector
  await page.click('text=Filtro de Aire');
  
  await page.click('button:has-text("IR AL CHECKOUT")');
  
  await page.waitForSelector('text=Proceso de Pago');
  await page.click('input[value="taller"]'); // Instalación en Taller
  await page.click('input[value="ninguno"]'); // Servicio Ninguno
  await page.click('input[value="tarjeta"]'); // Mercado Pago
  
  await page.waitForTimeout(500);
  let totalText2 = await page.textContent('.text-3xl.font-bold');
  console.log('FRONTEND TOTAL (Escenario 2):', totalText2);
  
  await page.fill('input[placeholder="Tu nombre completo"]', 'Test Automático S2');
  await page.fill('input[placeholder="Teléfono"]', '3331112222');
  
  let folio2 = null;
  page.on('response', async res => {
    if (res.url().includes('/api/cotizaciones') && res.request().method() === 'POST') {
      const body = await res.json();
      if (body.folio && body.folio !== folio1) {
        folio2 = body.folio;
        console.log('POST /api/cotizaciones SUCCESS -> Folio:', folio2);
      }
    }
  });
  
  await page.click('button:has-text("CONFIRMAR PEDIDO")');
  await page.waitForTimeout(3000);
  
  await browser.close();

  // ----------------------------------------------------
  console.log('\n--- VERIFYING BACKEND DB ---');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  if (folio1) {
    const doc1 = await db.collection('cotizacions').findOne({ folio: folio1 });
    console.log(`Folio ${folio1} (DB totalFinal): $${doc1?.totalFinal}`);
  }
  
  if (folio2) {
    const doc2 = await db.collection('cotizacions').findOne({ folio: folio2 });
    console.log(`Folio ${folio2} (DB totalFinal): $${doc2?.totalFinal}`);
  }
  
  process.exit(0);
})();
