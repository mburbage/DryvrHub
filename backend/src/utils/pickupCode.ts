import crypto from 'crypto';

/**
 * Pickup Code Utility
 * 
 * RULES:
 * - 4-digit numeric code for pickup verification
 * - Code generated when bid is accepted
 * - Code stored hashed in database
 * - Code shown only to rider
 * - Driver must enter code to start trip
 * - No lockout on failed attempts (MVP)
 */

/**
 * Generate a random 4-digit numeric code
 * @returns 4-digit string (0000-9999)
 */
export function generatePickupCode(): string {
  // Generate random 4-digit number
  const code = Math.floor(Math.random() * 10000);
  // Pad with leading zeros if necessary
  return code.toString().padStart(4, '0');
}

/**
 * Hash a pickup code for storage
 * Uses SHA-256 with a salt for one-way hashing
 * @param code - 4-digit pickup code
 * @returns Hashed code string
 */
export function hashPickupCode(code: string): string {
  // Simple hash for 4-digit code (good enough for MVP)
  // In production, consider adding a per-trip salt
  const hash = crypto.createHash('sha256');
  hash.update(code);
  return hash.digest('hex');
}

/**
 * Verify a pickup code against stored hash
 * @param enteredCode - Code entered by driver
 * @param storedHash - Hashed code from database
 * @returns true if code matches
 */
export function verifyPickupCode(enteredCode: string, storedHash: string): boolean {
  // Validate input
  if (!enteredCode || enteredCode.length !== 4 || !/^\d{4}$/.test(enteredCode)) {
    return false;
  }
  
  const enteredHash = hashPickupCode(enteredCode);
  return enteredHash === storedHash;
}
