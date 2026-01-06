# MusicFlow - Premium Music Player PWA

A beautiful, modern Progressive Web App music player built with Next.js 14+, inspired by Spotify's design language with unique visual elements.

## Features

- 🎵 **Music Streaming** - Search and play music from YouTube
- 🎨 **Beautiful UI** - Glassmorphism design with smooth animations
- 📱 **PWA Support** - Install as a native app on mobile and desktop
- 🔐 **Authentication** - Firebase Auth with email/password and Google OAuth
- 📚 **Collections** - Create and manage your music collections
- 🎧 **Smart Recommendations** - AI-powered DJ recommendations based on listening history
- ⌨️ **Keyboard Shortcuts** - Full keyboard support for playback controls
- 📊 **Listening Stats** - Track your music listening habits

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + Framer Motion
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **API**: YouTube Data API v3
- **State Management**: Zustand
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Authentication and Firestore enabled
- YouTube Data API v3 key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MusicPlayerApp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

YOUTUBE_API_KEY=your_youtube_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password and Google providers
3. Create a Firestore database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)

### Firestore Security Rules

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
  }
}
```

## YouTube API Setup

### Option 1: YouTube Data API v3 (Current)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your `.env.local` file

### Option 2: ytmusic-api (Recommended - No API Key Required!)

**Want to avoid API keys and quota limits?** Check out [`YTMUSIC_API_MIGRATION.md`](./YTMUSIC_API_MIGRATION.md) for a complete guide on migrating to the `ytmusic-api` package.

**Benefits:**
- ✅ No API key required
- ✅ No quota limits
- ✅ Better music-focused results
- ✅ Lyrics support included

**Quick Start:**
```bash
npm install ytmusic-api
```

See the migration guide for complete implementation details.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

The app will automatically deploy on every push to the main branch.

## Project Structure

```
MusicPlayerApp/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (app)/            # Main app pages
│   ├── api/              # API routes
│   └── layout.tsx        # Root layout
├── components/
│   ├── navigation/       # Sidebar and bottom nav
│   ├── player/           # Player components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and configs
├── store/                # Zustand stores
├── hooks/                # Custom React hooks
└── public/               # Static assets and PWA files
```

## Keyboard Shortcuts

- `Space` - Play/Pause
- `Arrow Left` - Seek backward
- `Arrow Right` - Seek forward
- `M` - Mute/Unmute
- `L` - Like current song
- `Shift + P` - Previous song
- `Shift + N` - Next song

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Notes

- Audio playback currently uses YouTube embeds. For production, you'll need to implement actual audio extraction using services like yt-dlp or similar.
- The app is optimized for Vercel's free tier with appropriate function timeouts and memory limits.
- PWA features work best when deployed to HTTPS.
