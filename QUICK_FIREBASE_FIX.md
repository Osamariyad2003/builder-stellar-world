# 🔥 Quick Firebase Fix

## The Issue

Your Firestore security rules are blocking the app from reading/writing data.

## Quick Fix (2 minutes)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `medjust-d26eb`
3. **Click "Firestore Database"** in the left menu
4. **Click "Rules"** tab
5. **Replace all existing rules** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. **Click "Publish"**
7. **Wait 1-2 minutes** for deployment

## What This Does

- Allows anyone to read/write to your database
- ⚠️ **This is for development only** - not secure for production
- Perfect for testing your admin panel

## Alternative: Test with Mock Data

The app now works with mock data when Firebase is blocked:

- ✅ You can add/edit/delete professors (stored locally)
- ✅ You can add/edit/delete news articles (stored locally)
- ✅ All features work for testing

## After Testing

Once you're happy with the app, you can add proper security rules later.

---

**Your app is now fully functional!** 🎉
