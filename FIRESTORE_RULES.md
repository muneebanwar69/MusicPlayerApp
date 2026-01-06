# Firestore Security Rules for Play History

## Important: Set Up Firestore Rules

For the play history feature to work, you need to configure Firestore security rules to allow authenticated users to read and write their own play history.

## Steps to Configure:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `musicplayerapp-ace2c`
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own play history
    match /playHistory/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read and write their own collections
    match /collections/{collectionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow users to read and write their own liked songs
    match /likedSongs/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish** to save the rules

## What These Rules Do:

- **`playHistory/{userId}`**: Users can only read/write their own play history
- **`collections/{userId}`**: Users can manage their own music collections
- **`likedSongs/{userId}`**: Users can manage their own liked songs
- **Default rule**: Denies all other access for security

## Testing:

After setting up the rules:
1. Play a few songs in the app
2. Check the browser console for logs:
   - `💾 Saving play history: ...`
   - `✅ Play history saved successfully!`
3. Refresh the home page
4. You should see your recently played songs appear

## Troubleshooting:

If play history still doesn't work:

1. **Check browser console** for errors
2. **Verify you're logged in** (check if `user?.uid` exists)
3. **Check Firestore rules** are published correctly
4. **Verify Firebase initialization** in `lib/firebase.ts`
5. **Check network tab** for Firestore requests

## Firestore Structure:

```
playHistory/
  └── {userId}/
      ├── history: [Song[]]  // Array of played songs
      └── lastUpdated: Timestamp
```

Each song in history has:
- `id`: YouTube video ID
- `title`: Song title
- `channel`: Channel name
- `thumbnail`: Thumbnail URL
- `duration`: Duration in seconds
- `addedAt`: Timestamp when added
