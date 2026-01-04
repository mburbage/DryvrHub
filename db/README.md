# DryverHub Local Database Setup

## Prerequisites

Install PostgreSQL locally:

### macOS (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Setup Instructions

### 1. Create Development Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create development user
CREATE USER ride_dev_user WITH PASSWORD 'devpassword';

# Create development database
CREATE DATABASE ride_marketplace_dev OWNER ride_dev_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ride_marketplace_dev TO ride_dev_user;

# Exit psql
\q
```

### 2. Apply Schema

```bash
# Run schema file
psql -U ride_dev_user -d ride_marketplace_dev -f db/schema.sql
```

### 3. Seed Development Data

```bash
# Run seed file
psql -U ride_dev_user -d ride_marketplace_dev -f db/seed.sql
```

### 4. Verify Setup

```bash
# Connect to database
psql -U ride_dev_user -d ride_marketplace_dev

# Check tables exist
\dt

# Check drivers
SELECT email, identity_verified, background_check_status FROM drivers;

# Check vehicles
SELECT driver_id, make, model, vehicle_verified FROM vehicles;

# Exit
\q
```

### 5. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# The .env file is already configured for local development
# DATABASE_URL=postgres://ride_dev_user:devpassword@localhost:5432/ride_marketplace_dev
```

## Database Schema

### Drivers Table
- `id` - UUID primary key
- `email` - Unique email address
- `created_at` - Account creation timestamp
- `identity_verified` - Boolean (Persona verification)
- `identity_verified_at` - Verification timestamp
- `background_check_status` - Enum: passed | not_completed | rejected
- `background_checked_at` - Background check timestamp

### Vehicles Table
- `id` - UUID primary key
- `driver_id` - Foreign key to drivers
- `make` - Vehicle make
- `model` - Vehicle model
- `year` - Vehicle year
- `vehicle_verified` - Boolean (manual review)
- `vehicle_verified_at` - Verification timestamp
- `insurance_expiration_date` - Insurance expiry date

## Development Data

The seed file creates 5 test drivers:

1. **verified.driver@example.com** - Fully verified (identity + background + vehicle)
2. **partial.driver@example.com** - Identity verified, background pending
3. **rejected.driver@example.com** - Identity verified, background rejected
4. **unverified.driver@example.com** - No verification
5. **novehicle.driver@example.com** - Identity and background verified, no vehicle

## Reset Database

To wipe and recreate the database:

```bash
# Drop and recreate database
psql postgres -c "DROP DATABASE IF EXISTS ride_marketplace_dev;"
psql postgres -c "CREATE DATABASE ride_marketplace_dev OWNER ride_dev_user;"

# Reapply schema and seed
psql -U ride_dev_user -d ride_marketplace_dev -f db/schema.sql
psql -U ride_dev_user -d ride_marketplace_dev -f db/seed.sql
```

## Useful Commands

```bash
# Connect to database
psql -U ride_dev_user -d ride_marketplace_dev

# List tables
\dt

# Describe table structure
\d drivers
\d vehicles

# View all drivers
SELECT * FROM drivers;

# View all vehicles
SELECT * FROM vehicles;

# Count verified drivers
SELECT COUNT(*) FROM drivers WHERE identity_verified = TRUE AND background_check_status = 'passed';

# Join drivers with vehicles
SELECT d.email, v.make, v.model, v.vehicle_verified
FROM drivers d
LEFT JOIN vehicles v ON d.id = v.driver_id;
```

## Safety Checks

- Database runs on `localhost:5432` only
- No cloud services required
- No production credentials
- Safe to delete and recreate at any time
- `.env` file is gitignored

## Troubleshooting

### Cannot connect to PostgreSQL
```bash
# Check if PostgreSQL is running
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Windows
# Check Services app for "postgresql" service
```

### Permission denied
```bash
# Ensure user has correct privileges
psql postgres
GRANT ALL PRIVILEGES ON DATABASE ride_marketplace_dev TO ride_dev_user;
\q
```

### Port 5432 already in use
```bash
# Check what's using port 5432
lsof -i :5432

# Or use a different port in DATABASE_URL
DATABASE_URL=postgres://ride_dev_user:devpassword@localhost:5433/ride_marketplace_dev
```
