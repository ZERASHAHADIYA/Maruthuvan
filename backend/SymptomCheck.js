const mongoose = require('mongoose');

const symptomCheckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: [{
    symptom: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    duration: String
  }],
  language: {
    type: String,
    enum: ['ta', 'en'],
    required: true
  },
  aiResponse: {
    diagnosis: String,
    recommendations: [String],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    requiresDoctor: Boolean,
    language: {
      type: String,
      enum: ['ta', 'en']
    }
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  status: {
    type: String,
    enum: ['pending', 'analyzed', 'consulted'],
    default: 'pending'
  }
}, {
  timestamps: true
});

symptomCheckSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SymptomCheck', symptomCheckSchema);