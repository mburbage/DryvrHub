-- ================================================================
-- DRYVERHUB CORE MARKETPLACE SEED DATA
-- Fake data for local testing only
-- ================================================================

-- Clear existing data
TRUNCATE TABLE admin_flags, reports, messages, bids, trips, riders RESTART IDENTITY CASCADE;

-- ================================================================
-- SEED RIDERS
-- ================================================================

-- Rider 1: Active rider with multiple trips
INSERT INTO riders (id, email, created_at, email_verified, phone_verified)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'active.rider@example.com',
    NOW() - INTERVAL '60 days',
    TRUE,
    TRUE
);

-- Rider 2: New rider, verified
INSERT INTO riders (id, email, created_at, email_verified, phone_verified)
VALUES (
    'a2222222-2222-2222-2222-222222222222',
    'new.rider@example.com',
    NOW() - INTERVAL '5 days',
    TRUE,
    FALSE
);

-- Rider 3: Unverified rider
INSERT INTO riders (id, email, created_at, email_verified, phone_verified)
VALUES (
    'a3333333-3333-3333-3333-333333333333',
    'unverified.rider@example.com',
    NOW() - INTERVAL '2 days',
    FALSE,
    FALSE
);

-- ================================================================
-- SEED TRIPS
-- ================================================================

-- Trip 1: Open trip with multiple bids
INSERT INTO trips (
    id, rider_id, pickup_address, dropoff_address,
    pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
    estimated_distance_miles, estimated_duration_minutes,
    scheduled_pickup_time, notes, status, created_at, expires_at
)
VALUES (
    'b1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    '123 Main St, Raleigh, NC 27601',
    '456 Oak Ave, Durham, NC 27701',
    35.7796, -78.6382, 35.9940, -78.8986,
    24.50, 35,
    NOW() + INTERVAL '2 days',
    'Please call when you arrive',
    'open',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '6 hours'
);

-- Trip 2: Open trip with no bids yet
INSERT INTO trips (
    id, rider_id, pickup_address, dropoff_address,
    pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
    estimated_distance_miles, estimated_duration_minutes,
    scheduled_pickup_time, notes, status, created_at, expires_at
)
VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    '789 Elm St, Chapel Hill, NC 27514',
    '321 Pine Rd, Cary, NC 27511',
    35.9132, -79.0558, 35.7915, -78.7811,
    18.30, 28,
    NOW() + INTERVAL '1 day',
    'Airport pickup needed',
    'open',
    NOW() - INTERVAL '30 minutes',
    NOW() + INTERVAL '23 hours'
);

-- Trip 3: Accepted trip
INSERT INTO trips (
    id, rider_id, pickup_address, dropoff_address,
    pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
    estimated_distance_miles, estimated_duration_minutes,
    scheduled_pickup_time, notes, status, created_at, expires_at
)
VALUES (
    'b3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    '555 Market St, Raleigh, NC 27604',
    '777 University Dr, Durham, NC 27708',
    35.7796, -78.6382, 36.0014, -78.9382,
    28.75, 40,
    NOW() + INTERVAL '4 hours',
    NULL,
    'accepted',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day'
);

-- Trip 4: Expired trip
INSERT INTO trips (
    id, rider_id, pickup_address, dropoff_address,
    pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
    estimated_distance_miles, estimated_duration_minutes,
    scheduled_pickup_time, notes, status, created_at, expires_at
)
VALUES (
    'b4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    '100 Old St, Raleigh, NC 27601',
    '200 New St, Durham, NC 27701',
    35.7796, -78.6382, 35.9940, -78.8986,
    22.00, 32,
    NOW() - INTERVAL '1 day',
    'Trip expired',
    'expired',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
);

-- Trip 5: Cancelled trip
INSERT INTO trips (
    id, rider_id, pickup_address, dropoff_address,
    pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
    estimated_distance_miles, estimated_duration_minutes,
    scheduled_pickup_time, notes, status, created_at, expires_at
)
VALUES (
    'b5555555-5555-5555-5555-555555555555',
    'a2222222-2222-2222-2222-222222222222',
    '888 Cancel Ln, Raleigh, NC 27603',
    '999 Done Ave, Durham, NC 27702',
    35.7796, -78.6382, 35.9940, -78.8986,
    20.00, 30,
    NOW() + INTERVAL '1 hour',
    'Plans changed',
    'cancelled',
    NOW() - INTERVAL '3 hours',
    NOW() + INTERVAL '2 hours'
);

-- ================================================================
-- SEED BIDS
-- ================================================================

-- Bids for Trip 1 (open trip with multiple bids)
INSERT INTO bids (id, trip_id, driver_id, bid_amount, message, status, created_at)
VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        'b1111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        45.00,
        'I can pick you up! Clean car, great service.',
        'submitted',
        NOW() - INTERVAL '1 hour 50 minutes'
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        'b1111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        42.50,
        'Available for your trip. Have a great day!',
        'submitted',
        NOW() - INTERVAL '1 hour 30 minutes'
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'b1111111-1111-1111-1111-111111111111',
        '44444444-4444-4444-4444-444444444444',
        50.00,
        NULL,
        'submitted',
        NOW() - INTERVAL '45 minutes'
    );

-- Bid for Trip 3 (accepted trip)
INSERT INTO bids (id, trip_id, driver_id, bid_amount, message, status, created_at)
VALUES
    (
        'c4444444-4444-4444-4444-444444444444',
        'b3333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        52.00,
        'Happy to help!',
        'accepted',
        NOW() - INTERVAL '23 hours'
    ),
    (
        'c5555555-5555-5555-5555-555555555555',
        'b3333333-3333-3333-3333-333333333333',
        '22222222-2222-2222-2222-222222222222',
        48.00,
        'I can do this trip',
        'rejected',
        NOW() - INTERVAL '23 hours 30 minutes'
    );

-- Withdrawn bid
INSERT INTO bids (id, trip_id, driver_id, bid_amount, message, status, created_at)
VALUES
    (
        'c6666666-6666-6666-6666-666666666666',
        'b1111111-1111-1111-1111-111111111111',
        '55555555-5555-5555-5555-555555555555',
        55.00,
        'Sorry, no longer available',
        'withdrawn',
        NOW() - INTERVAL '2 hours'
    );

-- ================================================================
-- SEED MESSAGES
-- ================================================================

-- Messages for accepted trip
INSERT INTO messages (id, trip_id, sender_type, sender_id, message_text, created_at)
VALUES
    (
        'd1111111-1111-1111-1111-111111111111',
        'b3333333-3333-3333-3333-333333333333',
        'rider',
        'a1111111-1111-1111-1111-111111111111',
        'What time will you arrive?',
        NOW() - INTERVAL '2 hours'
    ),
    (
        'd2222222-2222-2222-2222-222222222222',
        'b3333333-3333-3333-3333-333333333333',
        'driver',
        '11111111-1111-1111-1111-111111111111',
        'I will be there at the scheduled time, see you soon!',
        NOW() - INTERVAL '1 hour 55 minutes'
    );

-- ================================================================
-- SEED REPORTS (EXAMPLE ONLY)
-- ================================================================

INSERT INTO reports (id, reporter_type, reporter_id, reported_type, reported_id, trip_id, reason, created_at)
VALUES
    (
        'e1111111-1111-1111-1111-111111111111',
        'rider',
        'a1111111-1111-1111-1111-111111111111',
        'driver',
        '33333333-3333-3333-3333-333333333333',
        'b4444444-4444-4444-4444-444444444444',
        'Driver was unprofessional and arrived very late',
        NOW() - INTERVAL '12 hours'
    );

-- ================================================================
-- SEED ADMIN FLAGS (INTERNAL ONLY)
-- ================================================================

INSERT INTO admin_flags (id, user_type, user_id, note, created_at)
VALUES
    (
        'f1111111-1111-1111-1111-111111111111',
        'driver',
        '33333333-3333-3333-3333-333333333333',
        'Multiple reports received, under review',
        NOW() - INTERVAL '6 hours'
    );

-- ================================================================
-- DATA SUMMARY
-- ================================================================
-- Riders: 3 (1 active, 1 new, 1 unverified)
-- Trips: 5 (2 open, 1 accepted, 1 expired, 1 cancelled)
-- Bids: 6 (4 submitted, 1 accepted, 1 withdrawn)
-- Messages: 2 (conversation on accepted trip)
-- Reports: 1 (example report)
-- Admin Flags: 1 (example flag)
-- ================================================================
