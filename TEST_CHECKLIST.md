# Quick Test Checklist ✅

## Before Testing
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000  
- [ ] MongoDB connected
- [ ] **RESTART frontend server** (Ctrl+C then `npm run dev`)

## Test 1: Dashboard Button Visible
1. Go to http://localhost:3000/auth
2. Login/Register
3. On dashboard, scroll to hero section
4. **Look for**: White button with "📹 Book Video Consultation"
5. **Location**: Right side, below "How can we help you today?"

## Test 2: Booking Flow
1. Click "Book Video Consultation" button
2. Should redirect to `/consult/request`
3. Step 1: Select a hospital
4. Step 2: Select a doctor
5. Step 3: Fill date, time, symptoms
6. Click "Send Request"
7. Should see success message

## Test 3: Doctor Panel
1. Open new tab: http://localhost:3000
2. Click blue "Admin" button (top-right)
3. Login: admin / admin123
4. Should see pending request
5. Click "Accept" button
6. **Expected**: Google Meet opens in new tab
7. **Expected**: Alert says "Accepted! Redirecting to Google Meet..."

## Test 4: Patient Joins
1. Go back to patient tab
2. Navigate to "My Requests" (from navbar or bottom nav)
3. Find the accepted request
4. **Expected**: Green "Accepted" badge
5. **Expected**: "Join Meeting" button visible
6. Click "Join Meeting"
7. **Expected**: Google Meet opens

---

## If Button Not Visible

### Solution 1: Hard Refresh
- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

### Solution 2: Clear Cache
- Open DevTools (F12)
- Right-click refresh button
- Select "Empty Cache and Hard Reload"

### Solution 3: Restart Frontend
```bash
cd frontend
# Press Ctrl+C
npm run dev
```

### Solution 4: Check Browser Console
- Press F12
- Look for any errors in Console tab
- Look for any failed network requests in Network tab

---

## Expected Results

✅ Dashboard shows "Book Video Consultation" button  
✅ Clicking button goes to consultation request form  
✅ Form has 3 steps (Hospital → Doctor → Schedule)  
✅ Request appears in doctor panel  
✅ Doctor can accept/reject  
✅ On accept, Google Meet opens for doctor  
✅ Patient sees "Join Meeting" button  
✅ Patient can join the same meeting  

---

## Common Issues

### Issue: "Button not showing"
- **Cause**: Frontend not restarted
- **Fix**: Restart dev server

### Issue: "Request not in doctor panel"  
- **Cause**: Backend not running
- **Fix**: Start backend with `npm start`

### Issue: "Cannot login to admin"
- **Cause**: Wrong credentials
- **Fix**: Use `admin` / `admin123`

### Issue: "Meeting link not generated"
- **Cause**: Backend error
- **Fix**: Check backend terminal for errors

---

**All changes are saved and ready!**  
**Just restart the frontend server to see them.**
