import { NextResponse } from 'next/server'

/**
 * Fetch lyrics using multiple free APIs as fallbacks
 */
async function fetchLyrics(title: string, artist: string): Promise<string | null> {
  // Clean up title and artist names
  const cleanTitle = title
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .replace(/\[.*?\]/g, '') // Remove brackets content
    .replace(/official\s*(video|audio|music\s*video)?/gi, '')
    .replace(/lyrics?\s*video/gi, '')
    .replace(/HD|HQ|4K/gi, '')
    .replace(/feat\.?|ft\.?/gi, '')
    .trim()
  
  const cleanArtist = artist
    .replace(/VEVO$/i, '')
    .replace(/Official$/i, '')
    .replace(/- Topic$/i, '')
    .replace(/Music$/i, '')
    .trim()

  // Try lyrics.ovh API first (free, no API key needed)
  try {
    const lyricsOvhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`
    const response = await fetch(lyricsOvhUrl, { 
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.lyrics && data.lyrics.trim().length > 0) {
        console.log('Lyrics found via lyrics.ovh')
        return data.lyrics
      }
    }
  } catch (err) {
    console.warn('lyrics.ovh API failed:', err)
  }

  // Try with just the first word of artist name
  try {
    const artistFirstWord = cleanArtist.split(' ')[0]
    if (artistFirstWord && artistFirstWord !== cleanArtist) {
      const lyricsOvhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistFirstWord)}/${encodeURIComponent(cleanTitle)}`
      const response = await fetch(lyricsOvhUrl, { 
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.lyrics && data.lyrics.trim().length > 0) {
          console.log('Lyrics found via lyrics.ovh (first word match)')
          return data.lyrics
        }
      }
    }
  } catch (err) {
    console.warn('lyrics.ovh API (first word) failed:', err)
  }

  // Try swapping title and artist (sometimes they're reversed in video titles)
  try {
    const swappedUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanTitle)}/${encodeURIComponent(cleanArtist)}`
    const response = await fetch(swappedUrl, { 
      signal: AbortSignal.timeout(5000)
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.lyrics && data.lyrics.trim().length > 0) {
        console.log('Lyrics found via lyrics.ovh (swapped)')
        return data.lyrics
      }
    }
  } catch (err) {
    console.warn('lyrics.ovh API (swapped) failed:', err)
  }

  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  const title = searchParams.get('title')
  const artist = searchParams.get('artist')

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
  }

  // Need at least title or artist to search for lyrics
  if (!title && !artist) {
    return NextResponse.json({ 
      lyrics: null, 
      message: 'Title and artist required for lyrics search' 
    })
  }

  try {
    const lyrics = await fetchLyrics(
      title || '', 
      artist || ''
    )
    
    if (!lyrics) {
      return NextResponse.json({ 
        lyrics: null, 
        message: 'Lyrics not available for this song' 
      })
    }

    return NextResponse.json({ lyrics })
  } catch (error: any) {
    console.error('Lyrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lyrics', message: error.message },
      { status: 500 }
    )
  }
}
