import {RideStatus, RIDE_STATE_TRANSITIONS} from '../models';

/**
 * Explicit ride state machine
 * All transitions are manual and validated
 * NO automatic state changes based on tracking or time (except expiry)
 */

export class InvalidStateTransitionError extends Error {
  constructor(from: RideStatus, to: RideStatus) {
    super(`Invalid ride state transition: ${from} -> ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Check if a state transition is valid
 */
export function canTransitionTo(
  currentStatus: RideStatus,
  newStatus: RideStatus,
): boolean {
  const allowedTransitions = RIDE_STATE_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Validate a state transition, throw if invalid
 */
export function validateStateTransition(
  currentStatus: RideStatus,
  newStatus: RideStatus,
): void {
  if (!canTransitionTo(currentStatus, newStatus)) {
    throw new InvalidStateTransitionError(currentStatus, newStatus);
  }
}

/**
 * Transition helpers - explicit actions only
 */

export function canAcceptRide(status: RideStatus): boolean {
  return status === 'OPEN';
}

export function canCompleteRide(status: RideStatus): boolean {
  return status === 'ACCEPTED';
}

export function isTerminalState(status: RideStatus): boolean {
  return status === 'COMPLETED' || status === 'EXPIRED';
}

export function shouldExpireRide(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
