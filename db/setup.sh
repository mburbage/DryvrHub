#!/bin/bash
# ================================================================
# DRYVERHUB LOCAL DATABASE SETUP SCRIPT
# Installs PostgreSQL and sets up local development database
# ================================================================

set -e  # Exit on any error

echo "================================================================"
echo "DryverHub Local Database Setup"
echo "================================================================"
echo ""

# Check if PostgreSQL is already installed
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL is already installed"
    psql --version
else
    echo "Installing PostgreSQL..."
    
    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Installing via Homebrew..."
            brew install postgresql@15
            brew services start postgresql@15
            echo "✓ PostgreSQL installed and started"
        else
            echo "Error: Homebrew not found. Please install Homebrew first:"
            echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Installing via apt..."
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        echo "✓ PostgreSQL installed and started"
    else
        echo "Error: Unsupported OS. Please install PostgreSQL manually."
        exit 1
    fi
fi

echo ""
echo "================================================================"
echo "Creating Database and User"
echo "================================================================"
echo ""

# Set PATH to include PostgreSQL
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"

# Create user and database
psql postgres <<EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'ride_dev_user') THEN
        CREATE USER ride_dev_user WITH PASSWORD 'devpassword';
    END IF;
END
\$\$;

-- Drop and recreate database for clean setup
DROP DATABASE IF EXISTS ride_marketplace_dev;
CREATE DATABASE ride_marketplace_dev OWNER ride_dev_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ride_marketplace_dev TO ride_dev_user;
EOF

echo "✓ Database 'ride_marketplace_dev' created"
echo "✓ User 'ride_dev_user' created"

echo ""
echo "================================================================"
echo "Applying Schemas"
echo "================================================================"
echo ""

# Apply verification schema
echo "Applying verification schema (drivers, vehicles)..."
psql -U ride_dev_user -d ride_marketplace_dev -f db/schema.sql
echo "✓ Verification schema applied"

# Apply core marketplace schema
echo "Applying core marketplace schema (riders, trips, bids, messages, reports, admin_flags)..."
psql -U ride_dev_user -d ride_marketplace_dev -f db/schema_core.sql
echo "✓ Core marketplace schema applied"

echo ""
echo "================================================================"
echo "Seeding Development Data"
echo "================================================================"
echo ""

# Seed verification data
echo "Seeding verification data..."
psql -U ride_dev_user -d ride_marketplace_dev -f db/seed.sql
echo "✓ Verification seed data loaded"

# Seed core marketplace data
echo "Seeding core marketplace data..."
psql -U ride_dev_user -d ride_marketplace_dev -f db/seed_core.sql
echo "✓ Core marketplace seed data loaded"

echo ""
echo "================================================================"
echo "Setup Complete!"
echo "================================================================"
echo ""
echo "Database: ride_marketplace_dev"
echo "User:     ride_dev_user"
echo "Host:     localhost"
echo "Port:     5432"
echo ""
echo "Connection string:"
echo "postgres://ride_dev_user:devpassword@localhost:5432/ride_marketplace_dev"
echo ""
echo "To connect:"
echo "  psql -U ride_dev_user -d ride_marketplace_dev"
echo ""
echo "To view data:"
echo "  psql -U ride_dev_user -d ride_marketplace_dev -c 'SELECT * FROM drivers;'"
echo ""
echo "================================================================"
