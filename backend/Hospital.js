const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  nameTranslations: {
    ta: String,
    en: String
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  specialties: [{
    name: String,
    nameTranslations: {
      ta: String,
      en: String
    }
  }],
  facilities: [String],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emergencyServices: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ name: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);