-- ================================================================
-- Migration 002: Add Rider Completion Verification
-- ================================================================
-- Purpose: Add rider_confirmed_at timestamp to track when rider
--          verifies trip was completed successfully
-- Date: January 4, 2026
-- ================================================================

-- Add rider confirmation timestamp
ALTER TABLE trips ADD COLUMN IF NOT EXISTS rider_confirmed_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN trips.rider_confirmed_at IS 'Timestamp when rider confirmed trip was completed successfully';

-- Note: We keep 'completed' separate from 'paid'
-- - 'completed' = driver marked trip as finished
-- - 'paid' = rider verified completion (final status)
