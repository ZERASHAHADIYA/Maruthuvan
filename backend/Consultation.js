const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
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
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  symptomCheckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SymptomCheck'
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['video', 'phone', 'in-person'],
    default: 'video'
  },
  meetingId: {
    type: String,
    unique: true
  },
  meetingLink: String,
  duration: Number, // minutes
  notes: {
    symptoms: String,
    diagnosis: String,
    recommendations: String,
    language: {
      type: String,
      enum: ['ta', 'en']
    }
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  fee: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String
}, {
  timestamps: true
});

consultationSchema.index({ userId: 1, scheduledAt: -1 });
consultationSchema.index({ doctorId: 1, scheduledAt: -1 });
consultationSchema.index({ status: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);