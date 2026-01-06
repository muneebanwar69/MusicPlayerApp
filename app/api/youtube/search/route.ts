import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || searchParams.get('query')
  const pageToken = searchParams.get('pageToken')?.trim() || null

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
  }

  try {
    // Search for videos - try with music category first
    let searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('maxResults', '20')
    searchUrl.searchParams.set('q', query.trim())
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('videoCategoryId', '10') // Music category
    searchUrl.searchParams.set('key', apiKey)
    // Only add pageToken if it's a valid non-empty string
    if (pageToken && pageToken.length > 0) {
      searchUrl.searchParams.set('pageToken', pageToken)
    }

    let searchResponse = await fetch(searchUrl.toString())
    let searchData = await searchResponse.json()
    
    // If search fails with videoCategoryId, try again without it
    if ((!searchResponse.ok || searchData.error) && searchData.error?.errors?.[0]?.reason === 'invalidParameter') {
      console.warn('Retrying search without videoCategoryId due to invalid parameter error')
      searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
      searchUrl.searchParams.set('part', 'snippet')
      searchUrl.searchParams.set('maxResults', '20')
      searchUrl.searchParams.set('q', query.trim())
      searchUrl.searchParams.set('type', 'video')
      searchUrl.searchParams.set('key', apiKey)
      if (pageToken && pageToken.length > 0) {
        searchUrl.searchParams.set('pageToken', pageToken)
      }
      
      searchResponse = await fetch(searchUrl.toString())
      searchData = await searchResponse.json()
    }
    
    // Check for YouTube API errors in the response
    if (!searchResponse.ok || searchData.error) {
      const errorCode = searchData.error?.code || searchResponse.status
      const errorMessage = searchData.error?.message || `YouTube API search failed with status ${searchResponse.status}`
      
      console.error('YouTube API error details:', {
        status: searchResponse.status,
        error: searchData.error,
        query: query,
      })
      
      // Handle quota exceeded error (403) gracefully
      if (errorCode === 403 || searchResponse.status === 403) {
        return NextResponse.json(
          {
            error: 'Quota exceeded',
            message: 'YouTube API quota has been exceeded. Please try again later.',
            results: [],
            nextPageToken: null,
            quotaExceeded: true,
          },
          { status: 429 } // Use 429 (Too Many Requests) for quota exceeded
        )
      }
      
      // For other errors, throw to be caught by the catch block
      throw new Error(errorMessage)
    }

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({
        results: [],
        nextPageToken: null,
      })
    }

    // Get video details for duration
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    detailsUrl.searchParams.set('part', 'contentDetails')
    detailsUrl.searchParams.set('id', videoIds)
    detailsUrl.searchParams.set('key', apiKey)

    const detailsResponse = await fetch(detailsUrl.toString())
    const detailsData = await detailsResponse.json()
    
    // Check for YouTube API errors in the response
    if (!detailsResponse.ok || detailsData.error) {
      const errorCode = detailsData.error?.code || detailsResponse.status
      const errorMessage = detailsData.error?.message || `YouTube API details failed with status ${detailsResponse.status}`
      
      // If quota exceeded on details call, we still return the search results without durations
      if (errorCode === 403 || detailsResponse.status === 403) {
        console.warn('YouTube API quota exceeded for details call, continuing without durations')
      } else {
        console.error('YouTube API details error:', {
          status: detailsResponse.status,
          error: detailsData.error,
          videoIds: videoIds,
        })
        console.warn('Continuing without video durations due to details API error')
      }
    }

    // Create a map of video IDs to durations
    const durationMap = new Map()
    if (detailsData.items && Array.isArray(detailsData.items)) {
      detailsData.items.forEach((item: any) => {
        if (item.id && item.contentDetails?.duration) {
          durationMap.set(item.id, item.contentDetails.duration)
        }
      })
    }

    // Merge and format data
    const formattedResults = searchData.items
      .filter((item: any) => item.id?.videoId) // Only include items with valid video IDs
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        duration: durationMap.get(item.id.videoId) || '',
      }))
      .filter((result: any) => result.id && result.id.length >= 10) // Additional validation

    return NextResponse.json({
      results: formattedResults,
      nextPageToken: searchData.nextPageToken || null,
    })
  } catch (error: any) {
    console.error('YouTube API error:', error)
    
    // Return a more helpful error response
    const errorMessage = error.message || 'Search failed'
    let statusCode = 500
    
    // Determine appropriate status code based on error
    if (error.message?.includes('API key')) {
      statusCode = 500
    } else if (error.message?.includes('quota') || error.message?.includes('Quota')) {
      statusCode = 429 // Too Many Requests
    }
    
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: errorMessage,
        results: [], // Return empty results instead of failing completely
        nextPageToken: null,
        quotaExceeded: error.message?.includes('quota') || error.message?.includes('Quota') || false,
      },
      { status: statusCode }
    )
  }
}
