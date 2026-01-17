export interface GeoData {
  country?: string;
  city?: string;
}

export async function getGeoData(ip: string): Promise<GeoData> {
  // In production, you'd use a service like Cloudflare, Vercel's geolocation headers, or a paid API
  // For now, return empty data - Vercel provides geolocation via headers in production
  return {
    country: undefined,
    city: undefined,
  };
}

export function getGeoFromHeaders(headers: Headers): GeoData {
  // Vercel provides geolocation headers in production
  const country = headers.get('x-vercel-ip-country') || undefined;
  const city = headers.get('x-vercel-ip-city') || undefined;
  
  return { country, city };
}
