# MARUTHUVAN - Complete Data Flow Verification

## ✅ Backend Status
- **Server**: Running on port 5000
- **MongoDB**: Connected ✅
- **Gemini AI**: Configured ✅
- **Total Endpoints**: 33

---

## 🔐 1. AUTHENTICATION FLOW

### Patient Login
**Path**: `/` → `/dashboard`

**Flow**:
1. User enters mobile number (Demo: `9876543210`)
2. Backend sends OTP (Demo OTP: `121221`)
3. User enters OTP
4. Backend verifies OTP and creates/fetches User from MongoDB
5. JWT token generated and stored in localStorage
6. User redirected to `/dashboard`

**Database**:
- Collection: `users`
- Fields: mobile, aadhar, patientId, name, fatherName, dateOfBirth, age, gender, bloodGroup, address, allergies, language, isVerified

**API Endpoints**:
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and login

---

## 🏥 2. VIDEO CONSULTATION REQUEST FLOW

### Patient Side
**Path**: `/dashboard` → `/consult` → Doctor Panel

**Flow**:
1. Patient clicks "Video Consultation" in dashboard
2. Redirected to `/consult` page
3. **Step 1**: Enable location permission
   - Browser geolocation API gets user coordinates
   - State: `userLocation = { lat, lng }`

4. **Step 2**: View hospitals on map
   - Frontend: `GET /api/consult/hospitals`
   - Backend fetches from `hospitals` collection
   - Returns: Array of hospitals with location, name, doctors count
   - MapComponent displays hospitals on Leaflet map

5. **Step 3**: Select hospital → View doctors
   - Frontend: `GET /api/consult/doctors?hospitalId={id}`
   - Backend fetches from `doctors` collection where `hospitalId` matches
   - Populates `hospitalId` reference
   - Returns: Array of doctors with name, specialization, experience, rating

6. **Step 4**: Select doctor → Send request
   - Frontend: `POST /api/consult/request`
   - Request body:
     ```json
     {
       "doctorId": "696f512b6d99921d78205319",
       "hospitalId": "696f512b6d99921d78205312",
       "scheduledDate": "2026-01-22T00:00:00.000Z",
       "timeSlot": "Now",
       "symptoms": "Video consultation request"
     }
     ```
   - Backend creates `ConsultationRequest` document
   - Status: `pending`
   - Generates unique `requestId`: `REQ-{timestamp}`

**Database**:
- Collection: `consultationrequests`
- Fields: requestId, patientId (ref User), doctorId (ref Doctor), hospitalId (ref Hospital), scheduledDate, timeSlot, symptoms, status, meetingLink, consultationFee

### Doctor Panel Side
**Path**: `/admin/login` → `/doctor`

**Flow**:
1. Admin logs in with credentials (admin/admin123)
2. localStorage sets `isAdmin = true`
3. Redirected to `/doctor` panel
4. **Fetch Requests**:
   - Frontend: `GET /api/doctor/requests` (no doctorId filter for demo)
   - Backend fetches ALL pending requests
   - Populates: `patientId`, `doctorId`, `hospitalId`
   - Returns: Array of requests with full patient details

5. **Display Request Card**:
   - Patient Name: `request.patientId.name`
   - Patient Mobile: `request.patientId.mobile`
   - Doctor: `request.doctorId.name`
   - Hospital: `request.hospitalId.name`
   - Date & Time: `request.scheduledDate`, `request.timeSlot`
   - Request ID: `request.requestId`
   - Symptoms: `request.symptoms`

6. **Accept Request**:
   - Frontend: `PUT /api/doctor/request/{requestId}`
   - Request body: `{ "status": "accepted" }`
   - Backend:
     - Finds request by `requestId`
     - Updates status to `accepted`
     - Generates Google Meet link: `https://meet.google.com/{meetingId}`
     - Saves `meetingLink` and `meetingId`
   - Doctor redirected to Google Meet in new tab

7. **Reject Request**:
   - Frontend: `PUT /api/doctor/request/{requestId}`
   - Request body: `{ "status": "rejected", "rejectionReason": "..." }`
   - Backend updates status and saves reason

---

## 🗺️ 3. HOSPITAL & DOCTOR DATA

### Hospitals (6 total)
**Collection**: `hospitals`

1. Government General Hospital - Chennai
2. Rajiv Gandhi Government General Hospital - Chennai
3. Government Rajaji Hospital - Madurai
4. Coimbatore Medical College Hospital - Coimbatore
5. Mahatma Gandhi Memorial Government Hospital - Trichy
6. Government Mohan Kumaramangalam Medical College Hospital - Salem

**Fields**:
- name, nameTranslations (ta, en)
- address
- location: { type: 'Point', coordinates: [lng, lat] }
- rating, isActive

### Doctors (14 total)
**Collection**: `doctors`

**Distribution**:
- Chennai Hospital 1: 3 doctors
- Chennai Hospital 2: 2 doctors
- Madurai: 3 doctors
- Coimbatore: 2 doctors
- Trichy: 2 doctors
- Salem: 2 doctors

**Fields**:
- name, hospitalId (ref Hospital)
- specialization, specializationTranslations (ta, en)
- experience, languages, consultationFee, rating, isActive

---

## 👤 4. DEMO USER DATA

**Collection**: `users`

**Demo User**:
```json
{
  "mobile": "9876543210",
  "aadhar": "345678903214",
  "patientId": "MARU-123456",
  "name": "Suryaprakash",
  "fatherName": "Kumar Prakash",
  "dateOfBirth": "1996-08-15",
  "age": 28,
  "gender": "Male",
  "bloodGroup": "B+",
  "address": "123, Main Street, Madurai, Tamil Nadu - 625001",
  "allergies": ["Peanuts", "Dust"],
  "language": "en",
  "isVerified": true
}
```

**Login Credentials**:
- Mobile: `9876543210`
- OTP: `121221` (fixed for demo)

---

## 🔄 5. COMPLETE REQUEST LIFECYCLE

### State Transitions
```
pending → accepted → (Google Meet call) → completed
pending → rejected
```

### Database Updates
1. **Create Request** (Patient):
   - INSERT into `consultationrequests`
   - status: `pending`
   - patientId: from JWT token
   - doctorId, hospitalId: from selection

2. **Accept Request** (Doctor):
   - UPDATE `consultationrequests`
   - SET status = `accepted`
   - SET meetingLink = `https://meet.google.com/{uuid}`
   - SET meetingId = `{uuid}`

3. **Reject Request** (Doctor):
   - UPDATE `consultationrequests`
   - SET status = `rejected`
   - SET rejectionReason = `{reason}`

---

## 🔍 6. DATA POPULATION (MONGOOSE POPULATE)

### Request Fetch with Population
```javascript
ConsultationRequest.find({ status: 'pending' })
  .populate('patientId')      // User document
  .populate('doctorId')       // Doctor document
  .populate('hospitalId')     // Hospital document
```

**Result Structure**:
```json
{
  "_id": "...",
  "requestId": "REQ-1769035390309",
  "patientId": {
    "_id": "...",
    "name": "Suryaprakash",
    "mobile": "9876543210",
    "bloodGroup": "B+",
    "allergies": ["Peanuts", "Dust"]
  },
  "doctorId": {
    "_id": "...",
    "name": "Dr. Rajesh Kumar",
    "specialization": "General Medicine"
  },
  "hospitalId": {
    "_id": "...",
    "name": "Government General Hospital",
    "address": "Park Town, Chennai - 600003"
  },
  "scheduledDate": "2026-01-22T00:00:00.000Z",
  "timeSlot": "Now",
  "symptoms": "Video consultation request",
  "status": "pending"
}
```

---

## 🌐 7. FRONTEND-BACKEND CONNECTIVITY

### API Client Configuration
**File**: `frontend/src/lib/api.js`

**Base URL**: `http://localhost:5000`

**Authentication**: 
- JWT token from localStorage
- Header: `Authorization: Bearer {token}`

### Key API Methods
```javascript
// Consultation
getDoctorRequests(doctorId)
updateConsultationRequest(requestId, status, reason)

// Hospitals & Doctors
fetchHospitals() → GET /api/consult/hospitals
fetchDoctors(hospitalId) → GET /api/consult/doctors?hospitalId={id}

// Create Request
POST /api/consult/request
```

---

## 📊 8. MONGODB COLLECTIONS

### Current Collections
1. **users** - Patient data
2. **hospitals** - Hospital information
3. **doctors** - Doctor profiles
4. **consultationrequests** - Video consultation requests
5. **labtests** - Lab test catalog
6. **diagnosticlabs** - Diagnostic lab centers
7. **labbookings** - Lab test bookings
8. **labreports** - Lab reports
9. **sos** - Emergency SOS records
10. **patientqrs** - Patient QR codes
11. **prescriptions** - Doctor prescriptions

---

## ✅ 9. VERIFICATION CHECKLIST

### Backend
- [x] Server running on port 5000
- [x] MongoDB connected
- [x] Demo user seeded (Suryaprakash)
- [x] 6 hospitals seeded
- [x] 14 doctors seeded
- [x] OTP fixed for demo (121221)
- [x] JWT authentication working
- [x] Mongoose populate working

### Frontend
- [x] Login page functional
- [x] Dashboard accessible after login
- [x] Video consultation flow complete
- [x] Location permission working
- [x] Map displaying hospitals
- [x] Doctor selection working
- [x] Request creation working

### Doctor Panel
- [x] Admin login working (admin/admin123)
- [x] Requests fetching from DB
- [x] Patient details displaying
- [x] Accept button working
- [x] Reject button working
- [x] Google Meet redirect working
- [x] Prescription button removed

### Data Flow
- [x] Patient → Request → Database
- [x] Database → Doctor Panel
- [x] Doctor Panel → Accept → Update Database
- [x] Database → Generate Meeting Link
- [x] Meeting Link → Redirect Doctor

---

## 🧪 10. TESTING STEPS

### Test Complete Flow
1. **Login as Patient**:
   - Go to `http://localhost:3001`
   - Enter mobile: `9876543210`
   - Enter OTP: `121221`
   - Should redirect to dashboard

2. **Send Consultation Request**:
   - Click "Video Consultation"
   - Enable location
   - Select any hospital
   - Select any doctor
   - Click "Send Video Consultation Request"
   - Should see success alert

3. **Check Doctor Panel**:
   - Go to `http://localhost:3001/admin/login`
   - Login: admin/admin123
   - Should see request with patient name "Suryaprakash"
   - Should see all patient details

4. **Accept Request**:
   - Click "Accept" button
   - Should open Google Meet in new tab
   - Request should disappear from pending list

### Verify Database
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Database: `maruthuvan`
4. Check collections:
   - `users` - Should have Suryaprakash
   - `hospitals` - Should have 6 hospitals
   - `doctors` - Should have 14 doctors
   - `consultationrequests` - Should have requests with status

---

## 🔧 11. TROUBLESHOOTING

### Request Not Showing in Doctor Panel
- Check backend console for logs
- Verify `patientId` is being populated
- Check MongoDB for request document
- Verify status is `pending`

### Patient Name Not Showing
- Check User document exists in MongoDB
- Verify `patientId` reference is correct ObjectId
- Check populate is working (backend logs)

### Meeting Link Not Generated
- Check backend logs for UUID generation
- Verify request status changed to `accepted`
- Check `meetingLink` field in database

---

## 📝 12. SUMMARY

**Complete Data Flow**:
```
Patient Login (Mobile + OTP)
    ↓
JWT Token Stored
    ↓
Dashboard → Video Consultation
    ↓
Enable Location → View Hospitals (MongoDB)
    ↓
Select Hospital → View Doctors (MongoDB)
    ↓
Select Doctor → Send Request (MongoDB INSERT)
    ↓
Doctor Panel Fetches Requests (MongoDB FIND + POPULATE)
    ↓
Doctor Accepts → Update Status + Generate Meeting Link (MongoDB UPDATE)
    ↓
Redirect to Google Meet
```

**All connections verified and working!** ✅
