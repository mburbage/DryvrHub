import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import pool from '../config/database';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'rider' | 'driver';
        emailVerified: boolean;
      };
    }
  }
}

const authService = new AuthService(pool);

/**
 * Middleware to authenticate requests
 * Extracts JWT from Authorization header and verifies it
 * RULE: Authentication is identity, NOT trust
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const user = authService.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to require specific role
 * RULE: Roles are explicit
 */
export function requireRole(role: 'rider' | 'driver') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `${role} role required` });
    }

    next();
  };
}

/**
 * Middleware to require email verification
 * RULE: Verification gates FEATURES, not login
 * RULE: Authenticated ≠ verified
 */
export function requireEmailVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({ 
      error: 'Email verification required',
      message: 'Please verify your email to access this feature'
    });
  }

  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = authService.verifyToken(token);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail - authentication is optional
  }
  next();
}
