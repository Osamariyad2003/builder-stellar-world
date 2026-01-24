# Firestore Security Rules Setup

## Issue

Getting "Missing or insufficient permissions" errors when trying to access Firestore collections.

## Solution

Update your Firestore security rules in the Firebase Console.

## Steps to Fix:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `medjust-d26eb`
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the following:

## Development Rules (For Admin Dashboard)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write all documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Specific rules for admin collections
    match /admins/{adminId} {
      allow read, write: if request.auth != null;
    }

    match /news/{newsId} {
      allow read, write: if request.auth != null;
    }

    match /books/{bookId} {
      allow read, write: if request.auth != null;
    }

    match /research/{researchId} {
      allow read, write: if request.auth != null;
    }

    match /professors/{professorId} {
      allow read, write: if request.auth != null;
    }

    match /batches/{batchId} {
      allow read, write, delete: if request.auth != null;

      // Allow nested years collection
      match /years/{yearId} {
        allow read, write, delete: if request.auth != null;
      }
    }

    match /Subjects/{subjectId} {
      allow read, write: if request.auth != null;

      // Allow access to subcollections
      match /lectures/{lectureId} {
        allow read, write: if request.auth != null;

        match /files/{fileId} {
          allow read, write: if request.auth != null;
        }

        match /quizzes/{quizId} {
          allow read, write: if request.auth != null;
        }
      }
    }
  }
}
```

## Production Rules (More Secure - Use Later)

For production, you might want more specific rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Function to check if user is admin
    function isAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Admin-only collections
    match /admins/{adminId} {
      allow read, write: if isAdmin();
    }

    match /news/{newsId} {
      allow read: if true; // Public read
      allow write: if isAdmin();
    }

    match /books/{bookId} {
      allow read: if true; // Public read
      allow write: if isAdmin();
    }

    match /research/{researchId} {
      allow read: if true; // Public read
      allow write: if isAdmin();
    }

    match /professors/{professorId} {
      allow read: if true; // Public read
      allow write: if isAdmin();
    }

    match /batches/{batchId} {
      allow read: if true; // Public read
      allow write, delete: if isAdmin();

      // Allow nested years collection
      match /years/{yearId} {
        allow read: if true;
        allow write, delete: if isAdmin();
      }
    }

    match /Subjects/{subjectId} {
      allow read: if true; // Public read for students
      allow write: if isAdmin();

      match /lectures/{lectureId} {
        allow read: if true;
        allow write: if isAdmin();

        match /{subcollection}/{docId} {
          allow read: if true;
          allow write: if isAdmin();
        }
      }
    }
  }
}
```

## Quick Fix for Development

For immediate testing, you can use these permissive rules (⚠️ **NOT for production**):

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

## Steps to Apply:

1. Copy the **Development Rules** above
2. In Firebase Console → Firestore → Rules
3. Paste the rules
4. Click **Publish**
5. Wait for deployment (usually 1-2 minutes)

## Verify Authentication

Also ensure your admin user exists in the `admins` collection:

- Email: `MedAdmin@gmail.com`
- Document ID should match the Firebase Auth UID

## Test the Fix

After updating rules:

1. Refresh your admin dashboard
2. Try logging in again
3. Test creating/reading professors and news

The permission errors should be resolved!
