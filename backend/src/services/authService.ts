import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Pool } from 'pg';

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'dryvrhub-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  role: 'rider' | 'driver';
  emailVerified: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  role: 'rider' | 'driver';
}

export class AuthService {
  constructor(private pool: Pool) {}

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        emailVerified: decoded.emailVerified,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate verification token
   */
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Sign up a new user (rider or driver)
   * RULE: Authentication is identity, NOT trust
   * RULE: Role is explicit and chosen at signup
   */
  async signup(data: SignupData): Promise<{ user: AuthUser; token: string; verificationToken: string }> {
    const { email, password, role } = data;

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const tableName = role === 'rider' ? 'riders' : 'drivers';

    // Check if email already exists
    const existingUser = await this.pool.query(
      `SELECT id FROM ${tableName} WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Create user
    const result = await this.pool.query(
      `INSERT INTO ${tableName} 
       (email, password_hash, email_verified, verification_token, verification_expires_at, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, email, email_verified, created_at`,
      [email, passwordHash, false, verificationToken, verificationExpiresAt]
    );

    const user: AuthUser = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role,
      emailVerified: result.rows[0].email_verified,
    };

    const authToken = this.generateToken(user);

    return { user, token: authToken, verificationToken };
  }

  /**
   * Login user (rider or driver)
   * RULE: Do NOT block login for incomplete verification
   * RULE: Verification gates FEATURES, not login
   */
  async login(email: string, password: string, role: 'rider' | 'driver'): Promise<{ user: AuthUser; token: string }> {
    const tableName = role === 'rider' ? 'riders' : 'drivers';

    // Get user
    const result = await this.pool.query(
      `SELECT id, email, password_hash, email_verified FROM ${tableName} WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const userRow = result.rows[0];

    // Verify password
    const isValid = await this.comparePassword(password, userRow.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const user: AuthUser = {
      id: userRow.id,
      email: userRow.email,
      role,
      emailVerified: userRow.email_verified,
    };

    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Verify email with token
   * RULE: Token is single-use
   * RULE: Token expires
   */
  async verifyEmail(token: string, role: 'rider' | 'driver'): Promise<AuthUser> {
    const tableName = role === 'rider' ? 'riders' : 'drivers';

    // Find user with valid token
    const result = await this.pool.query(
      `SELECT id, email, email_verified, verification_expires_at 
       FROM ${tableName} 
       WHERE verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid verification token');
    }

    const userRow = result.rows[0];

    // Check if already verified
    if (userRow.email_verified) {
      throw new Error('Email already verified');
    }

    // Check if token expired
    if (new Date() > new Date(userRow.verification_expires_at)) {
      throw new Error('Verification token expired');
    }

    // Mark email as verified and clear token
    await this.pool.query(
      `UPDATE ${tableName} 
       SET email_verified = true, verification_token = NULL, verification_expires_at = NULL 
       WHERE id = $1`,
      [userRow.id]
    );

    return {
      id: userRow.id,
      email: userRow.email,
      role,
      emailVerified: true,
    };
  }

  /**
   * Request password reset
   * RULE: No indication whether email exists
   */
  async requestPasswordReset(email: string, role: 'rider' | 'driver'): Promise<string | null> {
    const tableName = role === 'rider' ? 'riders' : 'drivers';

    const result = await this.pool.query(
      `SELECT id FROM ${tableName} WHERE email = $1`,
      [email]
    );

    // Don't reveal if email exists
    if (result.rows.length === 0) {
      return null;
    }

    // Generate reset token
    const resetToken = this.generateVerificationToken();
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.pool.query(
      `UPDATE ${tableName} 
       SET reset_token = $1, reset_expires_at = $2 
       WHERE email = $3`,
      [resetToken, resetExpiresAt, email]
    );

    return resetToken;
  }

  /**
   * Reset password with token
   * RULE: Tokens are single-use
   * RULE: Tokens expire
   */
  async resetPassword(token: string, newPassword: string, role: 'rider' | 'driver'): Promise<void> {
    const tableName = role === 'rider' ? 'riders' : 'drivers';

    // Find user with valid token
    const result = await this.pool.query(
      `SELECT id, reset_expires_at FROM ${tableName} WHERE reset_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid reset token');
    }

    const userRow = result.rows[0];

    // Check if token expired
    if (new Date() > new Date(userRow.reset_expires_at)) {
      throw new Error('Reset token expired');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password and clear reset token
    await this.pool.query(
      `UPDATE ${tableName} 
       SET password_hash = $1, reset_token = NULL, reset_expires_at = NULL 
       WHERE id = $2`,
      [passwordHash, userRow.id]
    );
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string, role: 'rider' | 'driver'): Promise<string | null> {
    const tableName = role === 'rider' ? 'riders' : 'drivers';

    const result = await this.pool.query(
      `SELECT id, email_verified FROM ${tableName} WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    if (result.rows[0].email_verified) {
      throw new Error('Email already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.pool.query(
      `UPDATE ${tableName} 
       SET verification_token = $1, verification_expires_at = $2 
       WHERE email = $3`,
      [verificationToken, verificationExpiresAt, email]
    );

    return verificationToken;
  }
}
