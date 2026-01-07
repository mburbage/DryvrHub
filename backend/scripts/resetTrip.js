const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://ride_dev_user:devpassword@localhost:5432/ride_marketplace_dev'
});

async function resetTrip() {
  try {
    const result = await pool.query(`
      UPDATE trips 
      SET status = 'accepted' 
      WHERE status IN ('en_route', 'arrived', 'code_verified', 'in_progress', 'completed', 'rider_confirmed')
      RETURNING id, status
    `);
    
    console.log('Reset trips:', result.rows);
    
    const allTrips = await pool.query('SELECT id, status FROM trips ORDER BY created_at DESC');
    console.log('\nAll trips:');
    console.table(allTrips.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetTrip();
