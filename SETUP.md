# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Firebase and YouTube API credentials

3. **Firebase Setup**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase config to `.env.local`

4. **YouTube API Setup**
   - Go to https://console.cloud.google.com/
   - Create a project
   - Enable YouTube Data API v3
   - Create an API key
   - Add it to `.env.local`

5. **PWA Icons**
   - Create icons in `public/icons/` directory:
     - icon-72x72.png
     - icon-96x96.png
     - icon-128x128.png
     - icon-144x144.png
     - icon-152x152.png
     - icon-192x192.png
     - icon-384x384.png
     - icon-512x512.png
   - You can use a tool like https://realfavicongenerator.net/ to generate these

6. **Run Development Server**
   ```bash
   npm run dev
   ```

7. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /collections/{collectionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    match /likedSongs/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /playHistory/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Notes

- The app uses YouTube embeds for audio playback. For production audio streaming, you'll need to implement server-side audio extraction.
- PWA features require HTTPS in production.
- The app is optimized for Vercel's free tier deployment.
