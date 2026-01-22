# 🚀 QUICK TEST GUIDE - MARUTHUVAN

## ✅ System Status
- **Backend**: Running on http://localhost:5000
- **Frontend**: Running on http://localhost:3001
- **MongoDB**: Connected with data
  - Users: 2
  - Hospitals: 6
  - Doctors: 14

---

## 🧪 TEST THE COMPLETE FLOW (5 Minutes)

### Step 1: Patient Login
1. Open browser: `http://localhost:3001`
2. Enter mobile: `9876543210`
3. Click "Send OTP"
4. Enter OTP: `121221`
5. ✅ Should redirect to dashboard

### Step 2: Send Video Consultation Request
1. Click "Video Consultation" button in dashboard
2. Click "Enable Location" (allow browser permission)
3. ✅ Should see map with 6 hospitals
4. Click any hospital card
5. ✅ Should see list of doctors
6. Click any doctor card
7. ✅ Should see doctor details page
8. Click "Send Video Consultation Request"
9. ✅ Should see success alert

### Step 3: Doctor Panel - View Request
1. Open new tab: `http://localhost:3001/admin/login`
2. Username: `admin`
3. Password: `admin123`
4. Click "Login"
5. ✅ Should see doctor panel with pending request
6. ✅ Request should show:
   - Patient Name: **Suryaprakash**
   - Mobile: **9876543210**
   - Doctor name
   - Hospital name
   - Date & Time
   - Request ID
   - Symptoms

### Step 4: Accept Request
1. Click "Accept" button
2. ✅ Should see success alert
3. ✅ Google Meet should open in new tab
4. ✅ Request should disappear from pending list

---

## 📊 Verify in MongoDB Compass

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Database: `maruthuvan`

### Check Collections:

**users** - Should have:
```json
{
  "name": "Suryaprakash",
  "mobile": "9876543210",
  "patientId": "MARU-123456",
  "bloodGroup": "B+",
  "allergies": ["Peanuts", "Dust"]
}
```

**hospitals** - Should have 6 documents:
- Government General Hospital (Chennai)
- Rajiv Gandhi Government General Hospital (Chennai)
- Government Rajaji Hospital (Madurai)
- Coimbatore Medical College Hospital
- Mahatma Gandhi Memorial Government Hospital (Trichy)
- Government Mohan Kumaramangalam Medical College Hospital (Salem)

**doctors** - Should have 14 documents across all hospitals

**consultationrequests** - After sending request:
```json
{
  "requestId": "REQ-...",
  "patientId": ObjectId("..."),
  "doctorId": ObjectId("..."),
  "hospitalId": ObjectId("..."),
  "status": "pending",  // Changes to "accepted" after doctor accepts
  "meetingLink": "https://meet.google.com/...",  // Generated after accept
  "symptoms": "Video consultation request"
}
```

---

## 🔍 Debug Checklist

### If Request Not Showing in Doctor Panel:
1. Check backend console - should show:
   ```
   📋 Fetched requests: 1
   Sample request: { patient: 'Suryaprakash', ... }
   ```
2. Check MongoDB `consultationrequests` collection
3. Verify status is `pending`

### If Patient Name Not Showing:
1. Backend should log patient name in console
2. Check User document exists in MongoDB
3. Verify `patientId` is being populated

### If Accept Button Not Working:
1. Check browser console for errors
2. Check backend logs for update confirmation
3. Verify meeting link is generated

---

## 🎯 Expected Results

✅ **Patient Side**:
- Login successful with demo credentials
- Can see 6 hospitals on map
- Can select hospital and view doctors
- Can send consultation request
- Receives success confirmation

✅ **Doctor Panel**:
- Admin login successful
- Sees pending request with full patient details
- Can accept request
- Redirected to Google Meet
- Request removed from pending list

✅ **Database**:
- Request created with status `pending`
- After accept: status changes to `accepted`
- Meeting link generated and stored
- All references (patientId, doctorId, hospitalId) properly linked

---

## 📝 Demo Credentials Summary

**Patient Login**:
- Mobile: `9876543210`
- OTP: `121221`

**Admin/Doctor Login**:
- Username: `admin`
- Password: `admin123`

**Patient Details** (Suryaprakash):
- Patient ID: MARU-123456
- Aadhar: 3456-7890-3214
- Age: 28 years
- Blood Group: B+
- Allergies: Peanuts, Dust

---

## ✨ All Systems Operational!

The complete data flow is verified and working:
1. ✅ Authentication & Login
2. ✅ Hospital & Doctor Data Fetching
3. ✅ Consultation Request Creation
4. ✅ Doctor Panel Request Display
5. ✅ Request Accept/Reject
6. ✅ Google Meet Integration
7. ✅ Database Storage & Retrieval
8. ✅ Mongoose Population
9. ✅ Frontend-Backend Connectivity

**Ready for demo!** 🚀
