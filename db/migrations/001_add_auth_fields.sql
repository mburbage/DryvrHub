-- ================================================================
-- MIGRATION: ADD AUTHENTICATION FIELDS
-- Adds email/password authentication to riders and drivers tables
-- ================================================================

-- Add auth fields to RIDERS table
ALTER TABLE riders ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP;

-- Add auth fields to DRIVERS table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP;

-- Rename email_verified for clarity (riders already has it)
-- Drivers table needs it added
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Create indexes for token lookups
CREATE INDEX IF NOT EXISTS idx_riders_verification_token ON riders(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_riders_reset_token ON riders(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_verification_token ON drivers(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_reset_token ON drivers(reset_token) WHERE reset_token IS NOT NULL;

-- ================================================================
-- RULES ENFORCED:
-- - password_hash stored, never plaintext
-- - tokens for verification and reset
-- - tokens have expiration
-- - email_verified is explicit boolean
-- - NO scoring, ranking, or trust metrics
-- ================================================================
