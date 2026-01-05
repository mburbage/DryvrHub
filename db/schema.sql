-- ================================================================
-- DRYVERHUB LOCAL DEVELOPMENT DATABASE SCHEMA
-- PostgreSQL schema for driver verification
-- ================================================================

-- Drop existing tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TYPE IF EXISTS background_check_status_enum;

-- Create custom enum type for background check status
CREATE TYPE background_check_status_enum AS ENUM ('passed', 'not_completed', 'rejected');

-- ================================================================
-- DRIVERS TABLE
-- ================================================================
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Email verification
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token TEXT,
    verification_expires_at TIMESTAMP,
    
    -- Identity verification (Persona API)
    identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    identity_verified_at TIMESTAMP,
    
    -- Background check (Checkr API)
    background_check_status background_check_status_enum NOT NULL DEFAULT 'not_completed',
    background_checked_at TIMESTAMP
);

-- ================================================================
-- VEHICLES TABLE
-- ================================================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Vehicle information
    make TEXT,
    model TEXT,
    year INTEGER,
    
    -- Vehicle verification (NC DMV manual review)
    vehicle_verified BOOLEAN NOT NULL DEFAULT FALSE,
    vehicle_verified_at TIMESTAMP,
    insurance_expiration_date DATE
);

-- Create index for faster lookups
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);

-- ================================================================
-- VERIFICATION NOTES
-- ================================================================
-- This schema supports:
-- 1. Identity verification (binary: verified or not)
-- 2. Background checks (enum: passed/not_completed/rejected)
-- 3. Vehicle verification (binary: verified or not)
--
-- NO scores, rankings, or comparative data
-- NO stored personal information (PII)
-- NO ratings or trust levels
-- ================================================================
