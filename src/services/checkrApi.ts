/**
 * CHECKR API INTEGRATION
 * 
 * PURPOSE: Criminal background check for drivers (driver-paid)
 * 
 * PAYMENT RULE:
 * - Platform does NOT pay for Checkr
 * - Driver pays any applicable fee directly
 * - Platform does NOT process payment
 * 
 * IMPLEMENTATION NOTES:
 * - Backend creates Checkr candidate
 * - Driver completes consent/disclosure flow
 * - Checkr webhook sends pass/fail result
 * - Only store: report_id, status enum, timestamp
 * 
 * DO NOT STORE:
 * - Offense details
 * - Criminal history records
 * - Report contents
 * - Risk scores
 * - Adjudication details
 */

export interface CheckrCandidate {
  candidateId: string;
  consentUrl: string;
}

export interface CheckrWebhookPayload {
  reportId: string;
  status: 'clear' | 'consider';
  completedAt: string;
}

/**
 * Create a new Checkr candidate and initiate background check
 * Backend endpoint: POST /api/verification/background/start
 */
export const createCheckrCandidate = async (
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  dob: string
): Promise<CheckrCandidate> => {
  // TODO: Implement backend API call
  // const response = await fetch(`${API_BASE_URL}/api/verification/background/start`, {
  //   method: 'POST',
  //   headers: {'Content-Type': 'application/json'},
  //   body: JSON.stringify({userId, firstName, lastName, email, dob}),
  // });
  // return await response.json();
  
  throw new Error('Checkr API integration not yet implemented');
};

/**
 * Handle Checkr webhook callback
 * Backend endpoint: POST /api/webhooks/checkr
 * 
 * Webhook logic:
 * IF result == "clear":
 *   background_check_status = "passed"
 *   background_checked_at = now()
 * ELSE:
 *   background_check_status = "rejected"
 *   background_checked_at = now()
 * 
 * NOTE: "rejected" is admin-visible only
 * Riders only see "completed" or "not completed"
 */
export const handleCheckrWebhook = async (
  payload: CheckrWebhookPayload
): Promise<void> => {
  // Backend implementation only
  // This function is for documentation purposes
  throw new Error('Webhook handling is backend-only');
};
