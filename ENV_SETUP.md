# Environment Variables Setup

Your Firebase configuration has been integrated into the app. Create a `.env.local` file in the root directory with the following content:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC85GTA0wK6ZE-Rbzs68cMwoR9KQ694ypA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=musicplayerapp-ace2c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=musicplayerapp-ace2c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=musicplayerapp-ace2c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=391586971376
NEXT_PUBLIC_FIREBASE_APP_ID=1:391586971376:web:814ee2e46b3178ca0ecc35
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VVX731E5XY

# YouTube API Key (server-side only)
# Get your key from: https://console.cloud.google.com/
YOUTUBE_API_KEY=your_youtube_api_key_here
```

## Important Notes

1. **The `.env.local` file is already in `.gitignore`** - your credentials won't be committed to git.

2. **Firebase Analytics** has been integrated and will automatically track:
   - Page views
   - Song plays/pauses
   - Search queries
   - Collection creation
   - Adding songs to collections

3. **Fallback Values**: The Firebase config in `lib/firebase.ts` includes your credentials as fallback values, so the app will work even if `.env.local` is not set up. However, it's recommended to use environment variables for better security.

4. **YouTube API**: You still need to add your YouTube Data API v3 key to enable search functionality.

## Next Steps

1. Create the `.env.local` file with the content above
2. Add your YouTube API key
3. Run `npm install` if you haven't already
4. Run `npm run dev` to start the development server

The app is now ready to use with your Firebase project!
