const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const Hospital = require('../Hospital');
const Doctor = require('../Doctor');
const Consultation = require('../Consultation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const bookConsultationSchema = Joi.object({
  doctorId: Joi.string().required(),
  hospitalId: Joi.string().required(),
  scheduledAt: Joi.date().min('now').required(),
  type: Joi.string().valid('video', 'phone', 'in-person').default('video'),
  symptomCheckId: Joi.string().optional(),
  notes: Joi.string().max(500).optional()
});

// GET /api/consult/hospitals
router.get('/hospitals', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 50, language = 'en' } = req.query;

    let query = { isActive: true };
    let hospitals;

    if (latitude && longitude) {
      // Find hospitals within radius (in km)
      hospitals = await Hospital.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
          }
        }
      }).select('name nameTranslations address location contact specialties rating emergencyServices');
    } else {
      hospitals = await Hospital.find(query)
        .select('name nameTranslations address location contact specialties rating emergencyServices')
        .limit(20);
    }

    // Localize hospital data
    const localizedHospitals = hospitals.map(hospital => ({
      ...hospital.toObject(),
      displayName: hospital.nameTranslations?.[language] || hospital.name,
      localizedSpecialties: hospital.specialties?.map(spec => ({
        ...spec,
        displayName: spec.nameTranslations?.[language] || spec.name
      }))
    }));

    res.json({ hospitals: localizedHospitals });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/consult/doctors
router.get('/doctors', auth, async (req, res) => {
  try {
    const { hospitalId, specialization, language = 'en', available = false } = req.query;

    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }

    let query = { 
      hospitalId, 
      isActive: true 
    };

    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    if (available === 'true') {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      query['availability.day'] = today;
    }

    const doctors = await Doctor.find(query)
      .populate('hospitalId', 'name nameTranslations')
      .select('name specialization specializationTranslations qualifications experience languages availability consultationFee rating totalConsultations profileImage');

    // Localize doctor data
    const localizedDoctors = doctors.map(doctor => ({
      ...doctor.toObject(),
      displaySpecialization: doctor.specializationTranslations?.[language] || doctor.specialization,
      hospital: {
        ...doctor.hospitalId.toObject(),
        displayName: doctor.hospitalId.nameTranslations?.[language] || doctor.hospitalId.name
      }
    }));

    res.json({ doctors: localizedDoctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/consult/book
router.post('/book', auth, async (req, res) => {
  try {
    const { error, value } = bookConsultationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { doctorId, hospitalId, scheduledAt, type, symptomCheckId, notes } = value;

    // Verify doctor and hospital exist
    const doctor = await Doctor.findOne({ _id: doctorId, hospitalId, isActive: true });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found or not available' });
    }

    const hospital = await Hospital.findOne({ _id: hospitalId, isActive: true });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // Check if doctor is available at the scheduled time
    const scheduledDate = new Date(scheduledAt);
    const dayOfWeek = scheduledDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const scheduledTime = scheduledDate.toTimeString().slice(0, 5);

    const availability = doctor.availability.find(avail => avail.day === dayOfWeek);
    if (!availability || scheduledTime < availability.startTime || scheduledTime > availability.endTime) {
      return res.status(400).json({ error: 'Doctor not available at the selected time' });
    }

    // Check for conflicting appointments
    const conflictingConsultation = await Consultation.findOne({
      doctorId,
      scheduledAt: {
        $gte: new Date(scheduledDate.getTime() - 30 * 60000), // 30 minutes before
        $lte: new Date(scheduledDate.getTime() + 30 * 60000)  // 30 minutes after
      },
      status: { $in: ['scheduled', 'ongoing'] }
    });

    if (conflictingConsultation) {
      return res.status(400).json({ error: 'Time slot not available' });
    }

    // Generate meeting ID for video calls
    const meetingId = type === 'video' ? uuidv4() : null;
    const meetingLink = meetingId ? `${process.env.FRONTEND_URL}/consult/session?meetingId=${meetingId}` : null;

    // Create consultation
    const consultation = new Consultation({
      userId: req.user.userId,
      doctorId,
      hospitalId,
      symptomCheckId,
      scheduledAt,
      type,
      meetingId,
      meetingLink,
      fee: doctor.consultationFee,
      notes: notes ? { symptoms: notes } : undefined
    });

    await consultation.save();

    // Update doctor's consultation count
    await Doctor.findByIdAndUpdate(doctorId, { 
      $inc: { totalConsultations: 1 } 
    });

    // Populate consultation data
    const populatedConsultation = await Consultation.findById(consultation._id)
      .populate('doctorId', 'name specialization profileImage')
      .populate('hospitalId', 'name address contact');

    res.json({
      message: 'Consultation booked successfully',
      consultation: populatedConsultation
    });
  } catch (error) {
    console.error('Book consultation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/consult/history
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let query = { userId: req.user.userId };
    if (status) {
      query.status = status;
    }

    const consultations = await Consultation.find(query)
      .populate('doctorId', 'name specialization profileImage')
      .populate('hospitalId', 'name address')
      .populate('prescription')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Consultation.countDocuments(query);

    res.json({
      consultations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get consultation history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/consult/:consultationId
router.get('/:consultationId', auth, async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.consultationId,
      userId: req.user.userId
    })
    .populate('doctorId', 'name specialization profileImage languages')
    .populate('hospitalId', 'name address contact')
    .populate('prescription');

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json({ consultation });
  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/consult/:consultationId/status
router.put('/:consultationId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.consultationId, userId: req.user.userId },
      { status },
      { new: true }
    );

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json({
      message: 'Consultation status updated',
      consultation
    });
  } catch (error) {
    console.error('Update consultation status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;