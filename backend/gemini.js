const axios = require('axios');

// Gemini API configuration with auto-model fallback
const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

let WORKING_MODEL = null;

// Auto-detect working Gemini model
const getWorkingModel = async () => {
  if (WORKING_MODEL) return WORKING_MODEL;

  for (const modelName of GEMINI_MODELS) {
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await axios.post(
        testUrl,
        {
          contents: [{ parts: [{ text: 'test' }] }],
          generationConfig: { maxOutputTokens: 10 }
        },
        { timeout: 10000 }
      );
      
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        WORKING_MODEL = modelName;
        console.log(`✅ Using Gemini model: ${modelName}`);
        return modelName;
      }
    } catch (err) {
      console.log(`⚠️  Model ${modelName} failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }
  
  throw new Error('No compatible Gemini model found');
};

// Safe response parser
const extractText = (response) => {
  try {
    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    }
    return 'AI could not generate a response.';
  } catch (error) {
    return 'AI response parsing failed.';
  }
};

// Create Gemini API client with auto-model selection and retry
const createGeminiRequest = async (prompt, language = 'en', retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const model = await getWorkingModel();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      return extractText(response.data);
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error(`Gemini API error (attempt ${attempt + 1}/${retries + 1}):`, errorMsg);
      
      if (attempt < retries && (errorMsg.includes('overloaded') || errorMsg.includes('503'))) {
        console.log(`Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        WORKING_MODEL = null; // Reset to try next model
        continue;
      }
      
      throw new Error('AI service unavailable');
    }
  }
};

// Analyze symptoms using Gemini AI
const analyzeSymptoms = async (symptoms, language = 'ta') => {
  try {
    const symptomList = symptoms.map(s => 
      `${s.symptom} (${s.severity} severity, duration: ${s.duration})`
    ).join(', ');

    const prompt = language === 'ta' 
      ? `நீங்கள் ஒரு சான்றளிக்கப்பட்ட மருத்துவ AI உதவியாளர்.

கடுமையான விதிகள்:
- மருத்துவ தரநிலைகள் மற்றும் சான்றுகளின் அடிப்படையில் மட்டுமே பதிலளிக்கவும்
- தீவிர அறிகுறிகளுக்கு உடனடியாக மருத்துவரை அணுகுமாறு பரிந்துரைக்கவும்

அறிகுறிகள்: ${symptomList}

தயவுசெய்து வழங்கவும்:
1. சாத்தியமான நோய் கண்டறிதல் (மருத்துவ தரநிலைகளின் அடிப்படையில்)
2. பரிந்துரைகள் (வீட்டு சிகிச்சை, வாழ்க்கை முறை மாற்றங்கள்)
3. தீவிரத்தன்மை நிலை (குறைந்த/நடுத்தர/அதிக/முக்கியமான)
4. மருத்துவரை சந்திக்க வேண்டுமா? (ஆம்/இல்லை)`
      : `You are a certified medical AI assistant.

STRICT RULES:
- Answer ONLY based on medical standards and evidence
- Recommend consulting a doctor immediately for serious symptoms

Symptoms: ${symptomList}

Please provide:
1. Possible diagnosis (based on medical standards)
2. Recommendations (home care, lifestyle changes)
3. Severity level (low/medium/high/critical)
4. Should see a doctor? (yes/no)`;

    const aiResponse = await createGeminiRequest(prompt, language);
    
    // Parse AI response to extract structured data
    const severity = aiResponse.toLowerCase().includes('critical') || aiResponse.toLowerCase().includes('முக்கியமான') 
      ? 'critical'
      : aiResponse.toLowerCase().includes('high') || aiResponse.toLowerCase().includes('அதிக')
      ? 'high'
      : aiResponse.toLowerCase().includes('medium') || aiResponse.toLowerCase().includes('நடுத்தர')
      ? 'medium'
      : 'low';

    const requiresDoctor = aiResponse.toLowerCase().includes('yes') || 
                          aiResponse.toLowerCase().includes('ஆம்') ||
                          aiResponse.toLowerCase().includes('doctor') ||
                          aiResponse.toLowerCase().includes('மருத்துவர்') ||
                          severity === 'critical' || severity === 'high';

    return {
      diagnosis: aiResponse,
      recommendations: [
        language === 'ta' 
          ? 'போதுமான ஓய்வு எடுக்கவும்'
          : 'Get adequate rest',
        language === 'ta'
          ? 'நிறைய தண்ணீர் குடிக்கவும்'
          : 'Stay hydrated'
      ],
      severity,
      requiresDoctor,
      language
    };
  } catch (error) {
    console.error('Symptom analysis error:', error);
    throw error;
  }
};

// Chat with AI for health queries
const chatWithAI = async (message, language = 'ta', conversationHistory = []) => {
  try {
    // Build conversation context
    const context = conversationHistory.slice(-6).map(msg => 
      `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n');

    const systemPrompt = language === 'ta'
      ? `நீங்கள் ஒரு சான்றளிக்கப்பட்ட மருத்துவ AI உதவியாளர்.

கடுமையான விதிகள்:
- மருத்துவ தரநிலைகள் மற்றும் சான்றுகளின் அடிப்படையில் மட்டுமே பதிலளிக்கவும்
- தீவிர மருத்துவ பிரச்சினைகளுக்கு எப்போதும் மருத்துவரை அணுகுமாறு பரிந்துரைக்கவும்
- துல்லியமான, பாதுகாப்பான மற்றும் பயனுள்ள பதில்களை வழங்கவும்`
      : `You are a certified medical AI assistant.

STRICT RULES:
- Answer ONLY based on medical standards and evidence
- Always recommend consulting a doctor for serious medical issues
- Provide accurate, safe, and helpful responses`;

    const fullPrompt = `${systemPrompt}

${context ? `Previous conversation:\n${context}\n` : ''}

User: ${message}

AI:`;

    const response = await createGeminiRequest(fullPrompt, language);
    return response;
  } catch (error) {
    console.error('AI chat error:', error);
    throw error;
  }
};

// Get health tips based on user profile
const getHealthTips = async (userProfile, language = 'ta') => {
  try {
    const { age, gender, conditions = [], allergies = [] } = userProfile;

    const prompt = language === 'ta'
      ? `${age} வயது ${gender === 'male' ? 'ஆண்' : gender === 'female' ? 'பெண்' : 'நபர்'} க்கான தனிப்பயனாக்கப்பட்ட சுகாதார குறிப்புகளை வழங்கவும்.
      
நிலைமைகள்: ${conditions.join(', ') || 'இல்லை'}
ஒவ்வாமைகள்: ${allergies.join(', ') || 'இல்லை'}

5 முக்கியமான சுகாதார குறிப்புகளை வழங்கவும்:`
      : `Provide personalized health tips for a ${age}-year-old ${gender}.
      
Conditions: ${conditions.join(', ') || 'None'}
Allergies: ${allergies.join(', ') || 'None'}

Provide 5 important health tips:`;

    const tips = await createGeminiRequest(prompt, language);
    return tips.split('\n').filter(tip => tip.trim().length > 0);
  } catch (error) {
    console.error('Health tips error:', error);
    throw error;
  }
};

module.exports = {
  analyzeSymptoms,
  chatWithAI,
  getHealthTips
};