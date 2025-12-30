/**
 * Distance calculation utilities
 * NOTE: Distance is calculated ONCE at ride creation and NEVER updated
 * This is informational only - no tracking, no navigation
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Geocode an address to coordinates
 * TODO: Integrate with a geocoding service (e.g., Google Maps Geocoding API)
 * For now, returns mock coordinates
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  // MOCK IMPLEMENTATION - Replace with actual geocoding service
  // This would typically call something like:
  // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`);
  
  console.log('Geocoding address:', address);
  
  // Return mock coordinates for testing
  // In production, this would return real coordinates from geocoding API
  const mockLat = 37.7749 + (Math.random() - 0.5) * 0.1;
  const mockLng = -122.4194 + (Math.random() - 0.5) * 0.1;
  
  return {
    lat: mockLat,
    lng: mockLng,
  };
}

/**
 * Calculate distance from two addresses
 * Geocodes both addresses, then calculates distance
 */
export async function calculateDistanceFromAddresses(
  pickupAddress: string,
  dropoffAddress: string,
): Promise<{
  distanceKm: number;
  pickupCoordinates: Coordinates;
  dropoffCoordinates: Coordinates;
}> {
  const pickupCoordinates = await geocodeAddress(pickupAddress);
  const dropoffCoordinates = await geocodeAddress(dropoffAddress);
  const distanceKm = calculateDistance(pickupCoordinates, dropoffCoordinates);

  return {
    distanceKm,
    pickupCoordinates,
    dropoffCoordinates,
  };
}
