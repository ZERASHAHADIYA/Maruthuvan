const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../User');
const { sendOTP, verifyOTP } = require('../utils/otp');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const sendOTPSchema = Joi.object({
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  language: Joi.string().valid('ta', 'en').default('ta')
});

const verifyOTPSchema = Joi.object({
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  otp: Joi.string().length(6).required(),
  name: Joi.string().min(2).max(50),
  language: Joi.string().valid('ta', 'en').default('ta')
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { error, value } = sendOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { mobile, language } = value;
    
    // Send OTP
    const otpSent = await sendOTP(mobile, language);
    if (!otpSent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ 
      message: language === 'ta' ? 'OTP அனுப்பப்பட்டது' : 'OTP sent successfully',
      mobile 
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { error, value } = verifyOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { mobile, otp, name, language } = value;

    // Verify OTP
    const isValidOTP = await verifyOTP(mobile, otp);
    if (!isValidOTP) {
      return res.status(400).json({ 
        error: language === 'ta' ? 'தவறான OTP' : 'Invalid OTP' 
      });
    }

    // Find or create user
    let user = await User.findOne({ mobile });
    
    if (!user) {
      if (!name) {
        return res.status(400).json({ 
          error: language === 'ta' ? 'பெயர் தேவை' : 'Name is required for new users' 
        });
      }
      
      user = new User({
        mobile,
        name,
        language,
        isVerified: true
      });
      await user.save();
    } else {
      user.isVerified = true;
      user.lastLogin = new Date();
      if (language) user.language = language;
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, mobile: user.mobile },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: language === 'ta' ? 'வெற்றிகரமாக உள்நுழைந்தீர்கள்' : 'Login successful',
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        language: user.language,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;