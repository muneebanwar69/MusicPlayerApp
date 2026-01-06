import { NextResponse } from 'next/server'
import { searchSongs, search } from '@/lib/ytmusic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || searchParams.get('query')
  const pageToken = searchParams.get('pageToken')?.trim() || null
  const type = searchParams.get('type') || 'songs' // 'songs', 'videos', or 'all'

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    let result

    // Use different search methods based on type
    if (type === 'all') {
      result = await search(query.trim(), 20)
    } else {
      // Default to songs search (better music results)
      result = await searchSongs(query.trim(), 20)
    }

    // Filter out any results without valid video IDs
    const validResults = result.results.filter(
      (item: any) => item.id && item.id.length >= 10
    )

    return NextResponse.json({
      results: validResults,
      nextPageToken: result.nextPageToken,
    })
  } catch (error: any) {
    console.error('YouTube Music API error:', error)
    
    // Determine error type for better error messages
    let errorMessage = 'Search failed'
    let statusCode = 500

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection.'
      statusCode = 503
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.'
      statusCode = 504
    } else if (error.message?.includes('initialize')) {
      errorMessage = 'Service temporarily unavailable. Please try again.'
      statusCode = 503
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error.message || 'Unknown error',
        results: [],
        nextPageToken: null,
      },
      { status: statusCode }
    )
  }
}
