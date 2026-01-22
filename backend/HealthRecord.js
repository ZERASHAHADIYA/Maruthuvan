const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  height: Number, // in cm
  weight: Number, // in kg
  allergies: [{
    name: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    language: {
      type: String,
      enum: ['ta', 'en']
    }
  }],
  chronicConditions: [{
    condition: String,
    diagnosedDate: Date,
    language: {
      type: String,
      enum: ['ta', 'en']
    }
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    language: {
      type: String,
      enum: ['ta', 'en']
    }
  }],
  vaccinations: [{
    name: String,
    date: Date,
    nextDue: Date
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

healthRecordSchema.index({ userId: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);