import React, { useState } from 'react';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { Alert } from 'react-native';

/**
 * Auth Navigator
 * Manages the authentication flow:
 * 1. Role selection (rider or driver)
 * 2. Login or Sign Up
 * 
 * RULES:
 * - Role is chosen explicitly before auth
 * - No automatic role detection
 * - Clean flow with no dark patterns
 */

type AuthScreen = 'role-selection' | 'signup' | 'login' | 'forgot-password';

export const AuthNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('role-selection');
  const [selectedRole, setSelectedRole] = useState<'rider' | 'driver' | null>(null);

  const handleSelectRole = (role: 'rider' | 'driver') => {
    setSelectedRole(role);
    setCurrentScreen('signup');
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setCurrentScreen('role-selection');
  };

  const handleSwitchToLogin = () => {
    setCurrentScreen('login');
  };

  const handleSwitchToSignUp = () => {
    setCurrentScreen('signup');
  };

  const handleForgotPassword = () => {
    // Simple forgot password flow for MVP
    Alert.alert(
      'Reset Password',
      'Password reset functionality coming soon. Please contact support if you need help accessing your account.',
      [{ text: 'OK' }]
    );
    // TODO: Implement password reset screen
    // setCurrentScreen('forgot-password');
  };

  // Show role selection first
  if (!selectedRole || currentScreen === 'role-selection') {
    return <RoleSelectionScreen onSelectRole={handleSelectRole} />;
  }

  // Show signup or login based on current screen
  if (currentScreen === 'signup') {
    return (
      <SignUpScreen
        role={selectedRole}
        onBack={handleBackToRoleSelection}
        onSwitchToLogin={handleSwitchToLogin}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <LoginScreen
        role={selectedRole}
        onBack={handleBackToRoleSelection}
        onSwitchToSignUp={handleSwitchToSignUp}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  // Default to role selection
  return <RoleSelectionScreen onSelectRole={handleSelectRole} />;
};
