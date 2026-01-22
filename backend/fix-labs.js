const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Drop the collections
    await mongoose.connection.db.dropCollection('diagnosticlabs').catch(() => console.log('diagnosticlabs not found'));
    await mongoose.connection.db.dropCollection('labtests').catch(() => console.log('labtests not found'));
    
    console.log('🗑️  Old lab data deleted');
    console.log('✅ Now restart the backend server to seed fresh data');
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
