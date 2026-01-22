const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./User');

const router = express.Router();

// Mock OTP storage
const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile, language = 'ta' } = req.body;
    
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }

    const otp = generateOTP();
    otpStore.set(mobile, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    console.log(`📱 OTP for ${mobile}: ${otp}`);

    res.json({ 
      message: language === 'ta' ? 'OTP அனுப்பப்பட்டது' : 'OTP sent successfully',
      mobile,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp, name, language = 'ta' } = req.body;

    const storedData = otpStore.get(mobile);
    if (!storedData || Date.now() > storedData.expiresAt || storedData.otp !== otp) {
      return res.status(400).json({ 
        error: language === 'ta' ? 'தவறான OTP' : 'Invalid OTP' 
      });
    }

    otpStore.delete(mobile);

    let user = await User.findOne({ mobile });
    
    if (!user) {
      if (!name) {
        return res.status(400).json({ 
          error: language === 'ta' ? 'பெயர் தேவை' : 'Name required' 
        });
      }
      
      user = new User({ mobile, name, language, isVerified: true });
      await user.save();
    } else {
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, mobile: user.mobile },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: language === 'ta' ? 'வெற்றிகரமாக உள்நுழைந்தீர்கள்' : 'Login successful',
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;