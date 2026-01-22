const express = require('express');
const Joi = require('joi');
const Aadhar = require('../Aadhar');
const HealthRecord = require('../HealthRecord');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const aadharSchema = Joi.object({
  aadharNumber: Joi.string().pattern(/^\d{12}$/).required(),
  name: Joi.string().required(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  address: Joi.string().required()
});

const healthRecordSchema = Joi.object({
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  height: Joi.number().min(50).max(250),
  weight: Joi.number().min(10).max(300),
  allergies: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
      language: Joi.string().valid('ta', 'en').required()
    })
  ),
  chronicConditions: Joi.array().items(
    Joi.object({
      condition: Joi.string().required(),
      diagnosedDate: Joi.date(),
      language: Joi.string().valid('ta', 'en').required()
    })
  ),
  medications: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      dosage: Joi.string().required(),
      frequency: Joi.string().required(),
      startDate: Joi.date(),
      endDate: Joi.date(),
      language: Joi.string().valid('ta', 'en').required()
    })
  ),
  vaccinations: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      date: Joi.date().required(),
      nextDue: Joi.date()
    })
  )
});

// GET /api/health-id
router.get('/', auth, async (req, res) => {
  try {
    const aadhar = await Aadhar.findOne({ userId: req.user.userId });
    const healthRecord = await HealthRecord.findOne({ userId: req.user.userId });

    res.json({
      aadhar,
      healthRecord,
      hasHealthId: !!(aadhar && healthRecord)
    });
  } catch (error) {
    console.error('Get health ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/health-id
router.put('/', auth, async (req, res) => {
  try {
    const { aadhar: aadharData, healthRecord: healthRecordData } = req.body;

    // Validate Aadhar data if provided
    if (aadharData) {
      const { error } = aadharSchema.validate(aadharData);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // Check if Aadhar number already exists for another user
      const existingAadhar = await Aadhar.findOne({ 
        aadharNumber: aadharData.aadharNumber,
        userId: { $ne: req.user.userId }
      });

      if (existingAadhar) {
        return res.status(400).json({ 
          error: 'Aadhar number already registered with another account' 
        });
      }

      // Update or create Aadhar record
      await Aadhar.findOneAndUpdate(
        { userId: req.user.userId },
        { ...aadharData, userId: req.user.userId },
        { upsert: true, new: true }
      );
    }

    // Validate and update health record if provided
    if (healthRecordData) {
      const { error } = healthRecordSchema.validate(healthRecordData);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      await HealthRecord.findOneAndUpdate(
        { userId: req.user.userId },
        { ...healthRecordData, userId: req.user.userId, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
    }

    // Fetch updated records
    const updatedAadhar = await Aadhar.findOne({ userId: req.user.userId });
    const updatedHealthRecord = await HealthRecord.findOne({ userId: req.user.userId });

    res.json({
      message: 'Health ID updated successfully',
      aadhar: updatedAadhar,
      healthRecord: updatedHealthRecord
    });
  } catch (error) {
    console.error('Update health ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/health-id/qr
router.get('/qr', auth, async (req, res) => {
  try {
    const aadhar = await Aadhar.findOne({ userId: req.user.userId });
    const healthRecord = await HealthRecord.findOne({ userId: req.user.userId });

    if (!aadhar || !healthRecord) {
      return res.status(404).json({ 
        error: 'Complete health ID setup required' 
      });
    }

    // Generate QR code data
    const qrData = {
      userId: req.user.userId,
      aadharNumber: aadhar.aadharNumber.slice(-4), // Only last 4 digits
      name: aadhar.name,
      bloodGroup: healthRecord.bloodGroup,
      emergencyContacts: healthRecord.emergencyContacts || [],
      allergies: healthRecord.allergies || [],
      chronicConditions: healthRecord.chronicConditions || [],
      generatedAt: new Date().toISOString()
    };

    res.json({
      qrData: JSON.stringify(qrData),
      displayData: {
        name: aadhar.name,
        bloodGroup: healthRecord.bloodGroup,
        lastUpdated: healthRecord.lastUpdated
      }
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;