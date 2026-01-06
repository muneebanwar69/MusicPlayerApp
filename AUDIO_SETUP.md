# YouTube Audio Playback Setup

## Current Status

The audio playback feature requires server-side YouTube audio extraction to work properly. Currently, the app is set up but needs audio extraction implementation.

## Why This Is Needed

YouTube doesn't allow direct audio streaming from their URLs due to:
- CORS restrictions
- Dynamic URL generation
- Authentication requirements
- Rate limiting

## Solutions

### Option 1: Server-Side yt-dlp (Recommended)

1. **Install yt-dlp on your server:**
   ```bash
   pip install yt-dlp
   ```

2. **Update the API route** (`app/api/audio/[videoId]/route.ts`):
   ```typescript
   import { exec } from 'child_process'
   import { promisify } from 'util'
   
   const execAsync = promisify(exec)
   
   async function extractYouTubeAudio(videoId: string): Promise<string | null> {
     try {
       const { stdout } = await execAsync(
         `yt-dlp -g -f "bestaudio[ext=m4a]/bestaudio" "https://www.youtube.com/watch?v=${videoId}"`
       )
       return stdout.trim()
     } catch (error) {
       console.error('Audio extraction failed:', error)
       return null
     }
   }
   ```

### Option 2: Use a Third-Party Service

Use services like:
- `https://www.youtube.com/api/manifest/dash/id/video/{videoId}/source/youtube`
- Or implement your own audio proxy service

### Option 3: YouTube IFrame API (Different Approach)

This requires a different implementation using YouTube's IFrame API instead of HTML5 audio:

```typescript
// Load YouTube IFrame API
const tag = document.createElement('script')
tag.src = 'https://www.youtube.com/iframe_api'
const firstScriptTag = document.getElementsByTagName('script')[0]
firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

// Create player
const player = new YT.Player('youtube-player', {
  videoId: videoId,
  playerVars: {
    autoplay: 1,
    controls: 0,
  },
  events: {
    onReady: (event) => {
      event.target.playVideo()
    },
  },
})
```

## Quick Fix for Testing

For immediate testing, you can use a temporary solution:

1. Install a YouTube audio extraction npm package (if available)
2. Or use a CORS proxy service
3. Or implement a simple Node.js server with yt-dlp

## Production Recommendation

For production, implement Option 1 (yt-dlp) as it's:
- Most reliable
- Free and open-source
- Supports all YouTube formats
- Can be cached for performance

## Next Steps

1. Choose an extraction method
2. Update `app/api/audio/[videoId]/route.ts` with the implementation
3. Test audio playback
4. Add error handling and fallbacks
