const express = require('express');
const Joi = require('joi');
const User = require('../User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schema
const updateLanguageSchema = Joi.object({
  language: Joi.string().valid('ta', 'en').required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    address: Joi.string().max(200)
  }),
  emergencyContacts: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
      relation: Joi.string().required()
    })
  ).max(3)
});

// PUT /api/user/language
router.put('/language', auth, async (req, res) => {
  try {
    const { error, value } = updateLanguageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { language } = value;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { language },
      { new: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: language === 'ta' ? 'மொழி புதுப்பிக்கப்பட்டது' : 'Language updated successfully',
      user
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { ...value },
      { new: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: user.language === 'ta' ? 'சுயவிவரம் புதுப்பிக்கப்பட்டது' : 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;