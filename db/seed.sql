-- ================================================================
-- DRYVERHUB DEVELOPMENT SEED DATA
-- Fake data for local testing only
-- ================================================================

-- Clear existing data
TRUNCATE TABLE vehicles, drivers RESTART IDENTITY CASCADE;

-- ================================================================
-- SEED DRIVERS
-- ================================================================

-- Driver 1: Fully verified
INSERT INTO drivers (id, email, created_at, identity_verified, identity_verified_at, background_check_status, background_checked_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'verified.driver@example.com',
    NOW() - INTERVAL '30 days',
    TRUE,
    NOW() - INTERVAL '25 days',
    'passed',
    NOW() - INTERVAL '24 days'
);

-- Driver 2: Identity verified, background pending
INSERT INTO drivers (id, email, created_at, identity_verified, identity_verified_at, background_check_status, background_checked_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'partial.driver@example.com',
    NOW() - INTERVAL '15 days',
    TRUE,
    NOW() - INTERVAL '10 days',
    'not_completed',
    NULL
);

-- Driver 3: Background check rejected
INSERT INTO drivers (id, email, created_at, identity_verified, identity_verified_at, background_check_status, background_checked_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'rejected.driver@example.com',
    NOW() - INTERVAL '20 days',
    TRUE,
    NOW() - INTERVAL '18 days',
    'rejected',
    NOW() - INTERVAL '17 days'
);

-- Driver 4: Completely unverified
INSERT INTO drivers (id, email, created_at, identity_verified, identity_verified_at, background_check_status, background_checked_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'unverified.driver@example.com',
    NOW() - INTERVAL '5 days',
    FALSE,
    NULL,
    'not_completed',
    NULL
);

-- Driver 5: Identity and background passed, no vehicle
INSERT INTO drivers (id, email, created_at, identity_verified, identity_verified_at, background_check_status, background_checked_at)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    'novehicle.driver@example.com',
    NOW() - INTERVAL '12 days',
    TRUE,
    NOW() - INTERVAL '10 days',
    'passed',
    NOW() - INTERVAL '9 days'
);

-- ================================================================
-- SEED VEHICLES
-- ================================================================

-- Vehicle 1: Fully verified (for driver 1)
INSERT INTO vehicles (id, driver_id, make, model, year, vehicle_verified, vehicle_verified_at, insurance_expiration_date)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Toyota',
    'Camry',
    2020,
    TRUE,
    NOW() - INTERVAL '23 days',
    '2026-12-31'
);

-- Vehicle 2: Not verified (for driver 2)
INSERT INTO vehicles (id, driver_id, make, model, year, vehicle_verified, vehicle_verified_at, insurance_expiration_date)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Honda',
    'Civic',
    2019,
    FALSE,
    NULL,
    '2026-06-30'
);

-- Vehicle 3: Not verified (for driver 4)
INSERT INTO vehicles (id, driver_id, make, model, year, vehicle_verified, vehicle_verified_at, insurance_expiration_date)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '44444444-4444-4444-4444-444444444444',
    'Ford',
    'Escape',
    2021,
    FALSE,
    NULL,
    '2026-09-15'
);

-- ================================================================
-- VERIFICATION SUMMARY
-- ================================================================
-- Driver 1: ✓ Identity, ✓ Background, ✓ Vehicle (FULLY VERIFIED)
-- Driver 2: ✓ Identity, ○ Background, ○ Vehicle
-- Driver 3: ✓ Identity, ✗ Background (REJECTED), ○ Vehicle
-- Driver 4: ○ Identity, ○ Background, ○ Vehicle (NO VERIFICATION)
-- Driver 5: ✓ Identity, ✓ Background, NO VEHICLE
-- ================================================================
