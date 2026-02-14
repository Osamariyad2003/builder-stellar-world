# Firebase Cloud Messaging (FCM) Push Notifications

This document explains how to set up and use push notifications for news posts in the MedJust application.

## Overview

Push notifications are sent to users when news articles are created or updated for their related batch. The system uses Firebase Cloud Messaging (FCM) to deliver notifications both in the foreground (while the app is open) and in the background (via service worker).

## Architecture

### Client-Side
- **useFCM Hook** (`client/hooks/useFCM.ts`): Initializes FCM when the app loads
- **fcmService** (`client/lib/fcmService.ts`): Manages FCM token registration, permission requests, and notification sending
- **Service Worker** (`public/firebase-messaging-sw.js`): Handles background notifications when the app is closed

### Server-Side
- **fcmService** (`server/routes/fcmService.ts`): Firebase Admin SDK logic for sending notifications
- **notifications** (`server/routes/notifications.ts`): Express route handlers for API endpoints

### API Endpoints
- `POST /api/save-fcm-token`: Save user's FCM token to Firestore
- `POST /api/send-batch-notification`: Send notifications to all users in a batch
- `POST /api/send-user-notification`: Send notifications to specific users

## Setup Instructions

### 1. Firebase Configuration

#### Generate VAPID Key
A VAPID key is required for web push notifications. Generate it in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `medjust-d26eb`
3. Navigate to **Project Settings** → **Cloud Messaging**
4. Under "Web push certificates", click "Generate key pair"
5. Copy the generated public key

#### Update FCM Service
In `client/lib/fcmService.ts`, replace the VAPID key:

```typescript
const token = await getToken(msg, {
  vapidKey: "YOUR_PUBLIC_VAPID_KEY_HERE",
});
```

### 2. Environment Variables

#### Server-Side
Set up Firebase Admin SDK credentials. You have two options:

**Option A: Using Service Account File**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key (JSON format)
3. Set the `FIREBASE_SERVICE_ACCOUNT` environment variable:
```bash
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

**Option B: Using Application Default Credentials**
If deploying on Google Cloud Platform (Cloud Run, App Engine), credentials are automatically available.

### 3. Firestore Schema

#### Users Collection
The system expects a `users` collection with the following structure:

```json
{
  "uid": "user-id",
  "email": "user@example.com",
  "batchId": "batch-id",
  "fcmTokens": ["token1", "token2"],
  "lastTokenUpdate": "2024-01-15T10:00:00Z"
}
```

- **fcmTokens**: Array of FCM tokens for this user's devices
- **batchId**: The batch/year the user belongs to
- **lastTokenUpdate**: Timestamp of the last token update

#### News Collection
News items now support batch notifications:

```json
{
  "id": "news-id",
  "title": { "en": "...", "ar": "..." },
  "content": { "en": "...", "ar": "..." },
  "batchId": "batch-id",
  "sendNotification": true,
  "...other fields"
}
```

### 4. User Permissions

Update Firestore security rules to allow users to have FCM tokens:

```javascript
match /users/{userId} {
  allow read, update: if request.auth.uid == userId;
  allow read: if request.auth != null;
  allow create: if request.auth.uid == userId;
  
  // Allow updating FCM tokens
  allow update: if request.auth.uid == userId && 
    request.resource.data.fcmTokens != null;
}

match /news/{newsId} {
  allow read: if true; // Public read
  allow write: if request.auth != null; // Only admins
}
```

## How to Use

### For Admins (Creating News with Notifications)

1. Go to **Admin Dashboard** → **News**
2. Click **"Create Article"**
3. Fill in the article details (title, content, tags, etc.)
4. In the right sidebar, find the **"Notifications"** card
5. Select a **Batch** from the dropdown
6. Toggle **"Send Notification Now"** to ON
7. Click **"Create Article"**

The system will:
1. Create the news article in Firestore
2. Find all users in the selected batch
3. Get their FCM tokens
4. Send push notifications to their devices

### For Users (Receiving Notifications)

#### First Time Setup
When users open the app:
1. They'll see a browser notification permission request
2. Clicking **"Allow"** enables notifications
3. The app registers their FCM token with the server

#### Receiving Notifications
- **In Foreground**: Notifications appear in the browser and as a dialog
- **In Background**: Notifications appear in the system notification center
- **Clicking**: Opens the app and can navigate to the related news article

## Testing

### Manual Testing

1. **Create a Test User**
   - Sign up/login with test account
   - Ensure user is in a batch (set `batchId` in Firestore)

2. **Send Test Notification**
   - Go to Admin → News
   - Create a news article for the test user's batch
   - Toggle notifications ON
   - Save the article

3. **Verify on Test Device**
   - The notification should appear on the device
   - Check browser console for FCM token
   - Check background/foreground message handling

### Debugging

**Check FCM Token**
```javascript
// In browser console
const token = await messaging.getToken()
console.log("FCM Token:", token)
```

**Check Firestore**
```
Go to Firebase Console → Firestore → users/{userId}
Verify fcmTokens array is populated
```

**Check Server Logs**
```bash
# View notification sending results
npm run dev
# Look for "Notifications sent" logs
```

## Troubleshooting

### No notifications appearing
1. **Check permissions**: Did user allow notifications?
2. **Check FCM token**: Is the token saved in Firestore?
3. **Check batch**: Does the news article have a batchId?
4. **Check VAPID key**: Is it correctly set in fcmService.ts?

### Service Worker not registering
1. HTTPS is required (except localhost)
2. Service worker file must be in `public/` directory
3. Check browser console for registration errors

### Backend not sending notifications
1. Verify `FIREBASE_SERVICE_ACCOUNT` env variable is set
2. Check server logs for error messages
3. Verify user has `fcmTokens` in Firestore
4. Verify news `batchId` matches user `batchId`

## Files Changed/Created

### New Files
- `client/lib/fcmService.ts` - FCM client service
- `client/hooks/useFCM.ts` - FCM initialization hook
- `server/routes/fcmService.ts` - FCM backend service
- `server/routes/notifications.ts` - Notification API handlers
- `public/firebase-messaging-sw.js` - Service worker for background notifications
- `FCM_PUSH_NOTIFICATIONS.md` - This documentation

### Modified Files
- `client/components/admin/NewsForm.tsx` - Added batch selection and notification toggle
- `client/pages/admin/News.tsx` - Updated to handle batch notifications
- `client/hooks/useNews.ts` - Added notification sending logic
- `client/contexts/AuthContext.tsx` - Added FCM initialization on login
- `server/index.ts` - Added notification API routes
- `shared/types.ts` - Added `batchId` and `sendNotification` to NewsItem

## Security Considerations

1. **Token Storage**: FCM tokens are stored in Firestore and should be cleaned up when invalid
2. **User Privacy**: Only send notifications to users in the specified batch
3. **Rate Limiting**: Consider implementing rate limiting for notification API
4. **Admin Verification**: Ensure only admins can create news and send notifications
5. **Token Rotation**: Tokens should be periodically refreshed

## Performance Optimization

- **Batch Sending**: Notifications are sent in batches (max 500 per request)
- **Token Cleanup**: Invalid tokens are automatically removed
- **Selective Notifications**: Only relevant users receive notifications
- **Async Processing**: Notifications sent asynchronously without blocking article creation

## Future Enhancements

1. **Scheduled Notifications**: Send notifications at specific times
2. **Notification Templates**: Pre-defined notification formats
3. **Delivery Reports**: Track which users received/opened notifications
4. **User Preferences**: Allow users to control notification settings
5. **Analytics**: Track notification engagement and click-through rates
6. **Multi-Language**: Send notifications in user's preferred language
7. **Rich Notifications**: Include images, buttons, and actions in notifications

## References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://tools.ietf.org/html/draft-thomson-webpush-protocol)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
