const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('=== COLLECTIONS ===');
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`- Collection: ${coll.name} | Documents count: ${count}`);
      
      if (count > 0) {
        const doc = await mongoose.connection.db.collection(coll.name).findOne();
        console.log(`  Sample doc:`, JSON.stringify(doc).substring(0, 300));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
