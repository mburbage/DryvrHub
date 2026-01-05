const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://ride_dev_user:devpassword@localhost:5432/ride_marketplace_dev'
});

async function runMigration() {
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../../db/migrations/001_add_auth_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration: 001_add_auth_fields.sql');
    await pool.query(sql);
    console.log('✓ Migration completed successfully');
    
    // Verify columns were added
    const riders = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'riders' 
      AND column_name IN ('password_hash', 'verification_token', 'reset_token')
    `);
    console.log('\nRiders table columns added:', riders.rows);
    
    const drivers = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' 
      AND column_name IN ('password_hash', 'verification_token', 'reset_token', 'email_verified')
    `);
    console.log('Drivers table columns added:', drivers.rows);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
