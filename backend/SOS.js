const express = require('express');
const Joi = require('joi');
const SOS = require('../SOS');
const { auth } = require('../middleware/auth');
const { triggerEmergencyCall } = require('../utils/emergency');

const router = express.Router();

// Validation schema
const sosSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  address: Joi.string().max(200),
  emergencyType: Joi.string().valid('medical', 'accident', 'fire', 'police', 'general').default('medical'),
  description: Joi.string().max(500),
  language: Joi.string().valid('ta', 'en').required()
});

// POST /api/sos/trigger
router.post('/trigger', auth, async (req, res) => {
  try {
    const { error, value } = sosSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { location, address, emergencyType, description, language } = value;

    // Create SOS record
    const sos = new SOS({
      userId: req.user.userId,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      address,
      emergencyType,
      description,
      language,
      status: 'active',
      priority: 'critical'
    });

    await sos.save();

    // Trigger emergency calls
    try {
      const callResults = await triggerEmergencyCall(sos, language);
      sos.callLogs = callResults;
      await sos.save();
    } catch (callError) {
      console.error('Emergency call error:', callError);
      // Continue even if calls fail - SOS is still recorded
    }

    // Emit SOS event via WebSocket (handled in socket handlers)
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.userId}`).emit('sos_triggered', {
        sosId: sos._id,
        status: 'active',
        message: language === 'ta' 
          ? 'அவசர சேவைகள் அறிவிக்கப்பட்டன' 
          : 'Emergency services have been notified'
      });

      // Notify nearby hospitals/emergency services (future feature)
      io.emit('emergency_alert', {
        sosId: sos._id,
        location: sos.location,
        emergencyType: sos.emergencyType,
        priority: sos.priority
      });
    }

    res.json({
      message: language === 'ta' 
        ? 'SOS சிக்னல் அனுப்பப்பட்டது. அவசர சேவைகள் அறிவிக்கப்பட்டன.' 
        : 'SOS signal sent. Emergency services have been notified.',
      sos: {
        id: sos._id,
        status: sos.status,
        emergencyType: sos.emergencyType,
        createdAt: sos.createdAt
      }
    });
  } catch (error) {
    console.error('SOS trigger error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sos/history
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sosRecords = await SOS.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('emergencyType status priority createdAt responseTime resolvedAt location address');

    const total = await SOS.countDocuments({ userId: req.user.userId });

    res.json({
      sosRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get SOS history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sos/:sosId
router.get('/:sosId', auth, async (req, res) => {
  try {
    const sos = await SOS.findOne({
      _id: req.params.sosId,
      userId: req.user.userId
    });

    if (!sos) {
      return res.status(404).json({ error: 'SOS record not found' });
    }

    res.json({ sos });
  } catch (error) {
    console.error('Get SOS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/sos/:sosId/cancel
router.put('/:sosId/cancel', auth, async (req, res) => {
  try {
    const sos = await SOS.findOneAndUpdate(
      { 
        _id: req.params.sosId, 
        userId: req.user.userId,
        status: 'active'
      },
      { 
        status: 'cancelled',
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!sos) {
      return res.status(404).json({ error: 'Active SOS record not found' });
    }

    // Emit cancellation event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.userId}`).emit('sos_cancelled', {
        sosId: sos._id,
        status: 'cancelled'
      });

      io.emit('emergency_cancelled', {
        sosId: sos._id
      });
    }

    res.json({
      message: 'SOS cancelled successfully',
      sos
    });
  } catch (error) {
    console.error('Cancel SOS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sos/active/status
router.get('/active/status', auth, async (req, res) => {
  try {
    const activeSOS = await SOS.findOne({
      userId: req.user.userId,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      hasActiveSOS: !!activeSOS,
      activeSOS: activeSOS || null
    });
  } catch (error) {
    console.error('Get active SOS status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;