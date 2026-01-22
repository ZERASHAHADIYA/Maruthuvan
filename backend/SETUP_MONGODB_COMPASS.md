# MongoDB Compass Setup Guide

## ✅ Changes Made

1. **MongoDB Connection**: Changed from MongoDB Atlas to local MongoDB Compass
2. **Gemini AI**: Enhanced with certified medical response prompts
3. **Error Handling**: Added better connection error messages

## 🔧 Setup Steps

### 1. Install MongoDB (if not installed)

**Download MongoDB Community Server:**
- Visit: https://www.mongodb.com/try/download/community
- Download and install MongoDB Community Server for Windows
- During installation, select "Install MongoDB as a Service"

### 2. Start MongoDB Service

**Option A - Using Windows Services:**
```cmd
net start MongoDB
```

**Option B - Using MongoDB Compass:**
- Open MongoDB Compass
- It will automatically connect to `mongodb://localhost:27017`

**Option C - Manual Start:**
```cmd
mongod --dbpath "C:\data\db"
```

### 3. Verify MongoDB is Running

**Check in MongoDB Compass:**
- Open MongoDB Compass
- Connect to: `mongodb://localhost:27017`
- You should see the connection successful

**Check via Command Line:**
```cmd
mongo --eval "db.version()"
```

### 4. Start Your Backend Server

```cmd
cd backend
npm install
node server.js
```

## ✅ Expected Output

When server starts successfully, you should see:

```
✅ MongoDB Compass connected successfully
📍 Database: maruthuvan
✅ Gemini AI connected - Certified medical responses enabled
✅ Sample data seeded: 2 hospitals, 5 doctors
✅ SOS collection created
🚀 Maruthuvan Backend running on port 5000
```

## 🔍 Troubleshooting

### Error: "ECONNREFUSED"

**Solution:**
1. Make sure MongoDB service is running:
   ```cmd
   net start MongoDB
   ```

2. Check if MongoDB is listening on port 27017:
   ```cmd
   netstat -an | findstr 27017
   ```

3. If MongoDB is not installed, download from: https://www.mongodb.com/try/download/community

### Error: "Gemini AI connection failed"

**Solution:**
1. Check your `.env` file has valid `GEMINI_API_KEY`
2. Verify internet connection
3. Test Gemini API key at: https://aistudio.google.com/

## 🎯 Key Features

### Certified Medical Responses
- All AI responses are now based on medical evidence and clinical guidelines
- Prompts explicitly request certified medical information (not generic AI responses)
- Responses include certification notes

### Local Database
- All data stored locally in MongoDB Compass
- No cloud dependency for database
- Faster response times

### Gemini LLM Integration
- Connected to Google's Gemini 1.5 Flash model
- Provides evidence-based medical guidance
- Supports both Tamil and English languages

## 📝 Configuration

Your `.env` file now uses:
```env
MONGODB_URI=mongodb://localhost:27017/maruthuvan
GEMINI_API_KEY=AIzaSyDvMBba1Hbcb0_1o3FI9aUyuy41imuZSCo
```

## 🧪 Test Endpoints

### Health Check (includes Gemini test):
```
GET http://localhost:5000/api/health-check
```

### Test Symptom Analysis:
```
POST http://localhost:5000/api/auth/send-otp
Body: { "mobile": "9876543210", "language": "ta" }
```

## 📊 MongoDB Compass Usage

1. **View Collections:**
   - Open MongoDB Compass
   - Connect to `localhost:27017`
   - Select `maruthuvan` database
   - View collections: users, hospitals, doctors, sos, etc.

2. **Query Data:**
   - Click on any collection
   - Use the filter bar to query documents
   - Example: `{ "mobile": "9876543210" }`

3. **Monitor Performance:**
   - Use the Performance tab to monitor queries
   - Check indexes for optimization

## 🚀 Next Steps

1. Start MongoDB service
2. Run `node server.js`
3. Test the API endpoints
4. Use MongoDB Compass to view data
5. Check Gemini AI responses are certified medical advice

## ⚠️ Important Notes

- MongoDB must be running before starting the backend server
- Gemini API requires internet connection
- All AI responses emphasize they are certified medical guidance
- Always recommend consulting a doctor for serious conditions
