/**
 * DRYVERHUB VERIFICATION TERMS & LEGAL COPY
 * 
 * The following text MUST appear in Terms of Service and onboarding flows
 * per the verification implementation requirements.
 */

export const VERIFICATION_LEGAL_DISCLAIMER = `
VERIFICATION POLICY

Verification confirms submitted documents only. It does not guarantee safety or driving quality.

Drivers are independent operators. DryverHub is a marketplace platform that connects riders with independent drivers.

The platform does not conduct or pay for background checks or vehicle record requests. All verification costs are paid directly by the driver to the respective verification service providers (Persona for identity verification, Checkr for background checks, and NC DMV for vehicle registration).

Verification status is displayed for informational purposes only and does not:
• Affect bid order, visibility, or pricing
• Guarantee driver safety or quality
• Create any warranty or representation about driver conduct
• Establish an employment relationship between drivers and DryverHub

VERIFICATION TYPES:

1. IDENTITY VERIFICATION
   • Confirms driver is 18 or older
   • Confirms government-issued ID validity
   • Does not store ID images or biometric data
   • Managed by Persona API

2. BACKGROUND CHECK
   • Criminal background check only
   • Pass/fail result only
   • Driver pays applicable fees directly to Checkr
   • Does not include driving record
   • Managed by Checkr API

3. VEHICLE VERIFICATION
   • Confirms NC DMV registration validity
   • Confirms current insurance coverage
   • Manual review of submitted documents
   • Driver responsible for all DMV fees
   • VIN not stored after verification

LIMITATIONS:

Verification does not include:
• Driving record checks
• Vehicle safety inspections
• Continuous monitoring
• Real-time updates
• Performance ratings or scores

RIDER ACKNOWLEDGMENT:

By using DryverHub, riders acknowledge that:
• Verification is informational only
• Platform does not guarantee driver safety
• Riders assume all risk when accepting rides
• Independent contractor relationship between riders and drivers
• Platform is not liable for driver conduct

DRIVER ACKNOWLEDGMENT:

By completing verification, drivers acknowledge that:
• All verification costs are their responsibility
• Verification does not guarantee ride requests
• Verification status does not affect platform algorithms
• Platform may review or revoke verification at any time
• False information may result in account termination

Last Updated: January 4, 2026
`;

export const VERIFICATION_ONBOARDING_DISCLAIMER = `
Before you begin verification, please note:

• You will pay all verification fees directly
• The platform does not process these payments
• Verification confirms documents only
• It does not guarantee rides or affect your visibility
• All verifications are pass/fail only
`;

export const VERIFICATION_RIDER_DISCLAIMER = `
Verification Status Information:

• "Identity verified" - Driver completed ID and age verification
• "Background check completed" - Driver passed criminal background check
• "Vehicle verified" - Vehicle registration and insurance confirmed

Important: Verification confirms documents only. It does not guarantee safety, driving quality, or vehicle condition. Drivers are independent operators. You assume all risk when accepting a ride.
`;
