import { NextResponse } from 'next/server';

// Google Places API — Reviews endpoint for Millet Yard
// Configure GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID in .env.local

let cachedReviews: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // If no API key or Place ID, return empty (frontend will use high-trust verified reviews)
  if (!apiKey || !placeId) {
    return NextResponse.json({ reviews: [], source: 'none' });
  }

  // Check cache
  if (cachedReviews && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return NextResponse.json({ reviews: cachedReviews, source: 'google-cached' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data.result?.reviews) {
      const reviews = data.result.reviews.map((r: any) => ({
        name: r.author_name,
        review: r.text,
        rating: r.rating,
        time: r.relative_time_description,
        profilePhoto: r.profile_photo_url,
      }));

      cachedReviews = reviews;
      cacheTimestamp = Date.now();

      return NextResponse.json({
        reviews,
        source: 'google',
        overallRating: data.result.rating,
        totalReviews: data.result.user_ratings_total,
      });
    }

    return NextResponse.json({ reviews: [], source: 'google-empty' });
  } catch (error) {
    console.error('Google Reviews API error:', error);
    return NextResponse.json({ reviews: [], source: 'error' });
  }
}
