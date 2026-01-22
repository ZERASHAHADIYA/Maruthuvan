const mongoose = require('mongoose');

const healthChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  language: {
    type: String,
    enum: ['ta', 'en'],
    required: true
  },
  topic: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

healthChatSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('HealthChat', healthChatSchema);