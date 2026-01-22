const mongoose = require('mongoose');

const healthVideoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  titleTranslations: {
    ta: String,
    en: String
  },
  description: String,
  descriptionTranslations: {
    ta: String,
    en: String
  },
  category: {
    type: String,
    required: true,
    enum: ['nutrition', 'exercise', 'mental-health', 'disease-prevention', 'maternal-health', 'child-health', 'elderly-care', 'general']
  },
  categoryTranslations: {
    ta: String,
    en: String
  },
  language: {
    type: String,
    enum: ['ta', 'en'],
    required: true
  },
  duration: String, // "PT5M30S" format
  thumbnailUrl: String,
  publishedAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  ageGroup: {
    type: String,
    enum: ['children', 'adults', 'elderly', 'all'],
    default: 'all'
  }
}, {
  timestamps: true
});

healthVideoSchema.index({ category: 1, language: 1 });
healthVideoSchema.index({ language: 1 });
healthVideoSchema.index({ tags: 1 });

module.exports = mongoose.model('HealthVideo', healthVideoSchema);