import { describe, it, expect } from 'vitest';
import { AuthService } from '../../src/services/authService';

describe('AuthService', () => {
  describe('Password Hashing', () => {
    it('should hash a password', () => {
      const password = 'TestPassword123';
      const hash = AuthService.hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it('should verify a correct password', () => {
      const password = 'TestPassword123';
      const hash = AuthService.hashPassword(password);
      const isValid = AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', () => {
      const password = 'TestPassword123';
      const hash = AuthService.hashPassword(password);
      const isValid = AuthService.verifyPassword('WrongPassword123', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    it('should generate a valid token', () => {
      const token = AuthService.generateToken('user_123', 'test@example.com', false);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify a valid token', () => {
      const token = AuthService.generateToken('user_123', 'test@example.com', false);
      const decoded = AuthService.verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('user_123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.isAdmin).toBe(false);
    });

    it('should return null for invalid token', () => {
      const decoded = AuthService.verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should include admin flag in token', () => {
      const token = AuthService.generateToken('user_456', 'admin@example.com', true);
      const decoded = AuthService.verifyToken(token);
      expect(decoded?.isAdmin).toBe(true);
    });
  });

  describe('User ID Generation', () => {
    it('should generate unique user IDs', () => {
      const id1 = AuthService.generateUserId();
      const id2 = AuthService.generateUserId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^user_/);
      expect(id2).toMatch(/^user_/);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct emails', () => {
      expect(AuthService.validateEmail('user@example.com')).toBe(true);
      expect(AuthService.validateEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(AuthService.validateEmail('notanemail')).toBe(false);
      expect(AuthService.validateEmail('user@')).toBe(false);
      expect(AuthService.validateEmail('@example.com')).toBe(false);
      expect(AuthService.validateEmail('user @example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const result = AuthService.validatePassword('StrongPass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords that are too short', () => {
      const result = AuthService.validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject passwords without uppercase', () => {
      const result = AuthService.validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = AuthService.validatePassword('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return all validation errors', () => {
      const result = AuthService.validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});