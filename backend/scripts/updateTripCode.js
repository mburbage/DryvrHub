const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const code = Math.floor(100000 + Math.random() * 900000).toString();
const hash = bcrypt.hashSync(code, 10);

const pool = new Pool({
  user: 'ride_dev_user',
  password: 'devpassword',
  host: 'localhost',
  port: 5432,
  database: 'ride_marketplace_dev'
});

pool.query(
  'UPDATE trips SET status = $1, pickup_code = $2, pickup_code_hash = $3 WHERE id = $4',
  ['arrived', code, hash, '3ab1a5bf-d18a-4d1b-9c1c-301b03481cf6']
).then(() => {
  console.log('✓ Trip updated with pickup code:', code);
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
