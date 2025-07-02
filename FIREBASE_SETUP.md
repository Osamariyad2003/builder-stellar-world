# Firebase Setup for MedJust Admin Dashboard

## Initial Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "MedJust Admin Dashboard"
3. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage

## Configuration

1. In the Firebase Console, go to Project Settings
2. Copy your Firebase configuration object
3. Replace the placeholder config in `client/lib/firebase.ts` with your actual config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

## Firestore Database Setup

Create the following collections in Firestore:

### News Collection

- Collection name: `news`
- Documents will have the structure defined in `shared/types.ts`

### Videos Collection

- Collection name: `videos`
- For educational video resources

### Files Collection

- Collection name: `files`
- For uploaded educational files

### Quizzes Collection

- Collection name: `quizzes`
- For quiz management

### Professors Collection

- Collection name: `professors`
- For faculty information

### Store Collections

- Collection name: `storeCategories`
- Collection name: `products`

## Authentication Setup

1. Go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Create your first admin user:
   - Email: admin@medjust.com (or your preferred email)
   - Password: (your secure password)

## Security Rules

Update Firestore security rules to protect admin data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write all collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Storage Rules

Update Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps

After completing the Firebase setup:

1. Test login with your admin credentials
2. Start creating content in the admin panel
3. Customize the application as needed

## Development Notes

- The application uses Firebase v9+ modular SDK
- Real-time listeners are set up for live data updates
- Error handling is implemented for all Firebase operations
- File uploads will use Firebase Storage (to be implemented)
