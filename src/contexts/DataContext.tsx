import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ride, Bid, User, RiderProfile, DriverProfile} from '../models';
import {tripsApi, bidsApi, ridersApi, driversApi, messagesApi, reportsApi} from '../services/api';

const BLOCKED_USERS_STORAGE_KEY = '@dryverhub_blocked_users';
const CURRENT_USER_ID_KEY = '@dryverhub_current_user_id';

interface DataContextType {
  // Rides
  rides: Ride[];
  createRide: (ride: Omit<Ride, 'id' | 'createdAt' | 'expiresAt'>) => Promise<Ride>;
  updateRideStatus: (
    rideId: string,
    newStatus: Ride['status'],
    acceptedBidId?: string,
  ) => Promise<void>;
  getRideById: (rideId: string) => Ride | undefined;
  getRidesByRider: (riderId: string) => Ride[];
  getOpenRides: () => Ride[];
  refreshRides: () => Promise<void>;

  // Bids
  bids: Bid[];
  createBid: (bid: Omit<Bid, 'id' | 'createdAt'>) => Promise<Bid>;
  getBidsByRide: (rideId: string) => Bid[];
  getBidsByDriver: (driverId: string) => Bid[];
  deleteBid: (bidId: string) => Promise<void>;
  refreshBids: () => Promise<void>;

  // Expiry
  expireStaleRides: () => void;

  // Users & Profiles
  getCurrentUser: () => User;
  getRiderProfile: (userId: string) => RiderProfile | undefined;
  getDriverProfile: (userId: string) => DriverProfile | undefined;
  updateDriverProfile: (userId: string, vehicle: DriverProfile['vehicle']) => Promise<void>;

  // Safety
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
  getBlockedUsers: () => string[];
  reportUser: (userId: string, reason: string) => Promise<void>;

  // Development
  resetAllData: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock current user - will be replaced with real auth later
// Using one of the test rider IDs from the database seed
const MOCK_USER: User = {
  id: '11111111-1111-1111-1111-111111111111', // rider_1 from seed data
  email: 'rider1@example.com',
  phoneNumber: '+19195551001',
  createdAt: new Date('2024-12-01'),
  isVerified: true,
};

const MOCK_RIDER_PROFILE: RiderProfile = {
  userId: '11111111-1111-1111-1111-111111111111',
  completedRidesCount: 0, // Will track from API later
};

const MOCK_DRIVER_PROFILE: DriverProfile = {
  userId: '11111111-1111-1111-1111-111111111111',
  completedRidesCount: 0,
  identityVerified: false,
  backgroundCheckStatus: 'not_completed',
  vehicleVerified: false,
  vehicle: {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    photos: [],
  },
};

// Helper function to convert API trip format to app Ride format
function convertApiTripToRide(apiTrip: any): Ride {
  // Convert miles to km (1 mile = 1.60934 km)
  const distanceKm = apiTrip.estimated_distance_miles 
    ? parseFloat(apiTrip.estimated_distance_miles) * 1.60934 
    : 0;

  return {
    id: apiTrip.id,
    riderId: apiTrip.rider_id,
    pickupAddress: apiTrip.pickup_address,
    dropoffAddress: apiTrip.dropoff_address,
    pickupCoordinates: {
      lat: parseFloat(apiTrip.pickup_lat),
      lng: parseFloat(apiTrip.pickup_lng),
    },
    dropoffCoordinates: {
      lat: parseFloat(apiTrip.dropoff_lat),
      lng: parseFloat(apiTrip.dropoff_lng),
    },
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    pickupTime: new Date(apiTrip.scheduled_pickup_time),
    estimatedDuration: apiTrip.estimated_duration_minutes || 0,
    notes: apiTrip.notes,
    status: apiTrip.status.toUpperCase() as Ride['status'],
    createdAt: new Date(apiTrip.created_at),
    expiresAt: new Date(apiTrip.expires_at),
  };
}

// Helper function to convert app Ride format to API trip format
function convertRideToApiTrip(ride: Omit<Ride, 'id' | 'createdAt' | 'expiresAt'>) {
  // Convert km back to miles for the API (1 km = 0.621371 miles)
  const distanceMiles = ride.distanceKm * 0.621371;
  
  return {
    rider_id: ride.riderId,
    pickup_address: ride.pickupAddress,
    dropoff_address: ride.dropoffAddress,
    pickup_lat: ride.pickupCoordinates?.lat || 0,
    pickup_lng: ride.pickupCoordinates?.lng || 0,
    dropoff_lat: ride.dropoffCoordinates?.lat || 0,
    dropoff_lng: ride.dropoffCoordinates?.lng || 0,
    estimated_distance_miles: parseFloat(distanceMiles.toFixed(2)),
    estimated_duration_minutes: ride.estimatedDuration,
    scheduled_pickup_time: ride.pickupTime.toISOString(),
    notes: ride.notes,
  };
}

// Helper function to convert API bid format to app Bid format
function convertApiBidToBid(apiBid: any): Bid {
  return {
    id: apiBid.id,
    rideId: apiBid.trip_id,
    driverId: apiBid.driver_id,
    priceAmount: parseFloat(apiBid.bid_amount),
    message: apiBid.message,
    status: apiBid.status.toUpperCase() as Bid['status'],
    createdAt: new Date(apiBid.created_at),
  };
}

// Helper function to convert app Bid format to API bid format
function convertBidToApiBid(bid: Omit<Bid, 'id' | 'createdAt'>) {
  return {
    trip_id: bid.rideId,
    driver_id: bid.driverId,
    bid_amount: bid.priceAmount,
    message: bid.message,
  };
}

export const DataProvider = ({children}: {children: ReactNode}) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [reports, setReports] = useState<Array<{userId: string; reason: string; timestamp: Date}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<DriverProfile>(MOCK_DRIVER_PROFILE);

  // Load initial data from API
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load blocked users from local storage
      const blockedData = await AsyncStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
      if (blockedData) {
        setBlockedUsers(new Set(JSON.parse(blockedData)));
      }

      // Fetch trips and bids from API
      const [apiTrips, apiBids] = await Promise.all([
        tripsApi.getAll(),
        bidsApi.getAll(),
      ]);

      const convertedRides = apiTrips.map(convertApiTripToRide);
      const convertedBids = apiBids.map(convertApiBidToBid);

      setRides(convertedRides);
      setBids(convertedBids);
    } catch (error) {
      console.error('Failed to load data from API:', error);
      // Could fallback to cached data here
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save blocked users whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(Array.from(blockedUsers)));
  }, [blockedUsers]);

  const refreshRides = async () => {
    try {
      const apiTrips = await tripsApi.getAll();
      const convertedRides = apiTrips.map(convertApiTripToRide);
      setRides(convertedRides);
    } catch (error) {
      console.error('Failed to refresh rides:', error);
    }
  };

  const refreshBids = async () => {
    try {
      const apiBids = await bidsApi.getAll();
      const convertedBids = apiBids.map(convertApiBidToBid);
      setBids(convertedBids);
    } catch (error) {
      console.error('Failed to refresh bids:', error);
    }
  };

  const createRide = async (
    ride: Omit<Ride, 'id' | 'createdAt' | 'expiresAt'>,
  ): Promise<Ride> => {
    try {
      const apiTrip = await tripsApi.create(convertRideToApiTrip(ride));
      const newRide = convertApiTripToRide(apiTrip);
      setRides(prev => [...prev, newRide]);
      return newRide;
    } catch (error) {
      console.error('Failed to create ride:', error);
      throw error;
    }
  };

  const updateRideStatus = async (
    rideId: string,
    newStatus: Ride['status'],
    acceptedBidId?: string,
  ) => {
    try {
      await tripsApi.updateStatus(rideId, newStatus.toLowerCase() as any);
      
      // Update local state
      setRides(prev =>
        prev.map(ride => {
          if (ride.id !== rideId) {
            return ride;
          }

          const updates: Partial<Ride> = {status: newStatus};

          if (newStatus === 'ACCEPTED' && acceptedBidId) {
            updates.acceptedBidId = acceptedBidId;
            updates.acceptedAt = new Date();
          }

          if (newStatus === 'COMPLETED') {
            updates.completedAt = new Date();
          }

          return {...ride, ...updates};
        }),
      );
    } catch (error) {
      console.error('Failed to update ride status:', error);
      throw error;
    }
  };

  const getRideById = (rideId: string): Ride | undefined => {
    return rides.find(ride => ride.id === rideId);
  };

  const getRidesByRider = (riderId: string): Ride[] => {
    return rides.filter(ride => ride.riderId === riderId);
  };

  const getOpenRides = (): Ride[] => {
    return rides.filter(ride => 
      ride.status === 'OPEN' && !blockedUsers.has(ride.riderId)
    );
  };

  const createBid = async (bid: Omit<Bid, 'id' | 'createdAt'>): Promise<Bid> => {
    try {
      const apiBid = await bidsApi.create(convertBidToApiBid(bid));
      const newBid = convertApiBidToBid(apiBid);
      setBids(prev => [...prev, newBid]);
      return newBid;
    } catch (error) {
      console.error('Failed to create bid:', error);
      throw error;
    }
  };

  const getBidsByRide = (rideId: string): Bid[] => {
    return bids.filter(bid => 
      bid.rideId === rideId && !blockedUsers.has(bid.driverId)
    );
  };

  const getBidsByDriver = (driverId: string): Bid[] => {
    return bids.filter(bid => bid.driverId === driverId);
  };

  const deleteBid = async (bidId: string) => {
    try {
      await bidsApi.withdraw(bidId);
      setBids(prev => prev.map(bid => 
        bid.id === bidId ? {...bid, status: 'WITHDRAWN'} : bid
      ));
    } catch (error) {
      console.error('Failed to delete bid:', error);
      throw error;
    }
  };

  const getCurrentUser = (): User => {
    return MOCK_USER;
  };

  const getRiderProfile = (userId: string): RiderProfile | undefined => {
    if (userId === MOCK_USER.id) {
      return MOCK_RIDER_PROFILE;
    }
    return undefined;
  };

  const getDriverProfile = (userId: string): DriverProfile | undefined => {
    if (userId === MOCK_USER.id) {
      return driverProfile;
    }
    return undefined;
  };

  const updateDriverProfile = async (userId: string, vehicle: DriverProfile['vehicle']) => {
    try {
      if (userId === MOCK_USER.id) {
        // TODO: Call API to update vehicle
        // await driversApi.createOrUpdateVehicle(userId, vehicle);
        setDriverProfile(prev => ({...prev, vehicle}));
      }
    } catch (error) {
      console.error('Failed to update driver profile:', error);
      throw error;
    }
  };

  const blockUser = (userId: string) => {
    setBlockedUsers(prev => new Set(prev).add(userId));
  };

  const unblockUser = (userId: string) => {
    setBlockedUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const isUserBlocked = (userId: string): boolean => {
    return blockedUsers.has(userId);
  };

  const getBlockedUsers = (): string[] => {
    return Array.from(blockedUsers);
  };

  const reportUser = async (userId: string, reason: string) => {
    try {
      await reportsApi.create({
        reporter_type: 'rider', // TODO: Determine from current role
        reporter_id: MOCK_USER.id,
        reported_type: 'driver', // TODO: Determine from reported user
        reported_id: userId,
        reason,
      });
      console.log('User reported successfully');
    } catch (error) {
      console.error('Failed to report user:', error);
      throw error;
    }
  };

  const expireStaleRides = () => {
    // Check for expired rides and update their status locally
    const now = new Date();
    setRides(prev =>
      prev.map(ride => {
        if (ride.status === 'OPEN' && ride.expiresAt < now) {
          return {...ride, status: 'EXPIRED'};
        }
        return ride;
      }),
    );
  };

  const resetAllData = async () => {
    try {
      // Clear local storage
      await AsyncStorage.removeItem(BLOCKED_USERS_STORAGE_KEY);
      
      // Reset state
      setRides([]);
      setBids([]);
      setBlockedUsers(new Set());
      setReports([]);
      
      // Reload from API
      await loadData();
      
      console.log('All data reset to API data');
    } catch (error) {
      console.error('Failed to reset data:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider
      value={{
        rides,
        createRide,
        updateRideStatus,
        getRideById,
        getRidesByRider,
        getOpenRides,
        refreshRides,
        bids,
        createBid,
        getBidsByRide,
        getBidsByDriver,
        deleteBid,
        refreshBids,
        expireStaleRides,
        getCurrentUser,
        getRiderProfile,
        getDriverProfile,
        updateDriverProfile,
        blockUser,
        unblockUser,
        isUserBlocked,
        getBlockedUsers,
        reportUser,
        resetAllData,
        isLoading,
      }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
