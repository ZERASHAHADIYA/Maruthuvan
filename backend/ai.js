const express = require('express');
const Joi = require('joi');
const SymptomCheck = require('../SymptomCheck');
const HealthChat = require('../HealthChat');
const { auth } = require('../middleware/auth');
const { analyzeSymptoms, chatWithAI } = require('../utils/gemini');

const router = express.Router();

// Validation schemas
const symptomCheckSchema = Joi.object({
  symptoms: Joi.array().items(
    Joi.object({
      symptom: Joi.string().required(),
      severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
      duration: Joi.string().required()
    })
  ).min(1).required(),
  language: Joi.string().valid('ta', 'en').required()
});

const chatSchema = Joi.object({
  message: Joi.string().required(),
  language: Joi.string().valid('ta', 'en').required(),
  chatId: Joi.string().optional()
});

// POST /api/ai/symptom-check
router.post('/symptom-check', auth, async (req, res) => {
  try {
    const { error, value } = symptomCheckSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { symptoms, language } = value;

    // Create symptom check record
    const symptomCheck = new SymptomCheck({
      userId: req.user.userId,
      symptoms,
      language,
      status: 'pending'
    });

    // Analyze symptoms with Gemini AI
    try {
      const aiResponse = await analyzeSymptoms(symptoms, language);
      symptomCheck.aiResponse = aiResponse;
      symptomCheck.status = 'analyzed';
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      symptomCheck.aiResponse = {
        diagnosis: language === 'ta' ? 'AI பகுப்பாய்வு தற்போது கிடைக்கவில்லை' : 'AI analysis currently unavailable',
        recommendations: [language === 'ta' ? 'மருத்துவரை அணுகவும்' : 'Please consult a doctor'],
        severity: 'medium',
        requiresDoctor: true,
        language
      };
      symptomCheck.status = 'analyzed';
    }

    await symptomCheck.save();

    res.json({
      message: language === 'ta' ? 'அறிகுறிகள் பகுப்பாய்வு செய்யப்பட்டது' : 'Symptoms analyzed successfully',
      symptomCheck
    });
  } catch (error) {
    console.error('Symptom check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { message, language, chatId } = value;

    // Find or create chat session
    let chat;
    if (chatId) {
      chat = await HealthChat.findOne({ _id: chatId, userId: req.user.userId });
    }

    if (!chat) {
      chat = new HealthChat({
        userId: req.user.userId,
        messages: [],
        language,
        isActive: true
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get AI response
    try {
      const aiResponse = await chatWithAI(message, language, chat.messages);
      
      chat.messages.push({
        role: 'ai',
        content: aiResponse,
        timestamp: new Date()
      });
    } catch (aiError) {
      console.error('AI chat error:', aiError);
      const fallbackResponse = language === 'ta' 
        ? 'மன்னிக்கவும், தற்போது AI சேவை கிடைக்கவில்லை. மருத்துவரை அணுகவும்.'
        : 'Sorry, AI service is currently unavailable. Please consult a doctor.';
      
      chat.messages.push({
        role: 'ai',
        content: fallbackResponse,
        timestamp: new Date()
      });
    }

    await chat.save();

    res.json({
      message: language === 'ta' ? 'பதில் பெறப்பட்டது' : 'Response received',
      chat,
      latestMessage: chat.messages[chat.messages.length - 1]
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ai/symptom-history
router.get('/symptom-history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const symptoms = await SymptomCheck.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('consultationId', 'status scheduledAt');

    const total = await SymptomCheck.countDocuments({ userId: req.user.userId });

    res.json({
      symptoms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get symptom history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ai/chat-history
router.get('/chat-history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const chats = await HealthChat.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id language topic isActive createdAt updatedAt messages');

    // Add preview of last message for each chat
    const chatsWithPreview = chats.map(chat => ({
      ...chat.toObject(),
      lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null,
      messageCount: chat.messages.length
    }));

    const total = await HealthChat.countDocuments({ userId: req.user.userId });

    res.json({
      chats: chatsWithPreview,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ai/chat/:chatId
router.get('/chat/:chatId', auth, async (req, res) => {
  try {
    const chat = await HealthChat.findOne({ 
      _id: req.params.chatId, 
      userId: req.user.userId 
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;