/**
 * Settings Types
 * Single app, role-aware settings
 * NO rankings, NO scores, NO behavioral optimization
 */

export type DarkMode = 'system' | 'light' | 'dark';
export type Language = 'en'; // Extensible for future languages

/**
 * App Settings - Global for all users regardless of role
 */
export interface AppSettings {
  pushNotificationsEnabled: boolean;
  darkMode: DarkMode;
  language: Language;
}

/**
 * User Settings - Role-aware preferences
 * Visible sections depend on user's current role(s)
 */
export interface UserSettings {
  // Rider-specific (visible only when RIDER role active)
  rider: {
    defaultPickupLocation: string; // For form pre-fill only
    defaultRideNotes: string; // For form pre-fill only
  };
  
  // Driver-specific (visible only when DRIVER role active)
  driver: {
    biddingEnabled: boolean; // Manual toggle, no auto tracking
    defaultBidNote: string; // For form pre-fill only
    notifyOnNewRides: boolean; // Push notification preference
    deadheadMileRate: number; // Rate per mile for deadhead (empty) miles
    tripMileRate: number; // Rate per mile for trip miles with passenger
    acceptedPaymentTypes: string[]; // Payment types driver accepts (Cash, Apple Pay, Card, Venmo, etc.)
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  pushNotificationsEnabled: true,
  darkMode: 'system',
  language: 'en',
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  rider: {
    defaultPickupLocation: '',
    defaultRideNotes: '',
  },
  driver: {
    biddingEnabled: true,
    defaultBidNote: '',
    notifyOnNewRides: true,
    deadheadMileRate: 0,
    tripMileRate: 0,
    acceptedPaymentTypes: ['Cash', 'Apple Pay', 'Card', 'Venmo'],
  },
};
