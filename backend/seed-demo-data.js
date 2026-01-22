// Run this script to add demo user and more hospitals/doctors
// Usage: node seed-demo-data.js

const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  mobile: String,
  aadhar: String,
  patientId: String,
  name: String,
  fatherName: String,
  dateOfBirth: Date,
  age: Number,
  gender: String,
  bloodGroup: String,
  address: String,
  allergies: [String],
  language: String,
  isVerified: Boolean
});

const hospitalSchema = new mongoose.Schema({
  name: String,
  nameTranslations: { ta: String, en: String },
  address: String,
  location: { type: { type: String }, coordinates: [Number] },
  specialties: [{ name: String, nameTranslations: { ta: String, en: String } }],
  rating: Number,
  isActive: Boolean
});

const doctorSchema = new mongoose.Schema({
  name: String,
  hospitalId: mongoose.Schema.Types.ObjectId,
  specialization: String,
  specializationTranslations: { ta: String, en: String },
  experience: Number,
  languages: [String],
  consultationFee: Number,
  rating: Number,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);
const Hospital = mongoose.model('Hospital', hospitalSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing data
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create demo user
    const demoUser = await User.create({
      mobile: '9876543210',
      aadhar: '345678903214',
      patientId: 'MARU-123456',
      name: 'Suryaprakash',
      fatherName: 'Kumar Prakash',
      dateOfBirth: new Date('1996-08-15'),
      age: 28,
      gender: 'Male',
      bloodGroup: 'B+',
      address: '123, Main Street, Madurai, Tamil Nadu - 625001',
      allergies: ['Peanuts', 'Dust'],
      language: 'en',
      isVerified: true
    });
    console.log('✅ Demo user created: Suryaprakash (Mobile: 9876543210, OTP: 121221)');

    // Chennai Hospitals
    const h1 = await Hospital.create({
      name: 'Government General Hospital',
      nameTranslations: { ta: 'அரசு பொது மருத்துவமனை', en: 'Government General Hospital' },
      address: 'Park Town, Chennai - 600003',
      location: { type: 'Point', coordinates: [80.2707, 13.0827] },
      rating: 4.5,
      isActive: true
    });

    const h2 = await Hospital.create({
      name: 'Rajiv Gandhi Government General Hospital',
      nameTranslations: { ta: 'ராஜீவ் காந்தி அரசு பொது மருத்துவமனை', en: 'Rajiv Gandhi Government General Hospital' },
      address: 'Perambur, Chennai - 600011',
      location: { type: 'Point', coordinates: [80.2337, 13.1185] },
      rating: 4.6,
      isActive: true
    });

    // Madurai Hospital
    const h3 = await Hospital.create({
      name: 'Government Rajaji Hospital',
      nameTranslations: { ta: 'அரசு ராஜாஜி மருத்துவமனை', en: 'Government Rajaji Hospital' },
      address: 'Madurai - 625020',
      location: { type: 'Point', coordinates: [78.1198, 9.9252] },
      rating: 4.7,
      isActive: true
    });

    // Coimbatore Hospital
    const h4 = await Hospital.create({
      name: 'Coimbatore Medical College Hospital',
      nameTranslations: { ta: 'கோயம்பத்தூர் மருத்துவ கல்லூரி மருத்துவமனை', en: 'Coimbatore Medical College Hospital' },
      address: 'Coimbatore - 641018',
      location: { type: 'Point', coordinates: [76.9558, 11.0168] },
      rating: 4.5,
      isActive: true
    });

    // Trichy Hospital
    const h5 = await Hospital.create({
      name: 'Mahatma Gandhi Memorial Government Hospital',
      nameTranslations: { ta: 'மகாத்மா காந்தி நினைவு அரசு மருத்துவமனை', en: 'Mahatma Gandhi Memorial Government Hospital' },
      address: 'Tiruchirappalli - 620001',
      location: { type: 'Point', coordinates: [78.6869, 10.7905] },
      rating: 4.4,
      isActive: true
    });

    // Salem Hospital
    const h6 = await Hospital.create({
      name: 'Government Mohan Kumaramangalam Medical College Hospital',
      nameTranslations: { ta: 'அரசு மோகன் குமாரமங்கலம் மருத்துவ கல்லூரி', en: 'Government Mohan Kumaramangalam Medical College Hospital' },
      address: 'Salem - 636030',
      location: { type: 'Point', coordinates: [78.1460, 11.6643] },
      rating: 4.3,
      isActive: true
    });

    console.log('✅ Created 6 hospitals');

    // Add doctors
    await Doctor.insertMany([
      // Chennai H1
      { name: 'Dr. Rajesh Kumar', hospitalId: h1._id, specialization: 'General Medicine', specializationTranslations: { ta: 'பொது மருத்துவம்', en: 'General Medicine' }, experience: 15, languages: ['ta', 'en'], consultationFee: 500, rating: 4.5, isActive: true },
      { name: 'Dr. Priya Sharma', hospitalId: h1._id, specialization: 'Cardiology', specializationTranslations: { ta: 'இதய மருத்துவம்', en: 'Cardiology' }, experience: 12, languages: ['ta', 'en'], consultationFee: 800, rating: 4.7, isActive: true },
      { name: 'Dr. Anitha Devi', hospitalId: h1._id, specialization: 'Dermatology', specializationTranslations: { ta: 'தோல் மருத்துவம்', en: 'Dermatology' }, experience: 10, languages: ['ta', 'en'], consultationFee: 600, rating: 4.6, isActive: true },
      
      // Chennai H2
      { name: 'Dr. Murugan Selvam', hospitalId: h2._id, specialization: 'Emergency Medicine', specializationTranslations: { ta: 'அவசர மருத்துவம்', en: 'Emergency Medicine' }, experience: 8, languages: ['ta', 'en'], consultationFee: 600, rating: 4.4, isActive: true },
      { name: 'Dr. Kavitha Ramesh', hospitalId: h2._id, specialization: 'Neurology', specializationTranslations: { ta: 'நரம்பு மருத்துவம்', en: 'Neurology' }, experience: 14, languages: ['ta', 'en'], consultationFee: 900, rating: 4.8, isActive: true },
      
      // Madurai H3
      { name: 'Dr. Senthil Kumar', hospitalId: h3._id, specialization: 'Cardiology', specializationTranslations: { ta: 'இதய மருத்துவம்', en: 'Cardiology' }, experience: 18, languages: ['ta', 'en'], consultationFee: 850, rating: 4.9, isActive: true },
      { name: 'Dr. Meena Lakshmi', hospitalId: h3._id, specialization: 'General Medicine', specializationTranslations: { ta: 'பொது மருத்துவம்', en: 'General Medicine' }, experience: 11, languages: ['ta', 'en'], consultationFee: 550, rating: 4.5, isActive: true },
      { name: 'Dr. Karthik Raj', hospitalId: h3._id, specialization: 'Orthopedics', specializationTranslations: { ta: 'எலும்பு மருத்துவம்', en: 'Orthopedics' }, experience: 13, languages: ['ta', 'en'], consultationFee: 700, rating: 4.6, isActive: true },
      
      // Coimbatore H4
      { name: 'Dr. Lakshmi Iyer', hospitalId: h4._id, specialization: 'Pediatrics', specializationTranslations: { ta: 'குழந்தை மருத்துவம்', en: 'Pediatrics' }, experience: 10, languages: ['ta', 'en'], consultationFee: 700, rating: 4.6, isActive: true },
      { name: 'Dr. Ramesh Babu', hospitalId: h4._id, specialization: 'ENT', specializationTranslations: { ta: 'காது, மூக்கு, தொண்டை', en: 'ENT' }, experience: 16, languages: ['ta', 'en'], consultationFee: 650, rating: 4.7, isActive: true },
      
      // Trichy H5
      { name: 'Dr. Vijay Kumar', hospitalId: h5._id, specialization: 'Orthopedics', specializationTranslations: { ta: 'எலும்பு மருத்துவம்', en: 'Orthopedics' }, experience: 12, languages: ['ta', 'en'], consultationFee: 750, rating: 4.5, isActive: true },
      { name: 'Dr. Divya Bharathi', hospitalId: h5._id, specialization: 'General Medicine', specializationTranslations: { ta: 'பொது மருத்துவம்', en: 'General Medicine' }, experience: 9, languages: ['ta', 'en'], consultationFee: 500, rating: 4.4, isActive: true },
      
      // Salem H6
      { name: 'Dr. Arun Patel', hospitalId: h6._id, specialization: 'Gynecology', specializationTranslations: { ta: 'மகப்பேறு மருத்துவம்', en: 'Gynecology' }, experience: 14, languages: ['ta', 'en'], consultationFee: 750, rating: 4.8, isActive: true },
      { name: 'Dr. Sangeetha Devi', hospitalId: h6._id, specialization: 'Pediatrics', specializationTranslations: { ta: 'குழந்தை மருத்துவம்', en: 'Pediatrics' }, experience: 11, languages: ['ta', 'en'], consultationFee: 650, rating: 4.7, isActive: true }
    ]);

    console.log('✅ Created 14 doctors');
    console.log('\n📋 DEMO USER CREDENTIALS:');
    console.log('Mobile: 9876543210');
    console.log('OTP: 121221');
    console.log('Aadhar: 3456-7890-3214');
    console.log('Patient ID: MARU-123456');
    console.log('Name: Suryaprakash');
    
    await mongoose.disconnect();
    console.log('\n✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedData();
