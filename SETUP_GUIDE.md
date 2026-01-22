# 🚀 MARUTHUVAN - Complete Setup & Running Guide

## 📋 Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Git

## 🔧 Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd MARUTHUVAN/backend

# Install dependencies
npm install

# Verify .env file has these keys:
# MONGODB_URI=mongodb+srv://zzera1153_db_user:zerashahadiya@cluster0.0yjcpvj.mongodb.net/maruthuvan
# JWT_SECRET=e435271afd0dc7d69e1d99ade0177759897bd797542c8055e31699d611dc093d
# GEMINI_API_KEY=AIzaSyDCO4dv64NocT5K9Rexww_3BtPxge3gNCg
# YOUTUBE_API_KEY=AIzaSyAXeTCJmTRyO7rJcbcm_CPwazMyHB2AFtY
# PORT=5000
# FRONTEND_URL=http://localhost:3000

# Start backend server
npm start
```

**Backend will run on:** `http://localhost:5000`

### 2. Frontend Setup

```bash
# Open NEW terminal
# Navigate to frontend directory
cd MARUTHUVAN/frontend

# Install dependencies (if not already done)
npm install

# Start frontend
npm run dev
```

**Frontend will run on:** `http://localhost:3000`

---

## ✅ Verify Everything is Working

### Test Backend Health
Open browser: `http://localhost:5000/api/health-check`

Should show:
```json
{
  "status": "OK",
  "services": {
    "mongodb": "Connected",
    "geminiAI": "Connected",
    "youtubeAPI": "Configured"
  }
}
```

---

## 🧪 Testing Features

### 1. **OTP Login**
- Go to: `http://localhost:3000/auth`
- Enter 12-digit Aadhar (e.g., 123456789012)
- Get OTP in alert
- Enter OTP → Login

### 2. **AI Symptom Check**
- Go to: `http://localhost:3000/ai-check`
- Enter symptoms
- Gemini AI analyzes
- If critical → Video call option

### 3. **Doctor Consultation**
- Go to: `http://localhost:3000/consult`
- Allow location
- Select hospital
- Select doctor
- Click "Start Video Call"
- Get Google Meet/Skype links

### 4. **SOS Emergency**
- Click SOS button (bottom right)
- Confirm
- Audio call to 108 initiated
- Saved in MongoDB

### 5. **Health Videos**
- Go to: `http://localhost:3000/ungal-nalam`
- Select Tamil/English
- See curated health videos

---

## 📊 Check Database

### MongoDB Compass
1. Download: https://www.mongodb.com/try/download/compass
2. Connect: `mongodb+srv://zzera1153_db_user:zerashahadiya@cluster0.0yjcpvj.mongodb.net/maruthuvan`
3. View collections:
   - `users` - Registered users
   - `sos` - Emergency alerts
   - `hospitals` - Hospital data
   - `doctors` - Doctor data

---

## 🎯 Key Features Working

✅ **OTP Authentication** - Mobile-based login
✅ **Gemini AI** - Symptom analysis & health chat
✅ **Video Calls** - Google Meet/Skype integration
✅ **Audio Calls** - SOS emergency to 108
✅ **Health Videos** - YouTube curated content
✅ **Multilingual** - Tamil & English support
✅ **Database** - MongoDB storage

---

## 🔍 API Testing (Postman)

### 1. Health Check
```
GET http://localhost:5000/api/health-check
```

### 2. Send OTP
```
POST http://localhost:5000/api/auth/send-otp
Body: {"mobile": "1234567890", "language": "ta"}
```

### 3. Verify OTP
```
POST http://localhost:5000/api/auth/verify-otp
Body: {"mobile": "1234567890", "otp": "123456", "name": "Test", "language": "ta"}
```
Copy the `token` from response!

### 4. AI Symptom Check (with token)
```
POST http://localhost:5000/api/ai/symptom-check
Headers: Authorization: Bearer YOUR_TOKEN
Body: {
  "symptoms": [{"symptom": "fever", "severity": "high", "duration": "3 days"}],
  "language": "ta",
  "mobile": "9876543210"
}
```

### 5. Book Video Call
```
POST http://localhost:5000/api/consult/book
Headers: Authorization: Bearer YOUR_TOKEN
Body: {
  "doctorId": "DOCTOR_ID",
  "hospitalId": "HOSPITAL_ID",
  "mobile": "9876543210"
}
```
Response includes Google Meet & Skype links!

### 6. Trigger SOS
```
POST http://localhost:5000/api/sos/trigger
Headers: Authorization: Bearer YOUR_TOKEN
Body: {
  "location": {"latitude": 13.0827, "longitude": 80.2707},
  "emergencyType": "medical",
  "language": "ta",
  "mobile": "9876543210"
}
```
Response includes audio call link!

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 5000 is free
- Verify MongoDB connection string
- Check .env file exists

### Frontend won't start
- Check if port 3000 is free
- Run `npm install` again
- Clear .next folder: `rm -rf .next`

### Gemini AI not working
- Verify GEMINI_API_KEY in .env
- Test: `http://localhost:5000/api/health-check`
- Check API quota: https://makersuite.google.com/app/apikey

### Database not saving
- Check MongoDB connection
- View logs in backend console
- Verify MongoDB Compass connection

---

## 📱 Production Deployment

### Backend (AWS/Heroku)
1. Set environment variables
2. Update FRONTEND_URL
3. Deploy server.js

### Frontend (Vercel/Netlify)
1. Update API base URL
2. Deploy Next.js app

---

## 🎉 You're All Set!

**Backend:** http://localhost:5000
**Frontend:** http://localhost:3000
**Database:** MongoDB Atlas

**Test the complete flow:**
1. Login with OTP
2. Check symptoms with AI
3. Book video consultation
4. Test SOS emergency
5. Watch health videos

Everything is working! 🚀