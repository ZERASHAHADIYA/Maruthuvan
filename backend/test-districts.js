const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Get DiagnosticLab model
    const DiagnosticLab = mongoose.model('DiagnosticLab', new mongoose.Schema({
      labId: String,
      labName: String,
      district: String,
      city: String,
      isActive: Boolean
    }));
    
    // Count total labs
    const totalLabs = await DiagnosticLab.countDocuments();
    console.log(`\n📊 Total labs in database: ${totalLabs}`);
    
    // Get all labs
    const allLabs = await DiagnosticLab.find({});
    console.log('\n🏥 All labs:');
    allLabs.forEach(lab => {
      console.log(`  - ${lab.labName} | District: ${lab.district} | City: ${lab.city}`);
    });
    
    // Get distinct districts
    const districts = await DiagnosticLab.distinct('district', { isActive: true });
    console.log(`\n📍 Districts (${districts.length}):`, districts);
    
    // Get cities for each district
    for (const district of districts) {
      const cities = await DiagnosticLab.distinct('city', { district, isActive: true });
      console.log(`  ${district}: ${cities.join(', ')}`);
    }
    
    mongoose.connection.close();
    console.log('\n✅ Test complete');
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
