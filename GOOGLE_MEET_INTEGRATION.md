# Google Meet Integration Options

## Current Implementation
- Uses `https://meet.google.com/new` - Creates instant meeting
- Requires doctor to be logged into Google account
- Meeting is created when link is opened

## For Demo/Production

### Option 1: Use Pre-Created Meeting Link (Easiest for Demo)
Update backend to use a pre-created Google Meet link:

```javascript
// In server.js, line ~660
request.meetingLink = 'https://meet.google.com/abc-defg-hij'; // Your pre-created meeting
```

**Steps to create**:
1. Go to https://meet.google.com
2. Click "New meeting" → "Create an instant meeting"
3. Copy the meeting link (e.g., https://meet.google.com/abc-defg-hij)
4. Use this link in the code above

### Option 2: Google Calendar API Integration (Production)
For production, integrate with Google Calendar API to create actual meetings:

1. Enable Google Calendar API in Google Cloud Console
2. Get OAuth2 credentials
3. Use Google Calendar API to create meeting:

```javascript
const { google } = require('googleapis');

// Create meeting
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const event = await calendar.events.insert({
  calendarId: 'primary',
  conferenceDataVersion: 1,
  requestBody: {
    summary: 'Video Consultation',
    start: { dateTime: scheduledDate },
    end: { dateTime: endDate },
    conferenceData: {
      createRequest: { requestId: uuidv4() }
    }
  }
});

const meetingLink = event.data.hangoutLink;
```

### Option 3: Third-Party Video Services
- **Jitsi Meet**: Free, open-source, no account needed
  - Link format: `https://meet.jit.si/maruthuvan-${requestId}`
  - Works instantly, no setup required

- **Zoom**: Requires Zoom API integration
- **Microsoft Teams**: Requires Teams API integration

## Recommended for Demo
Use **Option 1** with a pre-created Google Meet link for immediate demo.

## Current Behavior
- Doctor clicks "Accept"
- Opens `https://meet.google.com/new`
- Google Meet creates instant meeting
- Doctor needs to share actual meeting link with patient manually

## To Fix "Invalid Call" Error
The error occurs because we're generating random meeting codes that don't exist in Google Meet.

**Solution**: Use one of the options above to generate valid meeting links.
