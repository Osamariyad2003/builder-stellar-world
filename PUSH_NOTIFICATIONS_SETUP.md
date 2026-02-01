# Push Notifications Setup Guide

This guide explains how to set up push notifications for the MedAdmin application.

## Overview

The application supports browser push notifications using Firebase Cloud Messaging (FCM). When news articles are created with a `yearId`, notifications are automatically sent to all users in the same batch.

## Features

- ✅ Browser push notifications (foreground)
- ✅ Background notifications via service worker
- ✅ Automatic notification creation when news is published
- ✅ FCM token management
- ✅ User permission handling

## Setup Instructions

### 1. Get VAPID Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `medjust-d26eb`
3. Navigate to **Project Settings** (gear icon)
4. Go to the **Cloud Messaging** tab
5. Under **Web Push certificates**, click **Generate key pair** (if you don't have one)
6. Copy the **Key pair** (this is your VAPID key)

### 2. Configure VAPID Key

**Option A: Environment Variable (Recommended)**

Create a `.env` file in the project root:

```env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

**Option B: Direct Configuration**

Edit `client/lib/pushNotifications.ts` and replace:

```typescript
const VAPID_KEY = "YOUR_VAPID_KEY_HERE";
```

with your actual VAPID key.

### 3. Service Worker Setup

The service worker file is already created at `public/firebase-messaging-sw.js`. Make sure it's accessible at the root of your application.

### 4. Enable Notifications

Users can enable notifications by:
1. Going to the Dashboard
2. Clicking "Enable Notifications" in the Push Notifications card
3. Allowing browser notification permissions

## How It Works

### When News is Created

1. News article is created with a `yearId`
2. System finds the batch associated with that year
3. Finds all users in that batch
4. Creates Firestore notifications for each user
5. Sends browser push notifications to users with FCM tokens

### Notification Flow

```
News Created → Find Batch → Find Users → Create Notifications → Send Push Notifications
```

## FCM Token Storage

FCM tokens are stored in Firestore under the `fcmTokens` collection:
- Document ID: User ID
- Fields: `token`, `userId`, `createdAt`, `updatedAt`

## Background Notifications

For background notifications (when the app is closed), you need to:

1. Set up Firebase Admin SDK on your server
2. Create an API endpoint to send notifications via FCM
3. Update `sendPushNotification` in `client/lib/pushNotifications.ts` to call your API

Example server endpoint:

```typescript
// server/routes/sendNotification.ts
import admin from 'firebase-admin';

export const handleSendNotification: RequestHandler = async (req, res) => {
  const { token, notification, data } = req.body;
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: data,
    token: token,
  };
  
  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Testing

1. Enable notifications in the Dashboard
2. Create a news article with a `yearId`
3. Check that:
   - Notification appears in Firestore `notifications` collection
   - Browser notification appears (if app is open)
   - Background notification appears (if app is closed)

## Troubleshooting

### Notifications Not Appearing

1. Check browser console for errors
2. Verify VAPID key is set correctly
3. Check that service worker is registered
4. Verify notification permissions are granted

### Service Worker Not Loading

1. Ensure `firebase-messaging-sw.js` is in the `public` folder
2. Check that it's accessible at `/firebase-messaging-sw.js`
3. Verify Firebase scripts are loading correctly

### FCM Token Not Generated

1. Check browser console for errors
2. Verify VAPID key is correct
3. Check that notification permission is granted
4. Ensure Firebase Messaging is initialized

## Security Notes

- VAPID key is public and safe to include in client-side code
- FCM tokens are user-specific and stored securely in Firestore
- Notifications are only sent to users in the same batch as the news article

## Future Enhancements

- [ ] Server-side push notification sending via Firebase Admin SDK
- [ ] Notification preferences per user
- [ ] Notification history
- [ ] Rich notifications with images
- [ ] Notification actions (mark as read, view article)
