const mongoose = require('mongoose');

const aadharSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{12}$/
  },
  name: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  address: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

aadharSchema.index({ userId: 1 });
aadharSchema.index({ aadharNumber: 1 });

module.exports = mongoose.model('Aadhar', aadharSchema);