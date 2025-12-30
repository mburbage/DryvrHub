/**
 * Sample data for development
 * Generate realistic rides and bids for testing
 */

import {Ride, Bid, User, RiderProfile, DriverProfile} from '../models';

// Sample users
export const SAMPLE_USERS: User[] = [
  {
    id: 'user_001',
    email: 'current@dryverhub.com',
    phoneNumber: '+1234567890',
    createdAt: new Date('2024-12-01'),
    isVerified: true,
  },
  {
    id: 'user_002',
    email: 'alice@example.com',
    phoneNumber: '+1234567891',
    createdAt: new Date('2024-10-15'),
    isVerified: true,
  },
  {
    id: 'user_003',
    email: 'bob@example.com',
    phoneNumber: '+1234567892',
    createdAt: new Date('2024-11-20'),
    isVerified: true,
  },
  {
    id: 'user_004',
    email: 'carol@example.com',
    phoneNumber: '+1234567893',
    createdAt: new Date('2024-09-05'),
    isVerified: false,
  },
];

export const SAMPLE_RIDER_PROFILES: RiderProfile[] = [
  {userId: 'user_001', completedRidesCount: 12},
  {userId: 'user_002', completedRidesCount: 8},
  {userId: 'user_003', completedRidesCount: 5},
  {userId: 'user_004', completedRidesCount: 2},
];

export const SAMPLE_DRIVER_PROFILES: DriverProfile[] = [
  {userId: 'user_001', completedRidesCount: 47},
  {userId: 'user_002', completedRidesCount: 32},
  {userId: 'user_003', completedRidesCount: 15},
];

// Sample addresses (San Francisco area)
const SAMPLE_ADDRESSES = [
  '123 Market St, San Francisco, CA',
  '456 Mission St, San Francisco, CA',
  '789 Valencia St, San Francisco, CA',
  '321 Castro St, San Francisco, CA',
  '654 Haight St, San Francisco, CA',
  '987 Divisadero St, San Francisco, CA',
  '147 Polk St, San Francisco, CA',
  '258 Van Ness Ave, San Francisco, CA',
  '369 Lombard St, San Francisco, CA',
  '741 Grant Ave, San Francisco, CA',
  '852 Geary Blvd, San Francisco, CA',
  '963 Ocean Ave, San Francisco, CA',
];

// Generate sample rides
export const generateSampleRides = (): Ride[] => {
  const now = new Date();
  const rides: Ride[] = [];

  // OPEN rides (from different riders)
  for (let i = 0; i < 5; i++) {
    const createdAt = new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000); // 0-2 hours ago
    const pickupIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    let dropoffIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    while (dropoffIdx === pickupIdx) {
      dropoffIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    }

    rides.push({
      id: `ride_open_${i}`,
      riderId: i === 0 ? 'user_001' : SAMPLE_USERS[i % 4].id,
      pickupAddress: SAMPLE_ADDRESSES[pickupIdx],
      dropoffAddress: SAMPLE_ADDRESSES[dropoffIdx],
      distanceKm: Math.round((Math.random() * 15 + 5) * 10) / 10, // 5-20 km
      notes: i % 2 === 0 ? 'Please call when you arrive' : undefined,
      status: 'OPEN',
      createdAt,
      expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
    });
  }

  // ACCEPTED rides
  for (let i = 0; i < 2; i++) {
    const createdAt = new Date(now.getTime() - Math.random() * 5 * 60 * 60 * 1000); // 0-5 hours ago
    const acceptedAt = new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000);
    const pickupIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    let dropoffIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    while (dropoffIdx === pickupIdx) {
      dropoffIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    }

    rides.push({
      id: `ride_accepted_${i}`,
      riderId: 'user_001',
      pickupAddress: SAMPLE_ADDRESSES[pickupIdx],
      dropoffAddress: SAMPLE_ADDRESSES[dropoffIdx],
      distanceKm: Math.round((Math.random() * 15 + 5) * 10) / 10,
      notes: 'Heading to the airport',
      status: 'ACCEPTED',
      createdAt,
      expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
      acceptedBidId: `bid_${i}_2`,
      acceptedAt,
    });
  }

  // COMPLETED rides
  for (let i = 0; i < 3; i++) {
    const createdAt = new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000); // 0-48 hours ago
    const acceptedAt = new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000);
    const completedAt = new Date(acceptedAt.getTime() + Math.random() * 2 * 60 * 60 * 1000);
    const pickupIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    let dropoffIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    while (dropoffIdx === pickupIdx) {
      dropoffIdx = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
    }

    rides.push({
      id: `ride_completed_${i}`,
      riderId: i % 2 === 0 ? 'user_001' : 'user_002',
      pickupAddress: SAMPLE_ADDRESSES[pickupIdx],
      dropoffAddress: SAMPLE_ADDRESSES[dropoffIdx],
      distanceKm: Math.round((Math.random() * 15 + 5) * 10) / 10,
      status: 'COMPLETED',
      createdAt,
      expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
      acceptedBidId: `bid_completed_${i}_1`,
      acceptedAt,
      completedAt,
    });
  }

  return rides;
};

// Generate sample bids
export const generateSampleBids = (rides: Ride[]): Bid[] => {
  const bids: Bid[] = [];
  let bidCounter = 0;

  // Create bids for OPEN rides
  rides
    .filter(ride => ride.status === 'OPEN')
    .forEach(ride => {
      const numBids = Math.floor(Math.random() * 4) + 1; // 1-4 bids per ride
      for (let i = 0; i < numBids; i++) {
        const driverId = SAMPLE_USERS[(i + 1) % SAMPLE_USERS.length].id;
        // Skip bid if it's from the rider themselves
        if (driverId === ride.riderId) continue;

        const basePrice = ride.distanceKm * 2; // ~$2/km base
        const variation = (Math.random() - 0.5) * basePrice * 0.4; // ±20% variation
        const price = Math.round((basePrice + variation) * 100) / 100;

        bids.push({
          id: `bid_${ride.id}_${bidCounter++}`,
          rideId: ride.id,
          driverId,
          priceAmount: price,
          message: i % 2 === 0 ? 'Available now, clean car!' : undefined,
          createdAt: new Date(ride.createdAt.getTime() + Math.random() * 60 * 60 * 1000),
        });
      }
    });

  // Create bids for ACCEPTED rides (including the accepted bid)
  rides
    .filter(ride => ride.status === 'ACCEPTED' && ride.acceptedBidId)
    .forEach(ride => {
      // Accepted bid
      bids.push({
        id: ride.acceptedBidId!,
        rideId: ride.id,
        driverId: 'user_002',
        priceAmount: Math.round(ride.distanceKm * 2 * 100) / 100,
        message: 'On my way!',
        createdAt: new Date(ride.createdAt.getTime() + 30 * 60 * 1000),
      });

      // Other bids that weren't accepted
      const numOtherBids = Math.floor(Math.random() * 3);
      for (let i = 0; i < numOtherBids; i++) {
        bids.push({
          id: `bid_${ride.id}_other_${i}`,
          rideId: ride.id,
          driverId: SAMPLE_USERS[(i + 2) % SAMPLE_USERS.length].id,
          priceAmount: Math.round((ride.distanceKm * 2 + Math.random() * 10) * 100) / 100,
          createdAt: new Date(ride.createdAt.getTime() + Math.random() * 60 * 60 * 1000),
        });
      }
    });

  return bids;
};
