const mongoose = require('mongoose');
const Hospital = require('./Hospital');
const Doctor = require('./Doctor');
const HealthVideo = require('./HealthVideo');
require('dotenv').config();

// Sample hospitals data
const sampleHospitals = [
  {
    name: 'Government General Hospital',
    nameTranslations: {
      ta: 'அரசு பொது மருத்துவமனை',
      en: 'Government General Hospital'
    },
    address: 'Park Town, Chennai, Tamil Nadu 600003',
    location: {
      type: 'Point',
      coordinates: [80.2707, 13.0827] // [longitude, latitude]
    },
    contact: {
      phone: '+91-44-2819-3000',
      email: 'ggh.chennai@tn.gov.in'
    },
    specialties: [
      {
        name: 'Emergency Medicine',
        nameTranslations: {
          ta: 'அவசர மருத்துவம்',
          en: 'Emergency Medicine'
        }
      },
      {
        name: 'General Medicine',
        nameTranslations: {
          ta: 'பொது மருத்துவம்',
          en: 'General Medicine'
        }
      },
      {
        name: 'Cardiology',
        nameTranslations: {
          ta: 'இதய மருத்துவம்',
          en: 'Cardiology'
        }
      }
    ],
    facilities: ['Emergency Care', 'ICU', 'Laboratory', 'Pharmacy'],
    rating: 4.2,
    emergencyServices: true
  },
  {
    name: 'Apollo Hospital',
    nameTranslations: {
      ta: 'அப்போலோ மருத்துவமனை',
      en: 'Apollo Hospital'
    },
    address: 'Greams Road, Chennai, Tamil Nadu 600006',
    location: {
      type: 'Point',
      coordinates: [80.2518, 13.0569]
    },
    contact: {
      phone: '+91-44-2829-3333',
      email: 'info@apollohospitals.com'
    },
    specialties: [
      {
        name: 'Cardiology',
        nameTranslations: {
          ta: 'இதய மருத்துவம்',
          en: 'Cardiology'
        }
      },
      {
        name: 'Neurology',
        nameTranslations: {
          ta: 'நரம்பியல்',
          en: 'Neurology'
        }
      },
      {
        name: 'Oncology',
        nameTranslations: {
          ta: 'புற்றுநோய் மருத்துவம்',
          en: 'Oncology'
        }
      }
    ],
    facilities: ['Emergency Care', 'ICU', 'Laboratory', 'Pharmacy', 'Radiology'],
    rating: 4.5,
    emergencyServices: true
  }
];

// Sample doctors data
const sampleDoctors = [
  {
    name: 'Dr. Rajesh Kumar',
    specialization: 'General Medicine',
    specializationTranslations: {
      ta: 'பொது மருத்துவம்',
      en: 'General Medicine'
    },
    qualifications: ['MBBS', 'MD'],
    experience: 15,
    languages: ['ta', 'en'],
    availability: [
      { day: 'monday', startTime: '09:00', endTime: '17:00' },
      { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'friday', startTime: '09:00', endTime: '17:00' },
      { day: 'saturday', startTime: '09:00', endTime: '13:00' }
    ],
    consultationFee: 500,
    rating: 4.3
  },
  {
    name: 'Dr. Priya Sharma',
    specialization: 'Cardiology',
    specializationTranslations: {
      ta: 'இதய மருத்துவம்',
      en: 'Cardiology'
    },
    qualifications: ['MBBS', 'MD', 'DM Cardiology'],
    experience: 12,
    languages: ['ta', 'en'],
    availability: [
      { day: 'monday', startTime: '10:00', endTime: '16:00' },
      { day: 'wednesday', startTime: '10:00', endTime: '16:00' },
      { day: 'friday', startTime: '10:00', endTime: '16:00' }
    ],
    consultationFee: 800,
    rating: 4.6
  },
  {
    name: 'Dr. Murugan Selvam',
    specialization: 'Emergency Medicine',
    specializationTranslations: {
      ta: 'அவசர மருத்துவம்',
      en: 'Emergency Medicine'
    },
    qualifications: ['MBBS', 'MD Emergency Medicine'],
    experience: 8,
    languages: ['ta', 'en'],
    availability: [
      { day: 'monday', startTime: '00:00', endTime: '23:59' },
      { day: 'tuesday', startTime: '00:00', endTime: '23:59' },
      { day: 'wednesday', startTime: '00:00', endTime: '23:59' },
      { day: 'thursday', startTime: '00:00', endTime: '23:59' },
      { day: 'friday', startTime: '00:00', endTime: '23:59' },
      { day: 'saturday', startTime: '00:00', endTime: '23:59' },
      { day: 'sunday', startTime: '00:00', endTime: '23:59' }
    ],
    consultationFee: 600,
    rating: 4.4
  }
];

// Sample health videos
const sampleHealthVideos = [
  {
    videoId: 'sample_ta_1',
    title: 'நீரிழிவு நோய் மேலாண்மை',
    titleTranslations: {
      ta: 'நீரிழிவு நோய் மேலாண்மை',
      en: 'Diabetes Management'
    },
    description: 'நீரிழிவு நோயை எவ்வாறு கட்டுப்படுத்துவது என்பது பற்றிய முழுமையான வழிகாட்டி',
    descriptionTranslations: {
      ta: 'நீரிழிவு நோயை எவ்வாறு கட்டுப்படுத்துவது என்பது பற்றிய முழுமையான வழிகாட்டி',
      en: 'Complete guide on how to manage diabetes effectively'
    },
    category: 'disease-prevention',
    categoryTranslations: {
      ta: 'நோய் தடுப்பு',
      en: 'Disease Prevention'
    },
    language: 'ta',
    duration: 'PT10M30S',
    thumbnailUrl: 'https://img.youtube.com/vi/sample_ta_1/maxresdefault.jpg',
    publishedAt: new Date('2024-01-15'),
    viewCount: 1250,
    tags: ['நீரிழிவு', 'சர்க்கரை நோய்', 'மருத்துவம்'],
    ageGroup: 'adults'
  },
  {
    videoId: 'sample_en_1',
    title: 'Heart Health Tips',
    titleTranslations: {
      ta: 'இதய ஆரோக்கிய குறிப்புகள்',
      en: 'Heart Health Tips'
    },
    description: 'Essential tips for maintaining a healthy heart and preventing cardiovascular diseases',
    descriptionTranslations: {
      ta: 'ஆரோக்கியமான இதயத்தை பராமரிக்க மற்றும் இதய நோய்களை தடுக்க அத்தியாவசிய குறிப்புகள்',
      en: 'Essential tips for maintaining a healthy heart and preventing cardiovascular diseases'
    },
    category: 'disease-prevention',
    categoryTranslations: {
      ta: 'நோய் தடுப்பு',
      en: 'Disease Prevention'
    },
    language: 'en',
    duration: 'PT8M45S',
    thumbnailUrl: 'https://img.youtube.com/vi/sample_en_1/maxresdefault.jpg',
    publishedAt: new Date('2024-01-20'),
    viewCount: 890,
    tags: ['heart', 'cardiovascular', 'health', 'prevention'],
    ageGroup: 'adults'
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maruthuvan');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    await HealthVideo.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Seed hospitals
    const hospitals = await Hospital.insertMany(sampleHospitals);
    console.log(`✅ Seeded ${hospitals.length} hospitals`);

    // Seed doctors (assign to hospitals)
    const doctorsWithHospitals = sampleDoctors.map((doctor, index) => ({
      ...doctor,
      hospitalId: hospitals[index % hospitals.length]._id
    }));

    const doctors = await Doctor.insertMany(doctorsWithHospitals);
    console.log(`✅ Seeded ${doctors.length} doctors`);

    // Seed health videos
    const videos = await HealthVideo.insertMany(sampleHealthVideos);
    console.log(`✅ Seeded ${videos.length} health videos`);

    console.log('🎉 Database seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`Hospitals: ${hospitals.length}`);
    console.log(`Doctors: ${doctors.length}`);
    console.log(`Health Videos: ${videos.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };