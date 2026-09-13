/**
 * scripts/backup_db.js
 * ─────────────────────────────────────────────────────────────
 * Respaldo manual de la base de datos completa a archivos JSON,
 * uno por colección, dentro de una carpeta con fecha y hora.
 *
 * No requiere mongodump/mongosh instalados — usa el driver de
 * MongoDB que ya trae este proyecto.
 *
 * USO:
 *   MONGO_URI="mongodb+srv://usuario:password@host/?appName=Cluster0" node scripts/backup_db.js
 *
 * La cadena de conexión se pasa por variable de entorno en el momento
 * de ejecutar el script — nunca se guarda en este archivo ni en el
 * repositorio.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Falta la variable de entorno MONGO_URI (o MONGODB_URI) con la cadena de conexión.');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, '..', 'backups', `backup_${timestamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  console.log(`Conectado. Base de datos: ${db.databaseName}`);

  const collections = await db.listCollections().toArray();
  console.log(`Respaldando ${collections.length} colecciones en: ${outDir}\n`);

  let totalDocs = 0;
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(
      path.join(outDir, `${name}.json`),
      JSON.stringify(docs, null, 2)
    );
    console.log(`  ${name}: ${docs.length} documentos`);
    totalDocs += docs.length;
  }

  await client.close();
  console.log(`\nListo. ${totalDocs} documentos respaldados en total.`);
  console.log(`Carpeta: ${outDir}`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
