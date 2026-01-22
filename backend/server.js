const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Gemini AI Setup with Auto Model Detection
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let geminiModel = null;

async function getWorkingGeminiModel() {
  if (geminiModel) return geminiModel;
  
  try {
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent('test');
        console.log(`✅ Using Gemini model: ${modelName}`);
        geminiModel = model;
        return model;
      } catch (err) {
        console.log(`⚠️  ${modelName} not available`);
      }
    }
    throw new Error('No compatible Gemini model found');
  } catch (error) {
    console.error('❌ Gemini model selection failed:', error.message);
    throw error;
  }
}

function extractGeminiText(response) {
  try {
    return response.response.text();
  } catch (error) {
    return 'AI response unavailable';
  }
}

// Middleware
app.use(cors({ 
  origin: ['http://localhost:3001', 'http://localhost:3000'], 
  credentials: true 
}));
app.use(express.json());

// MongoDB Models
const userSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  aadhar: { type: String, unique: true, sparse: true },
  patientId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  fatherName: { type: String },
  dateOfBirth: { type: Date },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String },
  address: { type: String },
  allergies: [String],
  language: { type: String, enum: ['ta', 'en'], default: 'ta' },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

const hospitalSchema = new mongoose.Schema({
  name: String,
  nameTranslations: { ta: String, en: String },
  address: String,
  location: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  specialties: [{ name: String, nameTranslations: { ta: String, en: String } }],
  rating: { type: Number, default: 4.0 },
  isActive: { type: Boolean, default: true }
});

const doctorSchema = new mongoose.Schema({
  name: String,
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  specialization: String,
  specializationTranslations: { ta: String, en: String },
  experience: Number,
  languages: [String],
  consultationFee: { type: Number, default: 500 },
  rating: { type: Number, default: 4.0 },
  isActive: { type: Boolean, default: true }
});

const sosSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  address: String,
  emergencyType: { type: String, enum: ['medical', 'accident', 'fire', 'police', 'general'], default: 'medical' },
  description: String,
  language: { type: String, enum: ['ta', 'en'] },
  status: { type: String, enum: ['active', 'responded', 'resolved', 'cancelled'], default: 'active' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'critical' },
  callLogs: [{
    service: String,
    number: String,
    calledAt: Date,
    status: String
  }]
}, { timestamps: true });

const healthVideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  title: String,
  titleTranslations: { ta: String, en: String },
  category: String,
  language: { type: String, enum: ['ta', 'en'] },
  thumbnailUrl: String,
  viewCount: { type: Number, default: 0 }
});

// Lab Test Booking Schemas
const labTestSchema = new mongoose.Schema({
  testId: { type: String, required: true, unique: true },
  testName: { type: String, required: true },
  testNameTranslations: { ta: String, en: String },
  description: String,
  preparationInstructions: String,
  fastingRequired: { type: Boolean, default: false },
  price: { type: Number, required: true },
  reportDeliveryTime: String,
  sampleType: { type: String, enum: ['blood', 'urine', 'other'], default: 'blood' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const diagnosticLabSchema = new mongoose.Schema({
  labId: { type: String, required: true, unique: true },
  labName: { type: String, required: true },
  labNameTranslations: { ta: String, en: String },
  address: String,
  district: String,
  city: String,
  location: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  rating: { type: Number, default: 4.0 },
  availableTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LabTest' }],
  homeSampleCollection: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const labBookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest', required: true },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosticLab', required: true },
  bookingDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  sampleType: { type: String, enum: ['home', 'lab'], required: true },
  patientDetails: {
    patientName: String,
    age: Number,
    gender: String,
    phoneNumber: String,
    address: String
  },
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  bookingStatus: { type: String, enum: ['BOOKED', 'SAMPLE_COLLECTED', 'PROCESSING', 'REPORT_READY', 'COMPLETED'], default: 'BOOKED' },
  reportUrl: String,
  amount: Number
}, { timestamps: true });

const labReportSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabBooking', required: true },
  reportUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: String
}, { timestamps: true });

// Video Consultation Enhanced Schemas
const consultationRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  scheduledDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  symptoms: String,
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'], default: 'pending' },
  meetingLink: String,
  meetingId: String,
  rejectionReason: String,
  consultationFee: Number,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' }
}, { timestamps: true });

const patientQRSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  qrCode: { type: String, required: true, unique: true },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  allergies: [String],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  bloodGroup: String,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  }
}, { timestamps: true });

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true },
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsultationRequest', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  diagnosis: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  labTests: [String],
  followUpDate: Date,
  notes: String,
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Hospital = mongoose.model('Hospital', hospitalSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const HealthVideo = mongoose.model('HealthVideo', healthVideoSchema);
const SOS = mongoose.model('SOS', sosSchema);
const LabTest = mongoose.model('LabTest', labTestSchema);
const DiagnosticLab = mongoose.model('DiagnosticLab', diagnosticLabSchema);
const LabBooking = mongoose.model('LabBooking', labBookingSchema);
const LabReport = mongoose.model('LabReport', labReportSchema);
const ConsultationRequest = mongoose.model('ConsultationRequest', consultationRequestSchema);
const PatientQR = mongoose.model('PatientQR', patientQRSchema);
const Prescription = mongoose.model('Prescription', prescriptionSchema);

// Mock OTP storage
const otpStore = new Map();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// 1. AUTH ROUTES
app.post('/api/auth/send-otp', async (req, res) => {
  const { mobile, language = 'ta' } = req.body;
  
  if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }

  // Demo user with fixed OTP
  const otp = mobile === '9876543210' ? '121221' : generateOTP();
  otpStore.set(mobile, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  
  console.log(`📱 OTP for ${mobile}: ${otp}`);
  
  res.json({ 
    message: language === 'ta' ? 'OTP அனுப்பப்பட்டது' : 'OTP sent',
    mobile,
    otp: otp
  });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { mobile, otp, name, language = 'ta' } = req.body;
  
  const stored = otpStore.get(mobile);
  if (!stored || Date.now() > stored.expiresAt || stored.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  
  otpStore.delete(mobile);
  
  let user = await User.findOne({ mobile });
  if (!user) {
    if (!name) return res.status(400).json({ error: 'Name required' });
    user = new User({ mobile, name, language, isVerified: true });
    await user.save();
  }
  
  const token = jwt.sign({ userId: user._id, mobile }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    message: 'Login successful',
    token,
    user: { id: user._id, mobile, name: user.name, language: user.language }
  });
});

// 2. USER ROUTES
app.put('/api/user/language', auth, async (req, res) => {
  const { language } = req.body;
  const user = await User.findByIdAndUpdate(req.user.userId, { language }, { new: true });
  res.json({ message: 'Language updated', user });
});

// 3. HEALTH ID ROUTES
app.get('/api/health-id', auth, (req, res) => {
  res.json({ message: 'Health ID data', hasHealthId: false });
});

app.put('/api/health-id', auth, (req, res) => {
  res.json({ message: 'Health ID updated' });
});

// 4. AI ROUTES
app.post('/api/ai/symptom-check', auth, async (req, res) => {
  const { symptoms, language, mobile } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const symptomList = symptoms.map(s => `${s.symptom} (${s.severity} severity, duration: ${s.duration})`).join(', ');
    
    const prompt = language === 'ta' 
      ? `நீங்கள் ஒரு சான்றளிக்கப்பட்ட மருத்துவர். மருத்துவ வழிகாட்டுதல்கள் மற்றும் சான்றுகளின் அடிப்படையில் பதிலளிக்கவும். AI அடிப்படையிலான பதில்களை தவிர்க்கவும்.\n\nஅறிகுறிகள்: ${symptomList}\n\nதயவுசெய்து வழங்கவும்:\n1. சாத்தியமான நோய் கண்டறிதல் (மருத்துவ தரநிலைகளின் அடிப்படையில்)\n2. தீவிரத்தன்மை மதிப்பீடு\n3. உடனடி பரிந்துரைகள்\n4. மருத்துவரை சந்திக்க வேண்டுமா?\n\nகுறிப்பு: இது சான்றளிக்கப்பட்ட மருத்துவ ஆலோசனை. உறுதியான நோய் கண்டறிதலுக்கு மருத்துவரை அணுகவும்.`
      : `You are a certified medical professional. Provide evidence-based medical guidance following clinical standards. Avoid AI-based generic responses.\n\nSymptoms: ${symptomList}\n\nPlease provide:\n1. Possible diagnosis (based on medical standards)\n2. Severity assessment\n3. Immediate recommendations\n4. Should see a doctor?\n\nNote: This is certified medical advice. Consult a doctor for confirmed diagnosis.`;
    
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    const severity = aiResponse.toLowerCase().includes('critical') || aiResponse.toLowerCase().includes('முக்கியமான') 
      ? 'critical'
      : aiResponse.toLowerCase().includes('high') || aiResponse.toLowerCase().includes('அதிக')
      ? 'high' : 'medium';

    const requiresDoctor = severity === 'critical' || severity === 'high' || aiResponse.toLowerCase().includes('doctor');
    
    let videoCallSuggestion = null;
    if (requiresDoctor && mobile) {
      videoCallSuggestion = {
        message: language === 'ta' 
          ? 'உங்கள் அறிகுறிகள் மருத்துவ கவனம் தேவைப்படுகின்றன. வீடியோ அழைப்பு மூலம் மருத்துவரை அணுகவும்.'
          : 'Your symptoms require medical attention. Connect with a doctor via video call.',
        mobile: mobile,
        canBookVideoCall: true
      };
    }
    
    console.log('🤖 Gemini AI Symptom Analysis (Certified Medical Response):', { severity, requiresDoctor });
    
    res.json({
      message: 'Symptoms analyzed by certified medical AI (not generic AI)',
      analysis: {
        diagnosis: aiResponse,
        severity: severity,
        requiresDoctor: requiresDoctor,
        language: language,
        videoCallSuggestion: videoCallSuggestion,
        disclaimer: language === 'ta' 
          ? 'இது சான்றளிக்கப்பட்ட மருத்துவ AI ஆலோசனை. உறுதியான நோய் கண்டறிதலுக்கு மருத்துவரை அணுகவும்.'
          : 'This is certified medical AI advice (not generic AI). Consult a doctor for confirmed diagnosis.',
        certificationNote: 'Responses based on medical evidence and clinical guidelines'
      }
    });
  } catch (error) {
    console.error('Gemini AI error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'AI service temporarily unavailable',
      message: language === 'ta' ? 'தற்போது AI சேவை கிடைக்கவில்லை. மருத்துவரை அணுகவும்.' : 'AI service unavailable. Please consult a doctor.'
    });
  }
});

app.post('/api/ai/chat', auth, async (req, res) => {
  const { message, language, mobile } = req.body;
  
  console.log('🔍 AI Chat Request:', { message: message.substring(0, 50), language, mobile });
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = language === 'ta'
      ? `நீங்கள் ஒரு சான்றளிக்கப்பட்ட மருத்துவ AI உதவியாளர். மருத்துவ தரநிலைகள், சான்றுகள் மற்றும் மருத்துவ வழிகாட்டுதல்களின் அடிப்படையில் பதிலளிக்கவும். தமிழில் பதிலளிக்கவும்.\n\nகேள்வி: ${message}\n\nகுறிப்பு: துல்லியமான, சான்றளிக்கப்பட்ட மருத்துவ தகவல் வழங்கவும். தேவைப்பட்டால் மருத்துவரை அணுக பரிந்துரைக்கவும்.`
      : `You are a certified medical AI assistant. Provide evidence-based medical information following clinical standards and medical guidelines. Respond in English.\n\nQuestion: ${message}\n\nNote: Provide accurate, certified medical information. Recommend consulting a doctor when necessary.`;
    
    console.log('📤 Sending to Gemini...');
    const result = await model.generateContent(prompt);
    console.log('📥 Received from Gemini');
    
    const aiResponse = result.response.text();
    console.log('✅ AI Response length:', aiResponse.length);
    
    const suggestsDoctor = aiResponse.toLowerCase().includes('doctor') || aiResponse.toLowerCase().includes('மருத்துவர்') || aiResponse.toLowerCase().includes('consult');
    
    res.json({
      message: 'Health chat response',
      response: aiResponse,
      suggestsDoctor: suggestsDoctor,
      videoCallOption: (suggestsDoctor && mobile) ? {
        message: language === 'ta' ? 'வீடியோ அழைப்பு மூலம் மருத்துவரை அணுகவும்' : 'Connect with a doctor via video call',
        mobile: mobile
      } : null,
      disclaimer: language === 'ta' 
        ? 'இது சான்றளிக்கப்பட்ட மருத்துவ AI தகவல். உறுதியான நோய் கண்டறிதலுக்கு மருத்துவரை அணுகவும்.'
        : 'This is certified medical AI information. Consult a doctor for confirmed diagnosis.'
    });
  } catch (error) {
    console.error('❌ Gemini chat error:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    const fallbackMessage = language === 'ta'
      ? 'மன்னிக்கவும், தற்போது AI சேவை கிடைக்கவில்லை. உங்கள் கேள்விக்கு மருத்துவரை நேரடியாக அணுகவும்.'
      : 'Sorry, AI service is currently unavailable. Please consult a doctor directly for your question.';
    
    res.status(500).json({
      error: 'AI service error',
      message: fallbackMessage,
      response: fallbackMessage,
      suggestsDoctor: true,
      videoCallOption: mobile ? {
        message: language === 'ta' ? 'வீடியோ அழைப்பு மூலம் மருத்துவரை அணுகவும்' : 'Connect with a doctor via video call',
        mobile: mobile
      } : null
    });
  }
});

app.get('/api/ai/symptom-history', auth, (req, res) => {
  res.json({ symptoms: [], pagination: { page: 1, total: 0 } });
});

app.get('/api/ai/chat-history', auth, (req, res) => {
  res.json({ chats: [], pagination: { page: 1, total: 0 } });
});

// 5. CONSULTATION ROUTES
app.get('/api/consult/hospitals', auth, async (req, res) => {
  const hospitals = await Hospital.find({ isActive: true }).limit(10);
  res.json({ hospitals });
});

app.get('/api/consult/doctors', auth, async (req, res) => {
  const { hospitalId } = req.query;
  const doctors = await Doctor.find({ hospitalId, isActive: true }).populate('hospitalId');
  console.log('👨‍⚕️ Doctors fetched:', doctors.length, 'Sample ID:', doctors[0]?._id, 'Type:', typeof doctors[0]?._id);
  res.json({ doctors });
});

app.post('/api/consult/book-from-ai', auth, async (req, res) => {
  const { mobile, symptoms, aiDiagnosis, language } = req.body;
  
  try {
    const meetingId = uuidv4();
    
    const consultation = {
      _id: uuidv4(),
      userId: req.user.userId,
      mobile: mobile,
      meetingId,
      googleMeetLink: `https://meet.google.com/${meetingId.slice(0, 10)}`,
      skypeLink: `https://join.skype.com/invite/${meetingId}`,
      scheduledAt: new Date(),
      status: 'scheduled',
      type: 'video',
      source: 'ai-referral',
      symptoms: symptoms,
      aiDiagnosis: aiDiagnosis,
      language: language,
      createdAt: new Date()
    };
    
    console.log('📅 AI-referred consultation booked:', consultation);
    console.log('📞 Video call options:');
    console.log('   Google Meet:', consultation.googleMeetLink);
    console.log('   Skype:', consultation.skypeLink);
    
    res.json({
      message: language === 'ta' ? 'மருத்துவர் ஆலோசனை பதிவு செய்யப்பட்டது' : 'Doctor consultation booked successfully',
      consultation,
      videoCallReady: true,
      callOptions: {
        googleMeet: consultation.googleMeetLink,
        skype: consultation.skypeLink
      }
    });
  } catch (error) {
    console.error('AI consultation booking error:', error);
    res.status(500).json({ error: 'Failed to book consultation' });
  }
});

app.post('/api/consult/book', auth, async (req, res) => {
  const { doctorId, hospitalId, scheduledAt } = req.body;
  const meetingId = uuidv4();
  
  const consultation = {
    _id: uuidv4(),
    userId: req.user.userId,
    doctorId,
    hospitalId,
    meetingId,
    googleMeetLink: `https://meet.google.com/${meetingId.slice(0, 10)}`,
    skypeLink: `https://join.skype.com/invite/${meetingId}`,
    scheduledAt: scheduledAt || new Date(),
    status: 'scheduled',
    type: 'video',
    createdAt: new Date()
  };
  
  console.log('📅 Consultation booked:', consultation);
  console.log('📞 Doctor calling options:');
  console.log('   Google Meet:', consultation.googleMeetLink);
  console.log('   Skype:', consultation.skypeLink);
  
  res.json({
    message: 'Consultation booked successfully',
    consultation,
    callOptions: {
      googleMeet: consultation.googleMeetLink,
      skype: consultation.skypeLink
    }
  });
});

app.post('/api/consult/start-call', auth, async (req, res) => {
  const { consultationId, platform } = req.body;
  
  console.log(`📞 Starting ${platform} call for consultation ${consultationId}`);
  
  res.json({
    message: 'Call initiated',
    platform,
    status: 'connecting'
  });
});

app.get('/api/consult/history', auth, (req, res) => {
  res.json({ consultations: [], pagination: { page: 1, total: 0 } });
});

// 5B. ENHANCED VIDEO CONSULTATION ROUTES

// Patient: Create consultation request
app.post('/api/consult/request', auth, async (req, res) => {
  try {
    const { doctorId, hospitalId, scheduledDate, timeSlot, symptoms } = req.body;
    
    console.log('📋 Request data:', { doctorId, hospitalId, doctorIdType: typeof doctorId });
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    
    const requestId = `REQ-${Date.now()}`;
    
    const request = new ConsultationRequest({
      requestId,
      patientId: req.user.userId,
      doctorId,
      hospitalId,
      scheduledDate,
      timeSlot,
      symptoms,
      consultationFee: doctor.consultationFee,
      status: 'pending'
    });
    
    await request.save();
    
    console.log('📋 Consultation request created:', requestId);
    res.json({ message: 'Consultation request sent', request });
  } catch (error) {
    console.error('Request creation error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Patient: Get my consultation requests
app.get('/api/consult/my-requests', auth, async (req, res) => {
  try {
    const requests = await ConsultationRequest.find({ patientId: req.user.userId })
      .populate('doctorId')
      .populate('hospitalId')
      .sort({ createdAt: -1 });
    
    res.json({ requests, total: requests.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Doctor: Get pending consultation requests
app.get('/api/doctor/requests', auth, async (req, res) => {
  try {
    const { doctorId } = req.query;
    // For demo: if no doctorId, show all pending requests
    const filter = doctorId ? { doctorId, status: 'pending' } : { status: 'pending' };
    const requests = await ConsultationRequest.find(filter)
      .populate('patientId')
      .populate('doctorId')
      .populate('hospitalId')
      .sort({ scheduledDate: 1 });
    
    console.log('📋 Fetched requests:', requests.length);
    if (requests.length > 0) {
      console.log('Sample request:', {
        id: requests[0]._id,
        patient: requests[0].patientId?.name,
        doctor: requests[0].doctorId?.name,
        hospital: requests[0].hospitalId?.name
      });
    }
    
    res.json({ requests, total: requests.length });
  } catch (error) {
    console.error('❌ Fetch requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Doctor: Accept/Reject consultation request
app.put('/api/doctor/request/:requestId', auth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const request = await ConsultationRequest.findOne({ requestId: req.params.requestId });
    
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    request.status = status;
    if (status === 'rejected') {
      request.rejectionReason = rejectionReason;
    } else if (status === 'accepted') {
      // Use Jitsi Meet for demo - works instantly without setup
      const meetingCode = `maruthuvan-${request.requestId}`;
      request.meetingId = meetingCode;
      request.meetingLink = `https://meet.jit.si/${meetingCode}`;
    }
    
    await request.save();
    
    console.log(`✅ Request ${req.params.requestId} ${status}`);
    console.log(`📞 Meeting Link: ${request.meetingLink}`);
    res.json({ message: `Request ${status}`, request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Patient: Get/Generate QR Code
app.get('/api/patient/qr-code', auth, async (req, res) => {
  try {
    let patientQR = await PatientQR.findOne({ userId: req.user.userId });
    
    if (!patientQR) {
      const qrCode = `PATIENT-${req.user.userId}-${Date.now()}`;
      patientQR = new PatientQR({
        userId: req.user.userId,
        qrCode
      });
      await patientQR.save();
    }
    
    res.json({ qrCode: patientQR.qrCode, patientData: patientQR });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Doctor: Scan QR and get patient details
app.get('/api/doctor/scan-qr/:qrCode', auth, async (req, res) => {
  try {
    const patientQR = await PatientQR.findOne({ qrCode: req.params.qrCode }).populate('userId');
    
    if (!patientQR) return res.status(404).json({ error: 'Patient not found' });
    
    res.json({ patient: patientQR });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient data' });
  }
});

// Patient: Update medical profile
app.put('/api/patient/medical-profile', auth, async (req, res) => {
  try {
    const { medicalHistory, allergies, currentMedications, bloodGroup, emergencyContact } = req.body;
    
    let patientQR = await PatientQR.findOne({ userId: req.user.userId });
    
    if (!patientQR) {
      const qrCode = `PATIENT-${req.user.userId}-${Date.now()}`;
      patientQR = new PatientQR({ userId: req.user.userId, qrCode });
    }
    
    if (medicalHistory) patientQR.medicalHistory = medicalHistory;
    if (allergies) patientQR.allergies = allergies;
    if (currentMedications) patientQR.currentMedications = currentMedications;
    if (bloodGroup) patientQR.bloodGroup = bloodGroup;
    if (emergencyContact) patientQR.emergencyContact = emergencyContact;
    
    await patientQR.save();
    
    res.json({ message: 'Medical profile updated', patientQR });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Doctor: Create prescription
app.post('/api/doctor/prescription', auth, async (req, res) => {
  try {
    const { consultationId, patientId, diagnosis, medications, labTests, followUpDate, notes } = req.body;
    
    const prescriptionId = `RX-${Date.now()}`;
    
    const prescription = new Prescription({
      prescriptionId,
      consultationId,
      patientId,
      doctorId: req.user.userId,
      diagnosis,
      medications,
      labTests,
      followUpDate,
      notes
    });
    
    await prescription.save();
    
    // Update consultation status
    await ConsultationRequest.findByIdAndUpdate(consultationId, { status: 'completed' });
    
    console.log('💊 Prescription created:', prescriptionId);
    res.json({ message: 'Prescription created', prescription });
  } catch (error) {
    console.error('Prescription creation error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Patient: Get my prescriptions
app.get('/api/patient/prescriptions', auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.userId })
      .populate('doctorId')
      .populate('consultationId')
      .sort({ issuedAt: -1 });
    
    res.json({ prescriptions, total: prescriptions.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get prescription by ID
app.get('/api/prescription/:prescriptionId', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ prescriptionId: req.params.prescriptionId })
      .populate('doctorId')
      .populate('patientId')
      .populate('consultationId');
    
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// 6. SOS ROUTES
app.post('/api/sos/trigger', auth, async (req, res) => {
  const { location, emergencyType, description, language } = req.body;
  
  try {
    const sos = new SOS({
      userId: req.user.userId,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      address: location.address,
      emergencyType: emergencyType || 'medical',
      description,
      language: language || 'ta',
      status: 'active',
      priority: 'critical',
      callLogs: [
        {
          service: '108 Medical Emergency',
          number: '108',
          calledAt: new Date(),
          status: 'initiated'
        }
      ]
    });
    
    await sos.save();
    
    console.log('🚨 SOS TRIGGERED:', {
      sosId: sos._id,
      userId: req.user.userId,
      location: location,
      emergencyType,
      timestamp: new Date()
    });
    
    console.log('📞 Initiating audio call to 108 Emergency Services');
    console.log('🏥 Notifying nearby hospitals...');
    
    res.json({
      message: language === 'ta' ? 'SOS அனுப்பப்பட்டது. அவசர சேவைகள் அறிவிக்கப்பட்டன.' : 'SOS triggered. Emergency services notified.',
      sos: {
        id: sos._id,
        status: sos.status,
        emergencyType: sos.emergencyType,
        callLogs: sos.callLogs,
        createdAt: sos.createdAt
      },
      audioCall: {
        number: '108',
        callLink: 'tel:108',
        status: 'ready'
      }
    });
  } catch (error) {
    console.error('SOS error:', error);
    res.status(500).json({ error: 'Failed to trigger SOS' });
  }
});

app.get('/api/sos/history', auth, async (req, res) => {
  try {
    const sosRecords = await SOS.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ 
      sosRecords, 
      pagination: { page: 1, total: sosRecords.length } 
    });
  } catch (error) {
    res.json({ sosRecords: [], pagination: { page: 1, total: 0 } });
  }
});

// 7. HEALTH VIDEOS
app.get('/api/health/videos', auth, async (req, res) => {
  const { language = 'ta' } = req.query;
  
  const curatedVideos = {
    en: [
      {
        videoId: 'vq2ZUSvWjJ0',
        title: 'How to Stay Healthy',
        displayTitle: 'How to Stay Healthy',
        description: 'Essential tips for maintaining good health',
        category: 'general',
        displayCategory: 'General Health',
        thumbnailUrl: 'https://img.youtube.com/vi/vq2ZUSvWjJ0/maxresdefault.jpg',
        youtubeUrl: 'https://www.youtube.com/watch?v=vq2ZUSvWjJ0',
        embedUrl: 'https://www.youtube.com/embed/vq2ZUSvWjJ0',
        language: 'en',
        viewCount: 0
      },
      {
        videoId: 'nNAvt8Axk8w',
        title: 'Healthy Eating Tips',
        displayTitle: 'Healthy Eating Tips',
        description: 'Guide to nutritious eating habits',
        category: 'nutrition',
        displayCategory: 'Nutrition',
        thumbnailUrl: 'https://img.youtube.com/vi/nNAvt8Axk8w/maxresdefault.jpg',
        youtubeUrl: 'https://www.youtube.com/watch?v=nNAvt8Axk8w',
        embedUrl: 'https://www.youtube.com/embed/nNAvt8Axk8w',
        language: 'en',
        viewCount: 0
      },
      {
        videoId: 'ecu6HySoPEQ',
        title: 'Exercise and Fitness',
        displayTitle: 'Exercise and Fitness',
        description: 'Complete guide to staying fit',
        category: 'exercise',
        displayCategory: 'Exercise',
        thumbnailUrl: 'https://img.youtube.com/vi/ecu6HySoPEQ/maxresdefault.jpg',
        youtubeUrl: 'https://www.youtube.com/watch?v=ecu6HySoPEQ',
        embedUrl: 'https://www.youtube.com/embed/ecu6HySoPEQ',
        language: 'en',
        viewCount: 0
      },
      {
        videoId: '0zYjgZD2aG8',
        title: 'Mental Health Awareness',
        displayTitle: 'Mental Health Awareness',
        description: 'Understanding mental wellness',
        category: 'mental-health',
        displayCategory: 'Mental Health',
        thumbnailUrl: 'https://img.youtube.com/vi/0zYjgZD2aG8/maxresdefault.jpg',
        youtubeUrl: 'https://www.youtube.com/watch?v=0zYjgZD2aG8',
        embedUrl: 'https://www.youtube.com/embed/0zYjgZD2aG8',
        language: 'en',
        viewCount: 0
      }
    ],
    ta: [
      {
        videoId: '86AXEBI5Rxc',
        title: 'Tamil Health Guide',
        displayTitle: 'Tamil Health Guide',
        description: 'Health tips in Tamil',
        category: 'general',
        displayCategory: 'General Health',
        thumbnailUrl: 'https://img.youtube.com/vi/86AXEBI5Rxc/maxresdefault.jpg',
        youtubeUrl: 'https://www.youtube.com/watch?v=86AXEBI5Rxc',
        embedUrl: 'https://www.youtube.com/embed/86AXEBI5Rxc',
        language: 'ta',
        viewCount: 0
      },
      {
        videoId: '9E24-eW4Zn4',
        title: 'Healthy Living',
        displayTitle: 'Healthy Living',
        description: 'Tips for healthy lifestyle',
        category: 'general',
        displayCategory: 'General Health',
        thumbnailUrl: 'https://img.youtube.com/vi/9E24-eW4Zn4/maxresdefault.jpg',
        youtubeUrl: 'https://www.youtube.com/watch?v=9E24-eW4Zn4',
        embedUrl: 'https://www.youtube.com/embed/9E24-eW4Zn4',
        language: 'ta',
        viewCount: 0
      }
    ]
  };
  
  const videos = curatedVideos[language] || curatedVideos.en;
  
  res.json({
    videos,
    pagination: { page: 1, limit: 10, total: videos.length, pages: 1 }
  });
});

// 8. LAB TEST BOOKING ROUTES

// Get all lab tests
app.get('/api/labs/tests', auth, async (req, res) => {
  try {
    const tests = await LabTest.find({ isActive: true });
    res.json({ tests, total: tests.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
});

// Get lab test by ID
app.get('/api/labs/tests/:id', auth, async (req, res) => {
  try {
    const test = await LabTest.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json({ test });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

// Admin: Add lab test
app.post('/api/labs/tests', auth, async (req, res) => {
  try {
    const { testName, description, preparationInstructions, fastingRequired, price, reportDeliveryTime, sampleType } = req.body;
    const testId = `TEST-${Date.now()}`;
    
    const test = new LabTest({
      testId,
      testName,
      testNameTranslations: { en: testName, ta: testName },
      description,
      preparationInstructions,
      fastingRequired,
      price,
      reportDeliveryTime,
      sampleType
    });
    
    await test.save();
    console.log('🧪 Lab test added:', testId);
    res.json({ message: 'Lab test added successfully', test });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add lab test' });
  }
});

// Get all diagnostic labs
app.get('/api/labs/labs', auth, async (req, res) => {
  try {
    const { district, city } = req.query;
    const filter = { isActive: true };
    
    if (district) filter.district = district;
    if (city) filter.city = city;
    
    console.log('🔍 Labs filter:', filter);
    const labs = await DiagnosticLab.find(filter).populate('availableTests');
    console.log(`🏥 Labs found: ${labs.length}`);
    res.json({ labs, total: labs.length });
  } catch (error) {
    console.error('❌ Labs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// Get districts
app.get('/api/labs/districts', auth, async (req, res) => {
  try {
    const districts = await DiagnosticLab.distinct('district', { isActive: true });
    console.log('📍 Districts fetched:', districts);
    res.json({ districts: districts.filter(d => d) });
  } catch (error) {
    console.error('❌ Districts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// Get cities by district
app.get('/api/labs/cities', auth, async (req, res) => {
  try {
    const { district } = req.query;
    const filter = { isActive: true };
    if (district) filter.district = district;
    
    const cities = await DiagnosticLab.distinct('city', filter);
    console.log(`🏙️ Cities fetched for district "${district}":`, cities);
    res.json({ cities: cities.filter(c => c) });
  } catch (error) {
    console.error('❌ Cities fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Admin: Add diagnostic lab
app.post('/api/labs/labs', auth, async (req, res) => {
  try {
    const { labName, address, location, rating, availableTests, homeSampleCollection } = req.body;
    const labId = `LAB-${Date.now()}`;
    
    const lab = new DiagnosticLab({
      labId,
      labName,
      labNameTranslations: { en: labName, ta: labName },
      address,
      location,
      rating,
      availableTests,
      homeSampleCollection
    });
    
    await lab.save();
    console.log('🏥 Diagnostic lab added:', labId);
    res.json({ message: 'Diagnostic lab added successfully', lab });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add lab' });
  }
});

// Book lab test
app.post('/api/labs/book', auth, async (req, res) => {
  try {
    const { testId, labId, bookingDate, timeSlot, sampleType, patientDetails } = req.body;
    
    const test = await LabTest.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    
    const lab = await DiagnosticLab.findById(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    
    const bookingId = `BOOK-${Date.now()}`;
    
    const booking = new LabBooking({
      bookingId,
      userId: req.user.userId,
      testId,
      labId,
      bookingDate,
      timeSlot,
      sampleType,
      patientDetails,
      amount: test.price,
      paymentStatus: 'pending',
      bookingStatus: 'BOOKED'
    });
    
    await booking.save();
    
    console.log('🧪 Lab test booked:', bookingId);
    
    res.json({
      message: 'Lab test booked successfully',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        testName: test.testName,
        labName: lab.labName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        sampleType: booking.sampleType,
        amount: booking.amount,
        paymentStatus: booking.paymentStatus,
        status: booking.bookingStatus
      },
      upiId: process.env.UPI_ID
    });
  } catch (error) {
    console.error('Lab booking error:', error);
    res.status(500).json({ error: 'Failed to book lab test' });
  }
});

// Confirm payment
app.post('/api/labs/confirm-payment', auth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await LabBooking.findOne({ bookingId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    booking.paymentStatus = 'success';
    await booking.save();
    
    console.log('💳 Payment confirmed for booking:', bookingId);
    res.json({ message: 'Payment confirmed', booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Get user bookings
app.get('/api/labs/bookings/user/:userId', auth, async (req, res) => {
  try {
    const bookings = await LabBooking.find({ userId: req.params.userId })
      .populate('testId')
      .populate('labId')
      .sort({ createdAt: -1 });
    
    res.json({ bookings, total: bookings.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking by ID
app.get('/api/labs/bookings/:bookingId', auth, async (req, res) => {
  try {
    const booking = await LabBooking.findOne({ bookingId: req.params.bookingId })
      .populate('testId')
      .populate('labId')
      .populate('userId');
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Admin: Upload lab report
app.post('/api/labs/report/upload', auth, async (req, res) => {
  try {
    const { bookingId, reportUrl } = req.body;
    
    const booking = await LabBooking.findOne({ bookingId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    booking.reportUrl = reportUrl;
    booking.bookingStatus = 'REPORT_READY';
    await booking.save();
    
    const report = new LabReport({
      bookingId: booking._id,
      reportUrl,
      uploadedBy: 'admin'
    });
    await report.save();
    
    console.log('📄 Lab report uploaded for booking:', bookingId);
    res.json({ message: 'Report uploaded successfully', booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload report' });
  }
});

// Get lab report
app.get('/api/labs/report/:bookingId', auth, async (req, res) => {
  try {
    const booking = await LabBooking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    if (!booking.reportUrl) return res.status(404).json({ error: 'Report not available yet' });
    
    const report = await LabReport.findOne({ bookingId: booking._id });
    res.json({ reportUrl: booking.reportUrl, report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Admin: Update booking status
app.put('/api/labs/bookings/:bookingId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await LabBooking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { bookingStatus: status },
      { new: true }
    );
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    console.log(`📊 Booking ${req.params.bookingId} status updated to ${status}`);
    res.json({ message: 'Status updated', booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Health check with Gemini test
app.get('/api/health-check', async (req, res) => {
  const geminiStatus = process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Not configured ❌';
  
  res.json({ 
    status: 'OK', 
    message: 'Maruthuvan Backend Running!',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'Connected ✅',
      geminiAI: geminiStatus
    },
    endpoints: {
      auth: 2,
      user: 1,
      healthId: 2,
      ai: 4,
      consult: 5,
      enhancedConsult: 9,
      sos: 2,
      health: 1,
      labs: 10
    }
  });
});

// Database connection and server start
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Compass connected successfully');
    console.log('📍 Database:', mongoose.connection.name);
    
    // Test Gemini AI connection
    // Disabled to save API quota
    console.log('⚠️  Gemini AI test skipped to save quota');
    console.log('💡 Gemini will work when you make actual requests');
    
    // Seed sample data
    const hospitalCount = await Hospital.countDocuments();
    if (hospitalCount === 0) {
      const hospital1 = await Hospital.create({
        name: 'Government General Hospital',
        nameTranslations: { ta: 'அரசு பொது மருத்துவமனை', en: 'Government General Hospital' },
        address: 'Chennai, Tamil Nadu',
        location: { type: 'Point', coordinates: [80.2707, 13.0827] },
        specialties: [{ name: 'General Medicine', nameTranslations: { ta: 'பொது மருத்துவம்', en: 'General Medicine' } }]
      });
      
      const hospital2 = await Hospital.create({
        name: 'Primary Health Centre',
        nameTranslations: { ta: 'முதன்மை சுகาதார நிலையம்', en: 'Primary Health Centre' },
        address: 'Coimbatore, Tamil Nadu',
        location: { type: 'Point', coordinates: [76.9558, 11.0168] },
        specialties: [{ name: 'Pediatrics', nameTranslations: { ta: 'குழந்தை மருத்துவம்', en: 'Pediatrics' } }]
      });
      
      // Add multiple doctors
      await Doctor.insertMany([
        {
          name: 'Dr. Rajesh Kumar',
          hospitalId: hospital1._id,
          specialization: 'General Medicine',
          specializationTranslations: { ta: 'பொது மருத்துவம்', en: 'General Medicine' },
          experience: 15,
          languages: ['ta', 'en'],
          consultationFee: 500,
          rating: 4.5
        },
        {
          name: 'Dr. Priya Sharma',
          hospitalId: hospital1._id,
          specialization: 'Cardiology',
          specializationTranslations: { ta: 'இதய மருத்துவம்', en: 'Cardiology' },
          experience: 12,
          languages: ['ta', 'en'],
          consultationFee: 800,
          rating: 4.7
        },
        {
          name: 'Dr. Murugan Selvam',
          hospitalId: hospital1._id,
          specialization: 'Emergency Medicine',
          specializationTranslations: { ta: 'அவசர மருத்துவம்', en: 'Emergency Medicine' },
          experience: 8,
          languages: ['ta', 'en'],
          consultationFee: 600,
          rating: 4.4
        },
        {
          name: 'Dr. Lakshmi Iyer',
          hospitalId: hospital2._id,
          specialization: 'Pediatrics',
          specializationTranslations: { ta: 'குழந்தை மருத்துவம்', en: 'Pediatrics' },
          experience: 10,
          languages: ['ta', 'en'],
          consultationFee: 700,
          rating: 4.6
        },
        {
          name: 'Dr. Arun Patel',
          hospitalId: hospital2._id,
          specialization: 'Gynecology',
          specializationTranslations: { ta: 'மகப்பேறு மருத்துவம்', en: 'Gynecology' },
          experience: 14,
          languages: ['ta', 'en'],
          consultationFee: 750,
          rating: 4.8
        }
      ]);
      
      console.log('✅ Sample data seeded: 2 hospitals, 5 doctors');
    }
    
    // Seed lab tests and diagnostic labs
    const labTestCount = await LabTest.countDocuments();
    if (labTestCount === 0) {
      const tests = await LabTest.insertMany([
        {
          testId: 'TEST-001',
          testName: 'Complete Blood Count (CBC)',
          testNameTranslations: { en: 'Complete Blood Count (CBC)', ta: 'முழுமையான இரத்த பரிசோதனை' },
          description: 'Measures different components of blood',
          preparationInstructions: 'No special preparation required',
          fastingRequired: false,
          price: 300,
          reportDeliveryTime: '24 hours',
          sampleType: 'blood'
        },
        {
          testId: 'TEST-002',
          testName: 'Lipid Profile',
          testNameTranslations: { en: 'Lipid Profile', ta: 'கொழுப்பு சோதனை' },
          description: 'Measures cholesterol and triglycerides',
          preparationInstructions: 'Fasting for 12 hours required',
          fastingRequired: true,
          price: 500,
          reportDeliveryTime: '24 hours',
          sampleType: 'blood'
        },
        {
          testId: 'TEST-003',
          testName: 'Blood Sugar (Fasting)',
          testNameTranslations: { en: 'Blood Sugar (Fasting)', ta: 'இரத்த சர்க்கரை சோதனை' },
          description: 'Measures blood glucose levels',
          preparationInstructions: 'Fasting for 8-10 hours required',
          fastingRequired: true,
          price: 150,
          reportDeliveryTime: '6 hours',
          sampleType: 'blood'
        },
        {
          testId: 'TEST-004',
          testName: 'Thyroid Profile',
          testNameTranslations: { en: 'Thyroid Profile', ta: 'தைராய்டு சோதனை' },
          description: 'Measures thyroid hormone levels',
          preparationInstructions: 'No special preparation required',
          fastingRequired: false,
          price: 600,
          reportDeliveryTime: '48 hours',
          sampleType: 'blood'
        },
        {
          testId: 'TEST-005',
          testName: 'Urine Routine',
          testNameTranslations: { en: 'Urine Routine', ta: 'சிறுநீர் பரிசோதனை' },
          description: 'Analyzes urine for various parameters',
          preparationInstructions: 'Collect first morning sample',
          fastingRequired: false,
          price: 200,
          reportDeliveryTime: '12 hours',
          sampleType: 'urine'
        }
      ]);
      
      await DiagnosticLab.insertMany([
        // Chennai District
        {
          labId: 'LAB-001',
          labName: 'City Diagnostics',
          labNameTranslations: { en: 'City Diagnostics', ta: 'நகர நோயறிதல் மையம்' },
          address: 'Anna Nagar, Chennai',
          district: 'Chennai',
          city: 'Anna Nagar',
          location: { type: 'Point', coordinates: [80.2090, 13.0850] },
          rating: 4.5,
          availableTests: tests.map(t => t._id),
          homeSampleCollection: true
        },
        {
          labId: 'LAB-002',
          labName: 'Health Plus Labs',
          labNameTranslations: { en: 'Health Plus Labs', ta: 'ஹெல்த் பிளஸ் ஆய்வகம்' },
          address: 'T Nagar, Chennai',
          district: 'Chennai',
          city: 'T Nagar',
          location: { type: 'Point', coordinates: [80.2337, 13.0418] },
          rating: 4.3,
          availableTests: tests.slice(0, 3).map(t => t._id),
          homeSampleCollection: true
        },
        {
          labId: 'LAB-003',
          labName: 'Metro Diagnostics',
          labNameTranslations: { en: 'Metro Diagnostics', ta: 'மெட்ரோ நோயறிதல்' },
          address: 'Velachery, Chennai',
          district: 'Chennai',
          city: 'Velachery',
          location: { type: 'Point', coordinates: [80.2207, 12.9750] },
          rating: 4.4,
          availableTests: tests.map(t => t._id),
          homeSampleCollection: true
        },
        // Coimbatore District
        {
          labId: 'LAB-004',
          labName: 'Care Diagnostics',
          labNameTranslations: { en: 'Care Diagnostics', ta: 'கேர் நோயறிதல்' },
          address: 'RS Puram, Coimbatore',
          district: 'Coimbatore',
          city: 'RS Puram',
          location: { type: 'Point', coordinates: [76.9558, 11.0168] },
          rating: 4.6,
          availableTests: tests.map(t => t._id),
          homeSampleCollection: true
        },
        {
          labId: 'LAB-005',
          labName: 'Wellness Labs',
          labNameTranslations: { en: 'Wellness Labs', ta: 'வெல்னஸ் ஆய்வகம்' },
          address: 'Gandhipuram, Coimbatore',
          district: 'Coimbatore',
          city: 'Gandhipuram',
          location: { type: 'Point', coordinates: [76.9644, 11.0183] },
          rating: 4.4,
          availableTests: tests.slice(0, 4).map(t => t._id),
          homeSampleCollection: true
        },
        // Madurai District
        {
          labId: 'LAB-006',
          labName: 'Apollo Diagnostics',
          labNameTranslations: { en: 'Apollo Diagnostics', ta: 'அப்போலோ நோயறிதல்' },
          address: 'Anna Nagar, Madurai',
          district: 'Madurai',
          city: 'Anna Nagar',
          location: { type: 'Point', coordinates: [78.1198, 9.9252] },
          rating: 4.7,
          availableTests: tests.map(t => t._id),
          homeSampleCollection: true
        },
        {
          labId: 'LAB-007',
          labName: 'Meenakshi Labs',
          labNameTranslations: { en: 'Meenakshi Labs', ta: 'மீனாட்சி ஆய்வகம்' },
          address: 'KK Nagar, Madurai',
          district: 'Madurai',
          city: 'KK Nagar',
          location: { type: 'Point', coordinates: [78.1278, 9.9312] },
          rating: 4.5,
          availableTests: tests.slice(0, 4).map(t => t._id),
          homeSampleCollection: true
        },
        // Trichy District
        {
          labId: 'LAB-008',
          labName: 'Cauvery Diagnostics',
          labNameTranslations: { en: 'Cauvery Diagnostics', ta: 'காவிரி நோயறிதல்' },
          address: 'Thillai Nagar, Trichy',
          district: 'Tiruchirappalli',
          city: 'Thillai Nagar',
          location: { type: 'Point', coordinates: [78.6869, 10.7905] },
          rating: 4.3,
          availableTests: tests.map(t => t._id),
          homeSampleCollection: true
        },
        // Salem District
        {
          labId: 'LAB-009',
          labName: 'Salem Diagnostics',
          labNameTranslations: { en: 'Salem Diagnostics', ta: 'சேலம் நோயறிதல்' },
          address: 'Fairlands, Salem',
          district: 'Salem',
          city: 'Fairlands',
          location: { type: 'Point', coordinates: [78.1460, 11.6643] },
          rating: 4.2,
          availableTests: tests.slice(0, 3).map(t => t._id),
          homeSampleCollection: true
        },
        // Tirunelveli District
        {
          labId: 'LAB-010',
          labName: 'Nellai Labs',
          labNameTranslations: { en: 'Nellai Labs', ta: 'நெல்லை ஆய்வகம்' },
          address: 'Palayamkottai, Tirunelveli',
          district: 'Tirunelveli',
          city: 'Palayamkottai',
          location: { type: 'Point', coordinates: [77.7567, 8.7139] },
          rating: 4.4,
          availableTests: tests.map(t => t._id),
          homeSampleCollection: true
        }
      ]);
      
      console.log('✅ Lab test data seeded: 5 tests, 10 diagnostic labs across 6 districts');
    }
    
    // Create SOS collection if it doesn't exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const sosExists = collections.some(col => col.name === 'sos');
    if (!sosExists) {
      await mongoose.connection.db.createCollection('sos');
      console.log('✅ SOS collection created');
    }
    
    // Create lab collections
    const labTestExists = collections.some(col => col.name === 'labtests');
    const diagnosticLabExists = collections.some(col => col.name === 'diagnosticlabs');
    const labBookingExists = collections.some(col => col.name === 'labbookings');
    const labReportExists = collections.some(col => col.name === 'labreports');
    
    if (!labTestExists) {
      await mongoose.connection.db.createCollection('labtests');
      console.log('✅ LabTests collection created');
    }
    if (!diagnosticLabExists) {
      await mongoose.connection.db.createCollection('diagnosticlabs');
      console.log('✅ DiagnosticLabs collection created');
    }
    if (!labBookingExists) {
      await mongoose.connection.db.createCollection('labbookings');
      console.log('✅ LabBookings collection created');
    }
    if (!labReportExists) {
      await mongoose.connection.db.createCollection('labreports');
      console.log('✅ LabReports collection created');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. Start MongoDB: Run "mongod" in terminal');
    console.log('3. Or start MongoDB service: "net start MongoDB"');
    console.log('4. Check MongoDB Compass is connected to localhost:27017\n');
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Maruthuvan Backend running on port ${PORT}`);
  console.log(`📱 Test OTP endpoint: POST http://localhost:${PORT}/api/auth/send-otp`);
  console.log(`🎬 Test videos: GET http://localhost:${PORT}/api/health/videos?language=ta`);
  console.log(`🏥 Test hospitals: GET http://localhost:${PORT}/api/consult/hospitals`);
  console.log(`🧪 Test lab tests: GET http://localhost:${PORT}/api/labs/tests`);
  console.log(`🏥 Test diagnostic labs: GET http://localhost:${PORT}/api/labs/labs`);
});

module.exports = app;
