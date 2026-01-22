const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  medications: [{
    name: {
      type: String,
      required: true
    },
    nameTranslations: {
      ta: String,
      en: String
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: String,
    instructionsTranslations: {
      ta: String,
      en: String
    }
  }],
  diagnosis: {
    type: String,
    required: true
  },
  diagnosisTranslations: {
    ta: String,
    en: String
  },
  instructions: String,
  instructionsTranslations: {
    ta: String,
    en: String
  },
  followUpDate: Date,
  language: {
    type: String,
    enum: ['ta', 'en'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

prescriptionSchema.index({ userId: 1, createdAt: -1 });
prescriptionSchema.index({ consultationId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);