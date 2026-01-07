-- ================================================================
-- MIGRATION: ADD PICKUP_CODE COLUMN
-- Adds plain text pickup_code to trips table for rider display
-- ================================================================

ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_code TEXT;

-- ================================================================
-- NOTES:
-- - pickup_code stores the plain 6-digit code for rider to display
-- - pickup_code_hash stores the bcrypt hash for driver verification
-- - Both are generated when a bid is accepted
-- ================================================================
