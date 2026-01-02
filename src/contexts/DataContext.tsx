import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ride, Bid, User, RiderProfile, DriverProfile} from '../models';
import {
  validateStateTransition,
  shouldExpireRide,
} from '../utils/rideStateMachine';
import {generateSampleRides, generateSampleBids} from '../data/sampleData';

const RIDES_STORAGE_KEY = '@dryverhub_rides';
const BIDS_STORAGE_KEY = '@dryverhub_bids';
const BLOCKED_USERS_STORAGE_KEY = '@dryverhub_blocked_users';

interface DataContextType {
  // Rides
  rides: Ride[];
  createRide: (ride: Omit<Ride, 'id' | 'createdAt' | 'expiresAt'>) => Ride;
  updateRideStatus: (
    rideId: string,
    newStatus: Ride['status'],
    acceptedBidId?: string,
  ) => void;
  getRideById: (rideId: string) => Ride | undefined;
  getRidesByRider: (riderId: string) => Ride[];
  getOpenRides: () => Ride[];

  // Bids
  bids: Bid[];
  createBid: (bid: Omit<Bid, 'id' | 'createdAt'>) => Bid;
  getBidsByRide: (rideId: string) => Bid[];
  getBidsByDriver: (driverId: string) => Bid[];
  deleteBid: (bidId: string) => void;

  // Expiry
  expireStaleRides: () => void;

  // Users & Profiles
  getCurrentUser: () => User;
  getRiderProfile: (userId: string) => RiderProfile | undefined;
  getDriverProfile: (userId: string) => DriverProfile | undefined;

  // Safety
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
  getBlockedUsers: () => string[];
  reportUser: (userId: string, reason: string) => void;

  // Development
  resetAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Default expiry: 24 hours from creation
const DEFAULT_EXPIRY_HOURS = 24;

// Mock current user - will be replaced with real auth later
const MOCK_USER: User = {
  id: 'user_001',
  email: 'user@dryverhub.com',
  phoneNumber: '+1234567890',
  createdAt: new Date('2024-12-01'), // ~1 month old account
  isVerified: true,
};

const MOCK_RIDER_PROFILE: RiderProfile = {
  userId: 'user_001',
  completedRidesCount: 12, // Private only
};

const MOCK_DRIVER_PROFILE: DriverProfile = {
  userId: 'user_001',
  completedRidesCount: 47, // Private only
};

// Generate initial sample data once
const INITIAL_SAMPLE_RIDES = generateSampleRides();
const INITIAL_SAMPLE_BIDS = generateSampleBids(INITIAL_SAMPLE_RIDES);

export const DataProvider = ({children}: {children: ReactNode}) => {
  // Initialize with empty data, will load from storage
  const [rides, setRides] = useState<Ride[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [reports, setReports] = useState<Array<{userId: string; reason: string; timestamp: Date}>>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = async () => {
    try {
      const [ridesData, bidsData, blockedData] = await Promise.all([
        AsyncStorage.getItem(RIDES_STORAGE_KEY),
        AsyncStorage.getItem(BIDS_STORAGE_KEY),
        AsyncStorage.getItem(BLOCKED_USERS_STORAGE_KEY),
      ]);

      if (ridesData && bidsData) {
        // Load existing data
        const parsedRides = JSON.parse(ridesData, (key, value) => {
          // Revive Date objects
          if (key === 'createdAt' || key === 'expiresAt' || key === 'acceptedAt' || key === 'completedAt') {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        const parsedBids = JSON.parse(bidsData, (key, value) => {
          if (key === 'createdAt') {
            return new Date(value);
          }
          return value;
        });
        setRides(parsedRides);
        setBids(parsedBids);
      } else {
        // First launch: load sample data
        setRides(INITIAL_SAMPLE_RIDES);
        setBids(INITIAL_SAMPLE_BIDS);
      }

      if (blockedData) {
        setBlockedUsers(new Set(JSON.parse(blockedData)));
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback to sample data
      setRides(INITIAL_SAMPLE_RIDES);
      setBids(INITIAL_SAMPLE_BIDS);
      setIsLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(RIDES_STORAGE_KEY, JSON.stringify(rides)),
        AsyncStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(bids)),
        AsyncStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(Array.from(blockedUsers))),
      ]);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveData();
    }
  }, [rides, bids, blockedUsers, isLoaded]);

  const createRide = (
    ride: Omit<Ride, 'id' | 'createdAt' | 'expiresAt'>,
  ): Ride => {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const newRide: Ride = {
      ...ride,
      id: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      expiresAt,
      status: 'OPEN',
    };

    setRides(prev => [...prev, newRide]);
    return newRide;
  };

  const updateRideStatus = (
    rideId: string,
    newStatus: Ride['status'],
    acceptedBidId?: string,
  ) => {
    setRides(prev =>
      prev.map(ride => {
        if (ride.id !== rideId) {
          return ride;
        }

        // Validate state transition
        validateStateTransition(ride.status, newStatus);

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

  const createBid = (bid: Omit<Bid, 'id' | 'createdAt'>): Bid => {
    const newBid: Bid = {
      ...bid,
      id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    setBids(prev => [...prev, newBid]);
    return newBid;
  };

  const getBidsByRide = (rideId: string): Bid[] => {
    return bids.filter(bid => 
      bid.rideId === rideId && !blockedUsers.has(bid.driverId)
    );
  };

  const getBidsByDriver = (driverId: string): Bid[] => {
    return bids.filter(bid => bid.driverId === driverId);
  };

  const deleteBid = (bidId: string) => {
    setBids(prev => prev.filter(bid => bid.id !== bidId));
  };

  const expireStaleRides = () => {
    setRides(prev =>
      prev.map(ride => {
        if (ride.status === 'OPEN' && shouldExpireRide(ride.expiresAt)) {
          return {...ride, status: 'EXPIRED'};
        }
        return ride;
      }),
    );
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
      return MOCK_DRIVER_PROFILE;
    }
    return undefined;
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

  const reportUser = (userId: string, reason: string) => {
    const report = {
      userId,
      reason,
      timestamp: new Date(),
    };
    setReports(prev => [...prev, report]);
    console.log('User reported:', report);
    // In production, this would send to moderation system
  };

  const resetAllData = async () => {
    try {
      // Clear AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem(RIDES_STORAGE_KEY),
        AsyncStorage.removeItem(BIDS_STORAGE_KEY),
        AsyncStorage.removeItem(BLOCKED_USERS_STORAGE_KEY),
      ]);
      
      // Reset state to fresh sample data
      const freshRides = generateSampleRides();
      const freshBids = generateSampleBids(freshRides);
      setRides(freshRides);
      setBids(freshBids);
      setBlockedUsers(new Set());
      setReports([]);
      
      console.log('All data reset to sample data');
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
        bids,
        createBid,
        getBidsByRide,
        getBidsByDriver,
        deleteBid,
        expireStaleRides,
        getCurrentUser,
        getRiderProfile,
        getDriverProfile,
        blockUser,
        unblockUser,
        isUserBlocked,
        getBlockedUsers,
        reportUser,
        resetAllData,
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
