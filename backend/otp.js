// Mock OTP storage (use Redis in production)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (mock implementation)
const sendOTP = async (mobile, language = 'ta') => {
  try {
    const otp = generateOTP();
    
    // Store OTP with 5-minute expiry
    otpStore.set(mobile, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });

    // Mock SMS sending
    if (process.env.OTP_SERVICE === 'mock') {
      console.log(`📱 Mock OTP for ${mobile}: ${otp}`);
      return true;
    }

    // Real SMS implementation (Twilio example)
    if (process.env.OTP_SERVICE === 'twilio') {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const message = language === 'ta' 
        ? `உங்கள் மருத்துவன் OTP: ${otp}. இது 5 நிமிடங்களுக்கு மட்டுமே செல்லுபடியாகும்.`
        : `Your Maruthuvan OTP: ${otp}. Valid for 5 minutes only.`;

      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${mobile}`
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Send OTP error:', error);
    return false;
  }
};

// Verify OTP
const verifyOTP = async (mobile, otp) => {
  try {
    const storedData = otpStore.get(mobile);
    
    if (!storedData) {
      return false; // No OTP found
    }

    // Check expiry
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(mobile);
      return false; // OTP expired
    }

    // Check attempts (max 3)
    if (storedData.attempts >= 3) {
      otpStore.delete(mobile);
      return false; // Too many attempts
    }

    // Verify OTP
    if (storedData.otp === otp) {
      otpStore.delete(mobile); // Remove OTP after successful verification
      return true;
    } else {
      // Increment attempts
      storedData.attempts += 1;
      otpStore.set(mobile, storedData);
      return false;
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return false;
  }
};

// Resend OTP (with rate limiting)
const resendOTP = async (mobile, language = 'ta') => {
  try {
    const storedData = otpStore.get(mobile);
    
    // Rate limiting: allow resend only after 1 minute
    if (storedData && (Date.now() - (storedData.expiresAt - 5 * 60 * 1000)) < 60 * 1000) {
      return false; // Too soon to resend
    }

    return await sendOTP(mobile, language);
  } catch (error) {
    console.error('Resend OTP error:', error);
    return false;
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP
};