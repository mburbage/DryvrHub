import { Router } from 'express';
import { AuthService } from '../services/authService';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
const authService = new AuthService(pool);

/**
 * POST /api/auth/signup
 * Create new account (rider or driver)
 * 
 * RULES:
 * - Role is chosen at signup
 * - Role is stored explicitly
 * - Email verification is sent but not required for login
 * - NO automatic role detection
 * - NO social login required (MVP uses email/password)
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (role !== 'rider' && role !== 'driver') {
      return res.status(400).json({ error: 'Role must be either "rider" or "driver"' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create account
    const result = await authService.signup({ email, password, role });

    // TODO: Send verification email
    // In production, this would send an email with a link like:
    // https://dryvrhub.com/verify-email?token={verificationToken}&role={role}
    // For now, return token in response for development

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
      },
      token: result.token,
      // DEV ONLY: Remove in production
      verificationToken: result.verificationToken,
    });
  } catch (error: any) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 * 
 * RULES:
 * - Do NOT block login for incomplete verification
 * - Do NOT block login for missing background checks
 * - Verification gates FEATURES, not login
 * - Return token regardless of verification status
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (role !== 'rider' && role !== 'driver') {
      return res.status(400).json({ error: 'Role must be either "rider" or "driver"' });
    }

    // Login
    const result = await authService.login(email, password, role);

    res.json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
      },
      token: result.token,
    });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (invalidate token on client)
 * 
 * RULES:
 * - No warnings
 * - No retention nudges
 * - No exit friction
 * 
 * NOTE: With JWT, logout is client-side (delete token)
 * Server cannot invalidate JWTs without a blacklist (not implemented in MVP)
 */
router.post('/logout', authenticate, (req, res) => {
  // With JWT, logout is handled client-side
  // Client should delete the token from storage
  res.json({ message: 'Logout successful' });
});

/**
 * GET /api/auth/verify-email/:token
 * Verify email address
 * 
 * RULES:
 * - Token is single-use
 * - Token expires
 * - No public indicator beyond "email verified"
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { role } = req.query;

    if (!role || (role !== 'rider' && role !== 'driver')) {
      return res.status(400).json({ error: 'Valid role query parameter required' });
    }

    const user = await authService.verifyEmail(token, role as 'rider' | 'driver');

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('already verified')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (role !== 'rider' && role !== 'driver') {
      return res.status(400).json({ error: 'Role must be either "rider" or "driver"' });
    }

    const verificationToken = await authService.resendVerificationEmail(email, role);

    if (!verificationToken) {
      // Don't reveal if email exists
      return res.json({ message: 'If that email is registered, a verification email has been sent' });
    }

    // TODO: Send verification email
    // For now, return token in response for development

    res.json({
      message: 'Verification email sent',
      // DEV ONLY: Remove in production
      verificationToken,
    });
  } catch (error: any) {
    if (error.message === 'Email already verified') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

/**
 * POST /api/auth/request-password-reset
 * Request password reset
 * 
 * RULES:
 * - No indication whether email exists
 */
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (role !== 'rider' && role !== 'driver') {
      return res.status(400).json({ error: 'Role must be either "rider" or "driver"' });
    }

    const resetToken = await authService.requestPasswordReset(email, role);

    // Don't reveal if email exists
    // TODO: Send password reset email if token exists
    // For now, return token in response for development

    res.json({
      message: 'If that email is registered, a password reset link has been sent',
      // DEV ONLY: Remove in production
      resetToken: resetToken || undefined,
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 * 
 * RULES:
 * - Tokens are single-use
 * - Tokens expire
 * - Old password is invalidated
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, role } = req.body;

    if (!token || !newPassword || !role) {
      return res.status(400).json({ error: 'Token, new password, and role are required' });
    }

    if (role !== 'rider' && role !== 'driver') {
      return res.status(400).json({ error: 'Role must be either "rider" or "driver"' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    await authService.resetPassword(token, newPassword, role);

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
    },
  });
});

export default router;
