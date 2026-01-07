UPDATE trips SET status = 'accepted' WHERE status IN ('en_route', 'arrived', 'code_verified', 'in_progress', 'completed', 'rider_confirmed');
SELECT id, status FROM trips;
