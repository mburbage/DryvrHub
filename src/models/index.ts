// Core data models - NEVER add rating, score, or payment fields
// BLOCKLIST: No rating fields, no score fields, no payment processing, no ranking fields

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
  isVerified: boolean;
}

export interface RiderProfile {
  userId: string;
  completedRidesCount: number; // Private only - never public or comparative
}

export interface DriverProfile {
  userId: string;
  completedRidesCount: number; // Private only - never public or comparative
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    photos: string[]; // Array of up to 3 photo URIs
  };
}

// Explicit ride lifecycle - state transitions must be manual and explicit
export type RideStatus = 'OPEN' | 'ACCEPTED' | 'COMPLETED' | 'EXPIRED';

export interface Ride {
  id: string;
  riderId: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoordinates?: {lat: number; lng: number}; // For distance calculation only
  dropoffCoordinates?: {lat: number; lng: number}; // For distance calculation only
  distanceKm: number; // Calculated once at creation, never updated
  pickupTime: Date; // When rider needs to be picked up
  estimatedDuration: number; // Estimated trip duration in minutes
  notes?: string;
  status: RideStatus;
  createdAt: Date;
  expiresAt: Date;
  acceptedBidId?: string;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface Bid {
  id: string;
  rideId: string;
  driverId: string;
  priceAmount: number; // Driver sets 100% freely, no min/max, no suggestions
  message?: string;
  createdAt: Date;
}

// State transition rules (enforce these in logic, not here)
export const RIDE_STATE_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  OPEN: ['ACCEPTED', 'EXPIRED'],
  ACCEPTED: ['COMPLETED'],
  COMPLETED: [], // Terminal state
  EXPIRED: [], // Terminal state
};
