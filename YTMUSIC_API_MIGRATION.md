# YouTube Music API Migration Guide

## 📋 Overview

This guide explains how to migrate from the **YouTube Data API v3** to the **ytmusic-api** npm package in your MusicFlow application.

## 🎯 Why Switch to ytmusic-api?

### Advantages:

1. **No API Key Required** ✅
   - No need for Google Cloud API keys
   - No quota limits or billing concerns
   - No API key management

2. **Better Music-Focused Results** 🎵
   - Specifically designed for music content
   - Better search results for songs, albums, artists
   - Includes lyrics support

3. **No Quota Limits** 🚀
   - Unlimited requests (within reasonable usage)
   - No daily quota exhaustion issues
   - More reliable for production use

4. **Rich Music Metadata** 📊
   - Album information
   - Artist details
   - Playlist support
   - Lyrics retrieval

### Disadvantages:

1. **Unofficial API** ⚠️
   - Not officially supported by Google/YouTube
   - May break if YouTube changes their internal APIs
   - Requires regular package updates

2. **Rate Limiting** 🐌
   - May be slower than official API
   - Should implement your own rate limiting
   - No official SLA

3. **Legal Considerations** ⚖️
   - Must comply with YouTube's Terms of Service
   - Use responsibly and ethically

## 📦 Installation

```bash
npm install ytmusic-api
```

## 🔧 Basic Usage

### 1. Initialize the API

```typescript
import YTMusic from 'ytmusic-api'

const ytmusic = new YTMusic()

// Initialize (required before first use)
await ytmusic.initialize()
```

### 2. Search for Songs

```typescript
// Search for songs
const results = await ytmusic.search('Never gonna give you up')

// Results include:
// - songs[]
// - videos[]
// - artists[]
// - albums[]
// - playlists[]
```

### 3. Get Song Details

```typescript
// Get song details by video ID
const song = await ytmusic.getSong('VIDEO_ID')

// Returns:
// {
//   videoId: string,
//   title: string,
//   artist: string,
//   album: string,
//   duration: number,
//   thumbnail: string,
//   ...
// }
```

### 4. Get Lyrics

```typescript
// Get lyrics for a song
const lyrics = await ytmusic.getLyrics('VIDEO_ID')
```

## 🔄 Migration Steps

### Step 1: Update API Route

**Current:** `app/api/youtube/search/route.ts`

**New Implementation:**

```typescript
import { NextResponse } from 'next/server'
import YTMusic from 'ytmusic-api'

// Initialize once (can be cached)
let ytmusicInstance: YTMusic | null = null

async function getYTMusicInstance() {
  if (!ytmusicInstance) {
    ytmusicInstance = new YTMusic()
    await ytmusicInstance.initialize()
  }
  return ytmusicInstance
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || searchParams.get('query')

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const ytmusic = await getYTMusicInstance()
    
    // Search for songs
    const searchResults = await ytmusic.search(query.trim())
    
    // Format results to match your current structure
    const formattedResults = (searchResults.songs || []).slice(0, 20).map((song: any) => ({
      id: song.videoId,
      title: song.title,
      channel: song.artist?.name || song.artist || 'Unknown Artist',
      thumbnail: song.thumbnail || song.thumbnails?.[0]?.url || '',
      duration: song.duration || song.durationSeconds || 0,
    }))

    return NextResponse.json({
      results: formattedResults,
      nextPageToken: null, // ytmusic-api doesn't support pagination tokens
    })
  } catch (error: any) {
    console.error('YouTube Music API error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: error.message || 'Unknown error',
        results: [],
        nextPageToken: null,
      },
      { status: 500 }
    )
  }
}
```

### Step 2: Update Recommendations

**File:** `lib/recommendations.ts`

```typescript
import YTMusic from 'ytmusic-api'
import { Song } from '@/store/playerStore'

let ytmusicInstance: YTMusic | null = null

async function getYTMusicInstance() {
  if (!ytmusicInstance) {
    ytmusicInstance = new YTMusic()
    await ytmusicInstance.initialize()
  }
  return ytmusicInstance
}

export async function getRandomRecommendations(limit: number = 20): Promise<Song[]> {
  try {
    const ytmusic = await getYTMusicInstance()
    
    // Pick random categories
    const randomCategories = MUSIC_CATEGORIES
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)

    const allSongs: Song[] = []
    const seenIds = new Set<string>()

    for (const category of randomCategories) {
      try {
        const results = await ytmusic.search(category)
        const songs = (results.songs || []).slice(0, 6).map((song: any) => ({
          id: song.videoId,
          title: song.title,
          channel: song.artist?.name || song.artist || 'Unknown',
          thumbnail: song.thumbnail || song.thumbnails?.[0]?.url || '',
          duration: song.durationSeconds || 0,
        }))

        songs.forEach((song: Song) => {
          if (!seenIds.has(song.id)) {
            allSongs.push(song)
            seenIds.add(song.id)
          }
        })
      } catch (error) {
        console.warn(`Failed to fetch category "${category}"`, error)
      }
    }

    return allSongs.sort(() => Math.random() - 0.5).slice(0, limit)
  } catch (error) {
    console.error('Error getting random recommendations:', error)
    return []
  }
}
```

### Step 3: Remove Environment Variables

You can now **remove** the `YOUTUBE_API_KEY` from:
- `.env.local`
- `.env`
- Vercel environment variables

### Step 4: Update Error Handling

The ytmusic-api may throw different errors. Update error handling:

```typescript
try {
  const results = await ytmusic.search(query)
} catch (error: any) {
  // Handle specific errors
  if (error.message?.includes('timeout')) {
    // Retry logic
  } else if (error.message?.includes('not found')) {
    // Handle not found
  }
}
```

## 📝 Complete Example: Updated Search Route

```typescript
import { NextResponse } from 'next/server'
import YTMusic from 'ytmusic-api'

let ytmusicInstance: YTMusic | null = null

async function getYTMusicInstance() {
  if (!ytmusicInstance) {
    ytmusicInstance = new YTMusic()
    await ytmusicInstance.initialize()
  }
  return ytmusicInstance
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || searchParams.get('query')
  const pageToken = searchParams.get('pageToken')?.trim() || null

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const ytmusic = await getYTMusicInstance()
    
    // Search for songs (ytmusic-api doesn't support pagination tokens)
    const searchResults = await ytmusic.search(query.trim())
    
    // Format results to match your Song interface
    const formattedResults = (searchResults.songs || [])
      .slice(0, 20)
      .map((song: any) => ({
        id: song.videoId,
        title: song.title,
        channel: song.artist?.name || song.artist || song.channel || 'Unknown Artist',
        thumbnail: song.thumbnail || song.thumbnails?.[0]?.url || '',
        duration: song.durationSeconds || song.duration || 0,
      }))
      .filter((result: any) => result.id && result.id.length >= 10)

    return NextResponse.json({
      results: formattedResults,
      nextPageToken: null, // ytmusic-api doesn't support pagination
    })
  } catch (error: any) {
    console.error('YouTube Music API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: error.message || 'Unknown error',
        results: [],
        nextPageToken: null,
      },
      { status: 500 }
    )
  }
}
```

## 🎨 Additional Features You Can Add

### 1. Get Song Details

```typescript
// In your API route or service
const songDetails = await ytmusic.getSong(videoId)

// Returns rich metadata:
// {
//   videoId: string,
//   title: string,
//   artist: { name: string, id: string },
//   album: { name: string, id: string },
//   duration: number,
//   thumbnail: string,
//   description: string,
//   ...
// }
```

### 2. Get Lyrics

```typescript
// Add lyrics endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  
  if (!videoId) {
    return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
  }
  
  try {
    const ytmusic = await getYTMusicInstance()
    const lyrics = await ytmusic.getLyrics(videoId)
    
    return NextResponse.json({ lyrics })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 })
  }
}
```

### 3. Get Artist Information

```typescript
const artist = await ytmusic.getArtist('ARTIST_ID')
// Returns albums, songs, playlists, etc.
```

### 4. Get Album Information

```typescript
const album = await ytmusic.getAlbum('ALBUM_ID')
// Returns all songs in the album
```

## ⚠️ Important Considerations

### 1. Rate Limiting

Implement your own rate limiting to avoid being blocked:

```typescript
import { rateLimit } from '@/lib/rateLimit'

// In your API route
const isAllowed = await rateLimit.checkLimit(userId)
if (!isAllowed) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

### 2. Error Handling

```typescript
try {
  const results = await ytmusic.search(query)
} catch (error: any) {
  // Handle network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    // Retry logic
  }
  
  // Handle API errors
  if (error.message?.includes('not found')) {
    // Return empty results
  }
}
```

### 3. Caching

Keep your existing caching system (`lib/apiCache.ts`) - it will still work:

```typescript
import { cachedYouTubeSearch } from '@/lib/apiCache'

// Still use caching
const results = await cachedYouTubeSearch(
  query,
  () => ytmusic.search(query)
)
```

### 4. TypeScript Types

The package includes TypeScript types. You may need to adjust your `Song` interface:

```typescript
// Update if needed
interface Song {
  id: string // videoId from ytmusic-api
  title: string
  channel: string // artist name
  thumbnail: string
  duration: number // durationSeconds
}
```

## 🚀 Migration Checklist

- [ ] Install `ytmusic-api` package
- [ ] Update `app/api/youtube/search/route.ts`
- [ ] Update `lib/recommendations.ts`
- [ ] Remove `YOUTUBE_API_KEY` from environment variables
- [ ] Test search functionality
- [ ] Test recommendations
- [ ] Update error handling
- [ ] Deploy to Vercel
- [ ] Monitor for errors

## 📚 Resources

- **Package:** https://www.npmjs.com/package/ytmusic-api
- **GitHub:** Check the package repository for latest updates
- **Documentation:** See package README for full API reference

## 🔄 Rollback Plan

If you need to rollback:

1. Keep the old YouTube API code in a branch
2. Restore `YOUTUBE_API_KEY` environment variable
3. Revert the API route changes
4. Redeploy

## ✅ Benefits Summary

- ✅ No API key management
- ✅ No quota limits
- ✅ Better music-focused results
- ✅ Lyrics support
- ✅ Album/Artist information
- ✅ No billing concerns
- ✅ More reliable for production

---

**Note:** Always test thoroughly before deploying to production. The ytmusic-api is unofficial and may have breaking changes if YouTube updates their internal APIs.
