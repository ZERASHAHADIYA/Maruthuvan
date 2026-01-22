const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  specializationTranslations: {
    ta: String,
    en: String
  },
  qualifications: [String],
  experience: Number, // years
  languages: [{
    type: String,
    enum: ['ta', 'en', 'hi']
  }],
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String, // "09:00"
    endTime: String,   // "17:00"
  }],
  consultationFee: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalConsultations: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: String
}, {
  timestamps: true
});

doctorSchema.index({ hospitalId: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ languages: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);