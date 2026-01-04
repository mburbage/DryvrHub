-- ================================================================
-- DRYVERHUB CORE MARKETPLACE SCHEMA
-- PostgreSQL schema for ride marketplace (non-verification tables)
-- ================================================================

-- Drop existing tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS admin_flags CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS riders CASCADE;
DROP TYPE IF EXISTS trip_status_enum;
DROP TYPE IF EXISTS bid_status_enum;
DROP TYPE IF EXISTS sender_type_enum;
DROP TYPE IF EXISTS user_type_enum;

-- Create enum types
CREATE TYPE trip_status_enum AS ENUM ('open', 'accepted', 'cancelled', 'expired');
CREATE TYPE bid_status_enum AS ENUM ('submitted', 'withdrawn', 'accepted', 'rejected');
CREATE TYPE sender_type_enum AS ENUM ('rider', 'driver');
CREATE TYPE user_type_enum AS ENUM ('rider', 'driver');

-- ================================================================
-- RIDERS TABLE
-- ================================================================
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Optional verification (binary only)
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- ================================================================
-- TRIPS TABLE (RIDE REQUESTS)
-- ================================================================
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    
    -- Location information
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    
    -- Coordinates (for distance estimation only, not real-time tracking)
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    dropoff_lat DECIMAL(10, 8),
    dropoff_lng DECIMAL(11, 8),
    
    -- Estimates
    estimated_distance_miles DECIMAL(6, 2),
    estimated_duration_minutes INTEGER,
    
    -- Schedule
    scheduled_pickup_time TIMESTAMP,
    notes TEXT,
    
    -- State
    status trip_status_enum NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Create indexes for common queries
CREATE INDEX idx_trips_rider_id ON trips(rider_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_expires_at ON trips(expires_at);

-- ================================================================
-- BIDS TABLE (DRIVER OFFERS)
-- ================================================================
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Driver-set price (no platform influence)
    bid_amount DECIMAL(10, 2) NOT NULL,
    message TEXT,
    
    -- State
    status bid_status_enum NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate bids from same driver on same trip
    UNIQUE(trip_id, driver_id)
);

-- Create indexes for common queries
CREATE INDEX idx_bids_trip_id ON bids(trip_id);
CREATE INDEX idx_bids_driver_id ON bids(driver_id);
CREATE INDEX idx_bids_status ON bids(status);

-- ================================================================
-- MESSAGES TABLE (BASIC COMMUNICATION)
-- ================================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sender_type sender_type_enum NOT NULL,
    sender_id UUID NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for retrieving messages by trip
CREATE INDEX idx_messages_trip_id ON messages(trip_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ================================================================
-- REPORTS TABLE (SAFETY WITHOUT RATINGS)
-- ================================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_type user_type_enum NOT NULL,
    reporter_id UUID NOT NULL,
    reported_type user_type_enum NOT NULL,
    reported_id UUID NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for admin review
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_reported_id ON reports(reported_type, reported_id);

-- ================================================================
-- ADMIN FLAGS TABLE (INTERNAL ONLY)
-- ================================================================
CREATE TABLE admin_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type user_type_enum NOT NULL,
    user_id UUID NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for admin review
CREATE INDEX idx_admin_flags_user ON admin_flags(user_type, user_id);

-- ================================================================
-- MARKETPLACE RULES ENFORCED BY SCHEMA
-- ================================================================
-- 1. One bid per driver per trip (UNIQUE constraint on bids)
-- 2. Bids reference valid trips and drivers (FOREIGN KEY constraints)
-- 3. Trips belong to riders (FOREIGN KEY constraint)
-- 4. No ratings, scores, or rankings (no such columns exist)
-- 5. Status transitions are manual (enum values, no triggers)
-- 6. No real-time tracking (no GPS trace tables)
-- 7. No payment processing (no payment tables)
-- 8. No algorithmic ordering (no ranking columns)
-- ================================================================
