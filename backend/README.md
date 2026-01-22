# Maruthuvan Backend

A comprehensive multilingual (Tamil + English) rural healthcare platform backend built with Node.js, Express, MongoDB, and Socket.IO.

## 🚀 Features

- **🔐 OTP-based Authentication** - Mobile number verification
- **🆔 Health ID Management** - Aadhar integration and QR codes
- **🧠 AI Symptom Analysis** - Google Gemini API integration
- **👨‍⚕️ Doctor Consultation** - Video calls via WebRTC
- **🚨 SOS Emergency System** - Real-time emergency alerts
- **🎬 Health Content (Ungal Nalam)** - YouTube API integration
- **🌍 Multilingual Support** - Tamil and English
- **📱 Real-time Communication** - WebSocket support

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **AI**: Google Gemini API
- **Media**: YouTube Data API
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Google Gemini API Key
- YouTube Data API Key (optional)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maruthuvan-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/maruthuvan
   JWT_SECRET=your_super_secret_jwt_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   PORT=5000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Seed the database** (optional)
   ```bash
   node seed.js
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "language": "ta"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456",
  "name": "John Doe",
  "language": "ta"
}
```

### User Management

#### Update Language
```http
PUT /api/user/language
Authorization: Bearer <token>
Content-Type: application/json

{
  "language": "ta"
}
```

### Health ID

#### Get Health ID
```http
GET /api/health-id
Authorization: Bearer <token>
```

#### Update Health ID
```http
PUT /api/health-id
Authorization: Bearer <token>
Content-Type: application/json

{
  "aadhar": {
    "aadharNumber": "123456789012",
    "name": "John Doe",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": "123 Main St"
  },
  "healthRecord": {
    "bloodGroup": "O+",
    "height": 175,
    "weight": 70,
    "allergies": [
      {
        "name": "Peanuts",
        "severity": "severe",
        "language": "en"
      }
    ]
  }
}
```

### AI Features

#### Symptom Check
```http
POST /api/ai/symptom-check
Authorization: Bearer <token>
Content-Type: application/json

{
  "symptoms": [
    {
      "symptom": "fever",
      "severity": "moderate",
      "duration": "2 days"
    }
  ],
  "language": "ta"
}
```

#### Health Chat
```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What should I do for headache?",
  "language": "en",
  "chatId": "optional_existing_chat_id"
}
```

### Consultation

#### Get Hospitals
```http
GET /api/consult/hospitals?latitude=13.0827&longitude=80.2707&language=ta
Authorization: Bearer <token>
```

#### Get Doctors
```http
GET /api/consult/doctors?hospitalId=<hospital_id>&language=ta
Authorization: Bearer <token>
```

#### Book Consultation
```http
POST /api/consult/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "<doctor_id>",
  "hospitalId": "<hospital_id>",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "type": "video"
}
```

### SOS Emergency

#### Trigger SOS
```http
POST /api/sos/trigger
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "latitude": 13.0827,
    "longitude": 80.2707
  },
  "address": "123 Main St, Chennai",
  "emergencyType": "medical",
  "description": "Chest pain",
  "language": "ta"
}
```

### Health Videos

#### Get Videos
```http
GET /api/health/videos?language=ta&category=nutrition&page=1&limit=10
Authorization: Bearer <token>
```

## 🔌 WebSocket Events

### SOS Events
```javascript
// Client side
socket.emit('trigger_sos', {
  location: { latitude: 13.0827, longitude: 80.2707 },
  emergencyType: 'medical',
  description: 'Emergency situation',
  language: 'ta'
});

// Server responses
socket.on('sos_acknowledged', (data) => {
  console.log(data.message);
});
```

### Video Call Events
```javascript
// Join video call
socket.emit('join_video_call', {
  meetingId: 'meeting_123',
  consultationId: 'consultation_456'
});

// WebRTC signaling
socket.emit('webrtc_offer', {
  meetingId: 'meeting_123',
  offer: rtcOffer,
  targetUserId: 'doctor_id'
});
```

## 🗂️ Project Structure

```
maruthuvan-backend/
├── models/           # MongoDB schemas
├── routes/           # API route handlers
├── middleware/       # Custom middleware
├── utils/           # Utility functions
├── socket/          # Socket.IO handlers
├── server.js        # Main server file
├── seed.js          # Database seeder
└── .env             # Environment variables
```

## 🔒 Security Features

- JWT authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- MongoDB injection prevention

## 🌍 Multilingual Support

The system supports Tamil and English with:
- Language-specific API responses
- Translated database content
- AI responses in user's preferred language
- Localized error messages

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name "maruthuvan-backend"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring

The application includes:
- Health check endpoint: `GET /api/health`
- Error logging
- Performance monitoring ready
- Socket.IO connection tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Maruthuvan** - Empowering rural healthcare through technology 🏥💚