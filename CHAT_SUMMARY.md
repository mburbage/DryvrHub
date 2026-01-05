# DryverHub - Development Chat Summary
**Last Updated:** January 4, 2026 (Evening - Payment Flow Updated: Payment After Code Verification)

## Project Overview
**DryverHub** is a driver-first, zero-commission ride marketplace mobile app built with React Native. Drivers set their own prices, and the platform operates as a pure marketplace with no algorithmic ranking or payment processing.

## Technology Stack
- **Framework:** React Native 0.83.1
- **Language:** TypeScript
- **Package Manager:** npm
- **Backend:** Node.js/Express with TypeScript (port 3000)
- **Database:** PostgreSQL 15 (local development - `ride_marketplace_dev`)
- **Authentication:** JWT tokens (7-day expiry), bcrypt password hashing
- **iOS Dependencies:** CocoaPods via Bundler
- **State Management:** React Context API (AuthContext, DataContext, SettingsContext)
- **Navigation:** React Navigation (Stack + Bottom Tabs + Material Top Tabs)
- **Image Handling:** react-native-image-picker
- **Storage:** AsyncStorage for JWT tokens, PostgreSQL for data persistence
- **Security:** SHA-256 hashing for pickup codes, bcrypt for passwords

## Core Architecture Principles
1. **No Ratings/Rankings:** Strictly marketplace model - no star ratings, no driver scores, no algorithmic ranking
2. **Driver-Set Pricing:** Drivers submit custom bid amounts for each trip
3. **Zero Commission:** Platform does not process payments or take commission
4. **Verification Only:** Focus on identity/background/vehicle verification, not performance metrics
5. **Marketplace Neutrality:** Platform does NOT rank or recommend drivers - all bids displayed equally with neutral chronological ordering
6. **Local-First:** PostgreSQL local database, no cloud services yet

## Current Implementation Status

### ✅ Completed Features

#### 1. Authentication System
- **Backend:** `/backend/src/services/authService.ts` - JWT-based auth with bcrypt hashing
- **Middleware:** `/backend/src/middleware/auth.ts` - authenticate, requireRole, requireEmailVerified
- **Routes:** `/backend/src/routes/auth.ts` - signup, login, logout, verify-email, password-reset
- **Frontend:** 
  - `/src/contexts/AuthContext.tsx` - Auth state management with AsyncStorage token persistence
  - `/src/screens/auth/RoleSelectionScreen.tsx` - Choose driver or rider role
  - `/src/screens/auth/SignUpScreen.tsx` - Email/password signup
  - `/src/screens/auth/LoginScreen.tsx` - Email/password login
  - `/src/navigation/AuthNavigator.tsx` - Auth flow orchestration
- **Features:**
  - JWT tokens with 7-day expiry
  - Separate driver/rider accounts (no role switching)
  - Email verification tokens (single-use)
  - Password reset functionality
  - Logout with token cleanup
- **Test Accounts:**
  - Driver: `testdriver1@example.com` / `password123`
  - Rider: `testrider@example.com` / `password123`

#### 2. Neutral Rider Bid Viewing System
- **Backend:** `/backend/src/routes/trips.ts`
  - `GET /api/trips/:id/bids` - Returns ALL bids ordered by `created_at ASC` (oldest first)
  - `POST /api/trips/:id/accept-bid` - Transaction-based acceptance, rejects other bids
  - Neutral driver context: account_age_days, completed_trip_count, verification booleans only
- **Frontend:** `/src/screens/rider/ViewBidsScreen.tsx`
  - Displays all bids with identical card styling
  - No price highlighting or bid ranking
  - Neutral verification indicators (✓ Identity Verified, ✓ Background Check, ✓ Vehicle Verified)
  - Explicit acceptance confirmation via Alert
  - No sorting controls or algorithmic influence
- **Rules Enforced:**
  - Platform does NOT rank or recommend drivers
  - All bids displayed equally with same styling
  - Rider makes explicit, manual decision
  - No scoring, filtering, or behavioral analysis

#### 3. User Role System (Legacy - Being Phased Out)
- **File:** `/src/contexts/RoleContext.tsx`
- Note: Role switching removed from profile screens - users now have separate authenticated accounts

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
-- riders table
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password_hash TEXT NOT NULL
email_verified BOOLEAN DEFAULT FALSE
verification_token TEXT
verification_expires_at TIMESTAMP
phone_verified BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT NOW()

-- trips table
id UUID PRIMARY KEY
rider_id UUID REFERENCES riders(id)
pickup_address TEXT NOT NULL
dropoff_address TEXT NOT NULL
pickup_lat DECIMAL(10, 8)
pickup_lng DECIMAL(11, 8)
dropoff_lat DECIMAL(10, 8)
dropoff_lng DECIMAL(11, 8)
estimated_distance_miles DECIMAL(6, 2)
estimated_duration_minutes INTEGER
scheduled_pickup_time TIMESTAMP
notes TEXT
status trip_status_enum DEFAULT 'open'
  -- States: 'open' | 'payment_due' | 'accepted' | 'en_route' | 'arrived' | 
  --         'in_progress' | 'paid' | 'cancelled' | 'expired'
created_at TIMESTAMP DEFAULT NOW()
expires_at TIMESTAMP NOT NULL
-- Trip execution timestamps
en_route_at TIMESTAMP
arrived_at TIMESTAMP
pickup_at TIMESTAMP
completed_at TIMESTAMP
-- Payment tracking
payment_due_at TIMESTAMP
paid_at TIMESTAMP
final_amount DECIMAL(10, 2)
-- Pickup verification
pickup_code_hash TEXT
-- Cancellation tracking
cancelled_by TEXT
cancelled_at TIMESTAMP

-- bids table
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
- **Auth Fields Added:** `password_hash`, `email_verified`, `verification_token`, `reset_token`, `reset_token_expires`

#### 5. Backend API Server
- **Status:** ✅ Running on `http://localhost:3000`
- **Structure:**
  - `/backend/src/index.ts` - Express server setup with CORS
  - `/backend/src/config/database.ts` - PostgreSQL connection pool
  - `/backend/src/services/authService.ts` - Auth logic with JWT/bcrypt
  - `/backend/src/middleware/auth.ts` - authenticate, requireRole, requireEmailVerified
  - `/backend/src/routes/auth.ts` - Authentication endpoints
  - `/backend/src/routes/trips.ts` - Trip and state management
  - `/backend/src/routes/bids.ts` - Bid submission (requires email verification)
  - `/backend/src/utils/pickupCode.ts` - 4-digit code generation, hashing, verification

**Trip Management Endpoints:**
- ✅ POST `/api/trips` - Create new trip (riders only)
- ✅ GET `/api/trips` - List all trips with filters
- ✅ GET `/api/trips/:id` - Get single trip details
- ✅ GET `/api/trips/:id/bids` - View all bids (neutral chronological order)
- ✅ POST `/api/trips/:id/accept-bid` - Accept bid → payment_due status + pickup code
- ✅ POST `/api/trips/:id/cancel` - Cancel trip (rider/driver authorization)
- ✅ POST `/api/trips/:id/confirm-payment` - Rider confirms payment → accepted status

**Trip Execution Endpoints (Driver):**
- ✅ POST `/api/trips/:id/start-en-route` - Driver heading to pickup
- ✅ POST `/api/trips/:id/arrived` - Driver at pickup location
- ✅ POST `/api/trips/:id/verify-pickup` - Validate code (non-state-changing)
- ✅ POST `/api/trips/:id/start-trip` - Driver enters code → code_verified status (awaits rider payment)
- ✅ POST `/api/trips/:id/complete` - Driver marks trip finished → completed status

**Trip Payment Endpoints (Rider):**
- ✅ POST `/api/trips/:id/confirm-payment` - Rider confirms payment after code verification → in_progress
- ✅ POST `/api/trips/:id/confirm-completion` - Rider confirms successful completion → rider_confirmed (final)

**Authentication Endpoints:**
- ✅ POST `/api/auth/signup` - Create account (driver/rider)
- ✅ POST `/api/auth/login` - Email/password authentication
- ✅ POST `/api/auth/logout` - Client-side token deletion
- ✅ GET `/api/auth/verify-email/:token` - Email verification
- ✅ POST `/api/auth/reset-password` - Password reset flow

#### 6. Navigation Structure
**Driver Tab Navigator** (`/src/navigation/DriverNavigator.tsx`):
- Home: Trip marketplace (view open trips, submit bids)
- My Trips: Active and past trips
#### 6. Trip Execution Flow (Rider-Protected Payment Model)

**State Machine:** Linear progression enforced server-side
```
1. Bid Accepted → accepted (pickup code generated)
2. Driver En Route → en_route
3. Driver Arrived → arrived
4. Code Verified → code_verified (driver verified presence, awaiting rider payment)
5. Payment Confirmed → in_progress (rider confirms payment AFTER seeing driver)
6. Driver Completes → completed (awaiting rider confirmation)
7. Rider Confirms → rider_confirmed (final status)
```

**Pickup Code Security:**
- 4-digit numeric code (0000-9999)
- SHA-256 hashed storage in database
- Generated on bid acceptance, shown to rider only
- Driver must enter correct code to verify pickup
- Code verification sets `code_verified` status - trip does NOT start yet
- No lockout on failed attempts (MVP)

**Payment Flow (Rider Protection):**
- Payment occurs AFTER driver verifies pickup code
- Rider receives notification when driver enters correct code
- Rider confirms payment only after physically seeing the driver
- Payment confirmation starts the trip (`in_progress` status)
- Cannot cancel once trip is `in_progress`, `completed`, or `rider_confirmed`

**Completion Verification (Two-Step Process):**
- **Step 1 (Driver):** Driver calls `/complete` → status changes to `completed`
  - Sets `completed_at` timestamp
  - Rider receives notification to verify completion
- **Step 2 (Rider):** Rider calls `/confirm-completion` → status changes to `rider_confirmed`
  - Sets `rider_confirmed_at` timestamp
  - Trip finalized, cannot be disputed
  - Provides accountability for both parties

**Timestamp Tracking:**
- `en_route_at` - Driver heading to pickup
- `arrived_at` - Driver at pickup location  
- `pickup_at` - Driver entered correct pickup code (code_verified status)
- `paid_at` - Rider confirmed payment (in_progress status)
- `completed_at` - Driver marked trip finished
- `rider_confirmed_at` - Rider verified successful completion

**Authorization Rules:**
- Riders: can cancel own trips (except in_progress/completed/rider_confirmed), must confirm payment and completion
- Drivers: can cancel accepted trips, execute state transitions, verify pickup, mark as completed
- All state changes require proper status validation
- No skipping steps in the state machine
- No skipping steps in the state machine

#### 7. Navigation Structure
**Driver Tab Navigator** (`/src/navigation/DriverNavigator.tsx`):
- Home: Trip marketplace (view open trips, submit bids)
- Earnings: Trip history and earnings summary (no payment processing)
- Profile: Driver profile and settings

**Rider Tab Navigator** (`/src/navigation/RiderNavigator.tsx`):
- Ride Board: View open trips and bids
- Post Ride: Create new trip request
- View Bids: See all bids with neutral display
- Profile: Rider profile and settings

### 🚧 Known Issues

None currently - iOS/Android build issues resolved, backend server running successfully, trip execution flow fully implemented and tested.

### 📋 Next Steps (Priority Order)

1. **Mobile UI for Trip Execution**
   - Driver screen: action buttons for each state transition
   - Rider screen: display pickup code, payment notice, trip status
   - Real-time status updates via polling or websockets
   - Payment confirmation UI with amount display
   - Pickup code entry interface for drivers

2. **React Native Data Integration**
   - Replace mock data in DataContext with API calls
   - Implement driver bid submission flow
   - Connect remaining screens to backend
   - Trip status polling/updates

3. **External API Integration**
   - **Persona Identity Verification:**
     - Production SDK setup
     - Webhook handler for verification results
     - Update driver verification status
   
   - **Checkr Background Checks:**
     - API key configuration
     - Payment flow (driver pays directly)
     - Webhook handler for check results
     - Status updates in database

4. **Admin Dashboard** (Web-based)
   - Vehicle verification review interface
   - View uploaded documents (DMV registration, insurance, photos)
   - Approve/reject vehicle verification
   - Review safety reports
   - Manage admin flags

5. **Geolocation Features**
   - Package installed: `@react-native-community/geolocation`
   - Implement pickup/dropoff location picker
   - Calculate distance/duration estimates
   - Display trip on map (optional, not real-time tracking)

6. **Enhanced Features**
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
1. **Authentication System:** JWT-based auth with email/password, signup/login screens, AuthContext
2. **Neutral Bid Viewing:** GET/POST endpoints with chronological ordering, ViewBidsScreen with identical card styling
3. **Remove Role Switching:** Removed switch buttons from profile screens - users now have separate driver/rider accounts
4. **Vehicle Photos:** Added photo upload for up to 3 vehicle images
5. **Verification System:** Implemented three-tier verification (identity, background, vehicle)
6. **Database Setup:** PostgreSQL installation, verification schema, seed data
7. **Core Marketplace Schema:** Added riders, trips, bids, messages, reports, admin_flags tables

## Development Commands

### Backend Server
```bash
cd backend
npm run dev                  # Start backend server (port 3000)
npm run build                # Build TypeScript to JavaScript
```

### React Native App
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

# Backend API testing with curl
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"rider"}'
```

## Test Accounts
- **Driver:** `testdriver1@example.com` / `password123`
- **Rider:** `testrider@example.com` / `password123`

## Non-Negotiable Rules

1. **NO RATINGS OR RANKINGS** - Ever. This is a marketplace, not a gig platform.
2. **MARKETPLACE NEUTRALITY** - Platform does NOT rank or recommend drivers. All bids displayed equally.
3. **NO COMMISSION** - Platform does not handle payments or take cuts.
4. **DRIVER-SET PRICING** - Drivers submit custom bid amounts for each trip.
5. **NO REAL-TIME TRACKING** - Pickup/dropoff addresses only, no GPS tracking during trip.
6. **VERIFICATION ONLY** - Status fields are binary (verified/not verified), never scored.
7. **NO ALGORITHMS** - No matching algorithms, no driver sorting, pure marketplace bidding with neutral chronological ordering.
8. **EXPLICIT SELECTION** - Riders make manual, explicit decisions. No auto-accept, no nudging.

## Key Context for Future Development

- All mock data in React Native app needs to be replaced with API calls
- Database is ready and populated with test data
- API integrations (Persona, Checkr) have placeholder implementations
- Vehicle verification requires admin dashboard (not built yet)
- Build issues need to be resolved before testing on devices
- Focus on marketplace functionality: riders post trips, drivers bid, riders choose

---

**To continue development:** Copy this summary into a new chat and specify which feature or issue you want to work on next.
