# DryverHub - Development Chat Summary
**Last Updated:** January 4, 2026

## Project Overview
**DryverHub** is a driver-first, zero-commission ride marketplace mobile app built with React Native. Drivers set their own prices, and the platform operates as a pure marketplace with no algorithmic ranking or payment processing.

## Technology Stack
- **Framework:** React Native 0.83.1
- **Language:** TypeScript
- **Package Manager:** npm
- **Database:** PostgreSQL 15 (local development)
- **iOS Dependencies:** CocoaPods via Bundler
- **State Management:** React Context API (RoleContext, DataContext, SettingsContext)
- **Navigation:** React Navigation (Stack + Bottom Tabs + Material Top Tabs)
- **Image Handling:** react-native-image-picker
- **Storage:** AsyncStorage for app state, PostgreSQL for data persistence

## Core Architecture Principles
1. **No Ratings/Rankings:** Strictly marketplace model - no star ratings, no driver scores, no algorithmic ranking
2. **Driver-Set Pricing:** Drivers submit custom bid amounts for each trip
3. **Zero Commission:** Platform does not process payments or take commission
4. **Verification Only:** Focus on identity/background/vehicle verification, not performance metrics
5. **Local-First:** PostgreSQL local database, no cloud services yet

## Current Implementation Status

### ✅ Completed Features

#### 1. User Role System
- **File:** `/src/contexts/RoleContext.tsx`
- Dual role support (rider/driver)
- Role switching functionality
- Persistent role storage via AsyncStorage

#### 2. Driver Profile Management
- **Files:** 
  - `/src/models/index.ts` - DriverProfile interface with verification fields
  - `/src/contexts/DataContext.tsx` - Profile state management
  - `/src/screens/driver/DriverProfileScreen.tsx` - Profile editing UI
- Fields: name, email, phone, vehicle info, bio, operating areas
- Vehicle details: year, make, model, color, license plate
- Up to 3 vehicle photos supported

#### 3. Three-Tier Verification System
**Documentation:** `/docs/VERIFICATION_SYSTEM.md`

**Identity Verification (Persona API):**
- Integration placeholder: `/src/services/personaApi.ts`
- Fields tracked: `identityVerified: boolean`, `identityVerifiedAt: Date`

**Background Check (Checkr API):**
- Integration placeholder: `/src/services/checkrApi.ts`
- Driver-paid model ($40-60 per check)
- Status enum: 'passed' | 'not_completed' | 'rejected'
- Fields: `backgroundCheckStatus`, `backgroundCheckCompletedAt`

**Vehicle Verification (Manual Admin Review):**
- Screen: `/src/screens/driver/VehicleDocumentUploadScreen.tsx`
- Required documents: NC DMV registration, insurance, vehicle photos
- Fields: `vehicleVerified: boolean`, `vehicleVerifiedAt: Date`

**UI Components:**
- `/src/components/DriverVerificationBadge.tsx` - Display verification status
- `/src/screens/settings/UserSettingsScreen.tsx` - Verification integrated into settings
- Legal disclaimers: `/src/constants/verificationLegal.ts`

#### 4. Database Setup (PostgreSQL)

**Verification Schema** (`/db/schema.sql`):
```sql
-- drivers table
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
identity_verified BOOLEAN DEFAULT FALSE
identity_verified_at TIMESTAMP
background_check_status background_check_status_enum DEFAULT 'not_completed'
background_check_completed_at TIMESTAMP
vehicle_id UUID REFERENCES vehicles(id)
created_at TIMESTAMP DEFAULT NOW()

-- vehicles table
id UUID PRIMARY KEY
year INTEGER
make VARCHAR(100)
model VARCHAR(100)
color VARCHAR(50)
license_plate VARCHAR(20)
vehicle_verified BOOLEAN DEFAULT FALSE
vehicle_verified_at TIMESTAMP
insurance_expiration_date DATE
created_at TIMESTAMP DEFAULT NOW()
```

**Core Marketplace Schema** (`/db/schema_core.sql`):
```sql
-- riders table (3 test records)
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
email_verified BOOLEAN DEFAULT FALSE
phone_verified BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT NOW()

-- trips table (5 test records: 2 open, 1 accepted, 1 expired, 1 cancelled)
id UUID PRIMARY KEY
rider_id UUID REFERENCES riders(id)
pickup_address TEXT NOT NULL
dropoff_address TEXT NOT NULL
pickup_lat DECIMAL(10, 8) NOT NULL
pickup_lng DECIMAL(11, 8) NOT NULL
dropoff_lat DECIMAL(10, 8) NOT NULL
dropoff_lng DECIMAL(11, 8) NOT NULL
estimated_distance_miles DECIMAL(6, 2)
estimated_duration_minutes INTEGER
scheduled_pickup_time TIMESTAMP NOT NULL
notes TEXT
status trip_status_enum DEFAULT 'open'  -- 'open' | 'accepted' | 'cancelled' | 'expired'
created_at TIMESTAMP DEFAULT NOW()
expires_at TIMESTAMP NOT NULL

-- bids table (6 test records: 4 submitted, 1 accepted, 1 withdrawn)
id UUID PRIMARY KEY
trip_id UUID REFERENCES trips(id)
driver_id UUID NOT NULL  -- References drivers table
bid_amount DECIMAL(8, 2) NOT NULL  -- Driver-set price
message TEXT
status bid_status_enum DEFAULT 'submitted'  -- 'submitted' | 'withdrawn' | 'accepted' | 'rejected'
created_at TIMESTAMP DEFAULT NOW()

-- messages table (2 test records)
id UUID PRIMARY KEY
trip_id UUID REFERENCES trips(id)
sender_type sender_type_enum NOT NULL  -- 'rider' | 'driver'
sender_id UUID NOT NULL
message_text TEXT NOT NULL
created_at TIMESTAMP DEFAULT NOW()

-- reports table (1 test record)
id UUID PRIMARY KEY
reporter_type user_type_enum NOT NULL  -- 'rider' | 'driver'
reporter_id UUID NOT NULL
reported_type user_type_enum NOT NULL
reported_id UUID NOT NULL
trip_id UUID REFERENCES trips(id)
reason TEXT NOT NULL
created_at TIMESTAMP DEFAULT NOW()

-- admin_flags table (1 test record)
id UUID PRIMARY KEY
user_type user_type_enum NOT NULL
user_id UUID NOT NULL
note TEXT NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```

**Database Setup:**
- Automated script: `/db/setup.sh` (handles install, schema, seed data)
- Connection: `postgres://ride_dev_user:devpassword@localhost:5432/ride_marketplace_dev`
- Seed data: `/db/seed.sql` (5 drivers, 3 vehicles), `/db/seed_core.sql` (3 riders, 5 trips, 6 bids)
- Documentation: `/db/README.md`
- Environment template: `/.env.example`

#### 5. Navigation Structure
**Driver Tab Navigator** (`/src/navigation/DriverNavigator.tsx`):
- Home: Trip marketplace (view open trips, submit bids)
- My Trips: Active and past trips
- Earnings: Trip history and earnings summary (no payment processing)
- Profile: Driver profile and settings

**Rider Tab Navigator** (assumed similar structure):
- Request rides
- View active trips
- View past trips
- Settings

### 🚧 Known Issues

#### iOS Build Issue
**Error:** `bundle exec pod install` fails with exit code 5
**Context:** Last attempted in `/ios` directory
**Status:** Needs investigation

#### Android Build Issue
**Error:** `npm run android` fails with exit code 1
**Status:** Needs investigation

### 📋 Next Steps (Priority Order)

1. **Fix Build Issues**
   - Debug iOS CocoaPods installation failure
   - Debug Android build failure
   - Verify Metro bundler can start successfully

2. **Backend API Development**
   - Create Node.js/Express backend
   - Connect to PostgreSQL database
   - RESTful API endpoints for:
     - User authentication (riders/drivers)
     - Trip CRUD operations
     - Bid submission and management
     - Message exchange
     - Verification status checks
     - Report submission

3. **React Native Data Integration**
   - Replace mock data in DataContext with API calls
   - Implement trip listing screen (fetch from database)
   - Implement bid submission flow
   - Real-time trip status updates
   - Message notifications

4. **External API Integration**
   - **Persona Identity Verification:**
     - Production SDK setup
     - Webhook handler for verification results
     - Update driver verification status
   
   - **Checkr Background Checks:**
     - API key configuration
     - Payment flow (driver pays directly)
     - Webhook handler for check results
     - Status updates in database

5. **Admin Dashboard** (Web-based)
   - Vehicle verification review interface
   - View uploaded documents (DMV registration, insurance, photos)
   - Approve/reject vehicle verification
   - Review safety reports
   - Manage admin flags

6. **Geolocation Features**
   - Package installed: `@react-native-community/geolocation`
   - Implement pickup/dropoff location picker
   - Calculate distance/duration estimates
   - Display trip on map (optional, not real-time tracking)

7. **Enhanced Features**
   - Push notifications for new bids/messages
   - Trip expiration handling
   - Bid withdrawal functionality
   - Report submission UI
   - Driver operating area preferences

## Important Files Reference

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `babel.config.js` - Babel configuration
- `metro.config.js` - Metro bundler configuration
- `.env.example` - Environment variables template
- `.gitignore` - Updated to exclude `.env`

### Core App Files
- `App.tsx` - Main app component
- `index.js` - Entry point

### Source Code Structure
```
/src
  /components
    - DriverVerificationBadge.tsx
  /constants
    - verificationLegal.ts
  /contexts
    - RoleContext.tsx
    - DataContext.tsx
    - SettingsContext.tsx
  /models
    - index.ts (TypeScript interfaces)
  /navigation
    - DriverNavigator.tsx
  /screens
    /driver
      - DriverProfileScreen.tsx
      - DriverVerificationScreen.tsx
      - VehicleDocumentUploadScreen.tsx
    /settings
      - UserSettingsScreen.tsx
  /services
    - personaApi.ts
    - checkrApi.ts
```

### Database Files
```
/db
  - schema.sql (verification tables)
  - schema_core.sql (marketplace tables)
  - seed.sql (verification test data)
  - seed_core.sql (marketplace test data)
  - setup.sh (automated setup script)
  - README.md (documentation)
```

### Documentation
- `/docs/VERIFICATION_SYSTEM.md` - Complete verification system documentation
- `/db/README.md` - Database setup and usage guide
- `.github/copilot-instructions.md` - Project context for AI assistance

## Git Commit History (Recent)
1. **Vehicle Photos:** Added photo upload for up to 3 vehicle images
2. **Verification System:** Implemented three-tier verification (identity, background, vehicle)
3. **Database Setup:** PostgreSQL installation, verification schema, seed data
4. **Core Marketplace Schema:** Added riders, trips, bids, messages, reports, admin_flags tables

## Development Commands

### Start Development
```bash
npm start                    # Start Metro bundler
npm run ios                  # Run iOS app
npm run android              # Run Android app
```

### Database
```bash
./db/setup.sh               # Automated database setup
psql -U ride_dev_user -d ride_marketplace_dev  # Connect to database
```

### iOS-Specific
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

### Testing
```bash
npm test                    # Run Jest tests
npm run lint                # Run ESLint
```

## Non-Negotiable Rules

1. **NO RATINGS OR RANKINGS** - Ever. This is a marketplace, not a gig platform.
2. **NO COMMISSION** - Platform does not handle payments or take cuts.
3. **DRIVER-SET PRICING** - Drivers submit custom bid amounts for each trip.
4. **NO REAL-TIME TRACKING** - Pickup/dropoff addresses only, no GPS tracking during trip.
5. **VERIFICATION ONLY** - Status fields are binary (verified/not verified), never scored.
6. **NO ALGORITHMS** - No matching algorithms, no driver sorting, pure marketplace bidding.

## Key Context for Future Development

- All mock data in React Native app needs to be replaced with API calls
- Database is ready and populated with test data
- API integrations (Persona, Checkr) have placeholder implementations
- Vehicle verification requires admin dashboard (not built yet)
- Build issues need to be resolved before testing on devices
- Focus on marketplace functionality: riders post trips, drivers bid, riders choose

---

**To continue development:** Copy this summary into a new chat and specify which feature or issue you want to work on next.
