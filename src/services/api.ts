// API Service for DryverHub Backend
// Use 10.0.2.2 for Android emulator (maps to host machine's localhost)
// Use localhost for iOS simulator
import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000/api'
  : 'http://localhost:3000/api';

// Generic fetch wrapper with error handling
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============= TRIPS API =============

export interface Trip {
  id: string;
  rider_id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_distance_miles?: number;
  estimated_duration_minutes?: number;
  scheduled_pickup_time: string;
  notes?: string;
  status: 'open' | 'accepted' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string;
}

export const tripsApi = {
  getAll: (filters?: { status?: string; rider_id?: string }) => {
    const params = new URLSearchParams(filters as any);
    return apiFetch<Trip[]>(`/trips?${params}`);
  },
  
  getOpen: () => apiFetch<Trip[]>('/trips/open'),
  
  getById: (id: string) => apiFetch<Trip>(`/trips/${id}`),
  
  create: (data: Omit<Trip, 'id' | 'created_at' | 'expires_at' | 'status'>) => 
    apiFetch<Trip>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateStatus: (id: string, status: Trip['status']) => 
    apiFetch<Trip>(`/trips/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  
  cancel: (id: string) => 
    apiFetch<{ message: string; trip: Trip }>(`/trips/${id}`, {
      method: 'DELETE',
    }),
};

// ============= BIDS API =============

export interface Bid {
  id: string;
  trip_id: string;
  driver_id: string;
  bid_amount: number;
  message?: string;
  status: 'submitted' | 'withdrawn' | 'accepted' | 'rejected';
  created_at: string;
}

export const bidsApi = {
  getAll: (filters?: { trip_id?: string; driver_id?: string; status?: string }) => {
    const params = new URLSearchParams(filters as any);
    return apiFetch<Bid[]>(`/bids?${params}`);
  },
  
  getById: (id: string) => apiFetch<Bid>(`/bids/${id}`),
  
  create: (data: Omit<Bid, 'id' | 'created_at' | 'status'>) => 
    apiFetch<Bid>('/bids', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateStatus: (id: string, status: Bid['status']) => 
    apiFetch<Bid>(`/bids/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  
  withdraw: (id: string) => 
    apiFetch<{ message: string; bid: Bid }>(`/bids/${id}`, {
      method: 'DELETE',
    }),
};

// ============= RIDERS API =============

export interface Rider {
  id: string;
  email: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
}

export const ridersApi = {
  getAll: () => apiFetch<Rider[]>('/riders'),
  
  getById: (id: string) => apiFetch<Rider>(`/riders/${id}`),
  
  create: (data: { email: string; email_verified?: boolean; phone_verified?: boolean }) => 
    apiFetch<Rider>('/riders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Omit<Rider, 'id' | 'created_at'>>) => 
    apiFetch<Rider>(`/riders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ============= DRIVERS API =============

export interface Driver {
  id: string;
  email: string;
  identity_verified: boolean;
  identity_verified_at?: string;
  background_check_status: 'passed' | 'not_completed' | 'rejected';
  background_check_completed_at?: string;
  vehicle_id?: string;
  created_at: string;
  // Vehicle fields (from JOIN)
  year?: number;
  make?: string;
  model?: string;
  color?: string;
  license_plate?: string;
  vehicle_verified?: boolean;
  vehicle_verified_at?: string;
}

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  license_plate: string;
  vehicle_verified: boolean;
  vehicle_verified_at?: string;
  insurance_expiration_date?: string;
  created_at: string;
}

export const driversApi = {
  getAll: () => apiFetch<Driver[]>('/drivers'),
  
  getById: (id: string) => apiFetch<Driver>(`/drivers/${id}`),
  
  create: (data: { email: string }) => 
    apiFetch<Driver>('/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateVerification: (id: string, data: {
    identity_verified?: boolean;
    background_check_status?: 'passed' | 'not_completed' | 'rejected';
  }) => 
    apiFetch<Driver>(`/drivers/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  createOrUpdateVehicle: (driverId: string, data: Omit<Vehicle, 'id' | 'created_at' | 'vehicle_verified' | 'vehicle_verified_at'>) => 
    apiFetch<Vehicle>(`/drivers/${driverId}/vehicle`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============= MESSAGES API =============

export interface Message {
  id: string;
  trip_id: string;
  sender_type: 'rider' | 'driver';
  sender_id: string;
  message_text: string;
  created_at: string;
}

export const messagesApi = {
  getByTrip: (tripId: string) => 
    apiFetch<Message[]>(`/messages?trip_id=${tripId}`),
  
  create: (data: Omit<Message, 'id' | 'created_at'>) => 
    apiFetch<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============= REPORTS API =============

export interface Report {
  id: string;
  reporter_type: 'rider' | 'driver';
  reporter_id: string;
  reported_type: 'rider' | 'driver';
  reported_id: string;
  trip_id?: string;
  reason: string;
  created_at: string;
}

export interface AdminFlag {
  id: string;
  user_type: 'rider' | 'driver';
  user_id: string;
  note: string;
  created_at: string;
}

export const reportsApi = {
  getAll: () => apiFetch<Report[]>('/reports'),
  
  create: (data: Omit<Report, 'id' | 'created_at'>) => 
    apiFetch<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getFlags: () => apiFetch<AdminFlag[]>('/reports/flags'),
  
  createFlag: (data: Omit<AdminFlag, 'id' | 'created_at'>) => 
    apiFetch<AdminFlag>('/reports/flags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Health check
export const healthCheck = () => apiFetch<{ status: string; database: string; timestamp: string }>('/health');
