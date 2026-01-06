import { NextResponse } from 'next/server'
import { getLyrics } from '@/lib/ytmusic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
  }

  try {
    const lyrics = await getLyrics(videoId)
    
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
