# DryverHub Verification System

## Overview

DryverHub implements a three-tier verification system for drivers:
1. **Identity Verification** (Persona API - automated)
2. **Criminal Background Check** (Checkr API - automated, driver-paid)
3. **Vehicle Verification** (NC DMV documents - manual review)

## Core Principles

### NON-NEGOTIABLE CONSTRAINTS

- **Marketplace Model**: Platform is NOT a transportation provider
- **Driver-Paid**: Platform does NOT pay for verification
- **Binary Only**: Pass/fail only - NO scores, rankings, or tiers
- **No Algorithmic Impact**: Verification does NOT affect bid order, visibility, or pricing
- **Neutral Display**: Status shown neutrally to riders without comparative language
- **Minimal Data Storage**: NO long-term storage of sensitive documents

## Implementation Details

### 1. Identity Verification (Persona API)

**Purpose**: Confirm driver is 18+ with valid government ID

**Flow**:
1. Backend creates Persona inquiry session via API
2. Mobile app launches Persona SDK with session token
3. Driver completes ID upload + selfie + liveness check
4. Persona webhook sends pass/fail result to backend
5. Backend updates `identity_verified` status

**Stored Data**:
- `identity_verified`: boolean
- `identity_verified_at`: timestamp  
- `persona_inquiry_id`: string

**NOT Stored**:
- ID images
- ID numbers
- Biometric data
- Risk/fraud scores

**Files**:
- `/src/services/personaApi.ts` - API integration placeholder
- `/src/screens/driver/DriverVerificationScreen.tsx` - UI to initiate

---

### 2. Background Check (Checkr API)

**Purpose**: Criminal background check (driver-paid)

**Payment Rule**: Driver pays Checkr directly - platform does NOT process payment

**Flow**:
1. Driver taps "Run Background Check"
2. Backend creates Checkr candidate via API
3. Driver completes Checkr consent/disclosure
4. Checkr runs criminal background check
5. Checkr webhook sends result to backend
6. Backend records pass/fail/rejected status

**Stored Data**:
- `background_check_status`: enum ('passed' | 'not_completed' | 'rejected')
- `background_checked_at`: timestamp
- `checkr_report_id`: string

**NOT Stored**:
- Offense details
- Criminal history records
- Report contents
- Risk scores

**Note**: "rejected" status is ADMIN-VISIBLE ONLY. Riders only see "completed" or "not completed".

**Files**:
- `/src/services/checkrApi.ts` - API integration placeholder
- `/src/screens/driver/DriverVerificationScreen.tsx` - UI to initiate

---

### 3. Vehicle Verification (NC DMV - Manual)

**Purpose**: Confirm vehicle registration and insurance validity

**Payment Rule**: Driver pays DMV fees directly - platform does NOT process payment

**Required Documents**:
- NC DMV vehicle registration (PDF/image)
- Proof of insurance (PDF/image)
- Vehicle photos (front + side)

**Flow**:
1. Driver uploads documents via app
2. Documents stored temporarily for review
3. Admin reviews documents manually
4. Admin marks `vehicle_verified` status
5. Documents deleted after review (except photos)

**Stored Data**:
- `vehicle_verified`: boolean
- `vehicle_verified_at`: timestamp
- `insurance_expiration_date`: date

**NOT Stored Long-Term**:
- VIN (beyond review window)
- Plate lookup history
- DMV response metadata

**Files**:
- `/src/screens/driver/VehicleDocumentUploadScreen.tsx` - Upload UI
- `/src/screens/driver/DriverVerificationScreen.tsx` - Links to upload

---

## Database Schema

### DriverProfile Model

```typescript
export interface DriverProfile {
  userId: string;
  completedRidesCount: number;
  
  // Identity verification (Persona)
  identityVerified: boolean;
  identityVerifiedAt?: Date;
  personaInquiryId?: string;
  
  // Background check (Checkr)
  backgroundCheckStatus: 'passed' | 'not_completed' | 'rejected';
  backgroundCheckedAt?: Date;
  checkrReportId?: string;
  
  // Vehicle verification (manual)
  vehicleVerified: boolean;
  vehicleVerifiedAt?: Date;
  insuranceExpirationDate?: Date;
  
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    photos: string[];
  };
}
```

---

## Combined Verification Logic

A driver is considered **FULLY VERIFIED** when:

```typescript
identityVerified === true
AND backgroundCheckStatus === 'passed'
AND vehicleVerified === true
```

No partial verification, no weighting, no scoring.

---

## Display Rules

### Riders May See (Neutral Text Only):
- "Identity verified"
- "Criminal background check completed"  
- "Vehicle verified"

### Riders Must NOT See:
- Verification dates
- Comparative wording ("safer", "trusted", "recommended")
- Badges/colors implying rank or quality

### Admins May See:
- Verification timestamps
- Checkr webhook status
- Vehicle document upload state
- Manual review history

**Component**: `/src/components/DriverVerificationBadge.tsx`

---

## Legal Requirements

The following disclaimer MUST appear in Terms and onboarding:

> "Verification confirms submitted documents only. It does not guarantee safety or driving quality. Drivers are independent operators. The platform does not conduct or pay for background checks or vehicle record requests."

**File**: `/src/constants/verificationLegal.ts`

---

## Explicitly FORBIDDEN

DO NOT IMPLEMENT:
- ❌ Ratings or reviews
- ❌ Scores or trust levels
- ❌ Driver tiers or levels
- ❌ Visibility boosts
- ❌ Acceptance nudges
- ❌ Payment handling for verification
- ❌ Automated penalties
- ❌ Any use of verification to influence bids

---

## Navigation

**Driver Tab Navigator**: Available Rides | **Verification** | Profile | Settings

**Verification Stack**:
- `VerificationMain` - Overview with 3 verification cards
- `VehicleDocumentUpload` - Upload NC DMV docs and photos

---

## Backend TODO

1. **Persona API Integration**:
   - Endpoint: `POST /api/verification/identity/start`
   - Create inquiry session, return token
   - Webhook: `POST /api/webhooks/persona`
   - Update `identity_verified` on pass

2. **Checkr API Integration**:
   - Endpoint: `POST /api/verification/background/start`
   - Create candidate, return consent URL
   - Webhook: `POST /api/webhooks/checkr`
   - Update `background_check_status` on clear/consider

3. **Vehicle Document Storage**:
   - Endpoint: `POST /api/verification/vehicle/upload`
   - Accept multipart file uploads
   - Store temporarily for admin review
   - Delete after verification complete

4. **Admin Review Panel**:
   - View pending vehicle verifications
   - Display uploaded documents
   - Approve/reject with notes
   - Update `vehicle_verified` status

---

## Testing Checklist

- [ ] Driver can access Verification tab
- [ ] Identity verification shows "Coming Soon" placeholder
- [ ] Background check shows "Coming Soon" placeholder
- [ ] Vehicle verification navigates to upload screen
- [ ] Upload screen accepts registration document
- [ ] Upload screen accepts insurance document
- [ ] Upload screen accepts 2 vehicle photos
- [ ] Insurance expiration date input works
- [ ] Submit button validates all fields
- [ ] Success message shows after submission
- [ ] Verification status displays correctly on cards
- [ ] Fully verified banner shows when all 3 complete
- [ ] Legal disclaimers display correctly

---

## Production Deployment Checklist

- [ ] Persona API credentials configured
- [ ] Checkr API credentials configured
- [ ] Webhook endpoints secured with signatures
- [ ] Document storage configured (S3/similar)
- [ ] Admin panel implemented
- [ ] Legal terms updated with verification policy
- [ ] Onboarding flow includes verification disclaimer
- [ ] Rider UI shows verification badges
- [ ] Database migration adds verification fields
- [ ] Analytics tracking for verification funnel

---

## Files Reference

### Models
- `/src/models/index.ts` - DriverProfile with verification fields

### Screens
- `/src/screens/driver/DriverVerificationScreen.tsx` - Main verification UI
- `/src/screens/driver/VehicleDocumentUploadScreen.tsx` - Document upload

### Components
- `/src/components/DriverVerificationBadge.tsx` - Display for riders

### Services
- `/src/services/personaApi.ts` - Persona integration (placeholder)
- `/src/services/checkrApi.ts` - Checkr integration (placeholder)

### Constants
- `/src/constants/verificationLegal.ts` - Legal disclaimers

### Navigation
- `/src/navigation/DriverNavigator.tsx` - Added Verification tab

### Contexts
- `/src/contexts/DataContext.tsx` - Initialized verification fields

---

## Support

For questions about verification implementation, refer to the original instruction document or contact the development team.

**Last Updated**: January 4, 2026
