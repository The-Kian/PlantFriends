import validateCredentials from './validateCredentials';
import { CredentialsType } from '@context/auth/AuthTypes';

describe('validateCredentials', () => {
    it('should return true for valid login credentials', () => {
        const credentials: CredentialsType = {
            email: 'test@example.com',
            confirmEmail: '',
            password: 'password123',
            confirmPassword: '',
            displayName: '',
            dateOfBirth: new Date(),
        };
        const result = validateCredentials(credentials, 'login');
        expect(result.isValid).toBe(true);
    });

    it('should return false for invalid email in login', () => {
        const credentials: CredentialsType = {
            email: 'testexample.com',
            confirmEmail: '',
            password: 'password123',
            confirmPassword: '',
            displayName: '',
            dateOfBirth: new Date(),
        };
        const result = validateCredentials(credentials, 'login');
        expect(result.isValid).toBe(false);
    });

    it('should return false for short password in login', () => {
        const credentials: CredentialsType = {
            email: 'test@example.com',
            confirmEmail: '',
            password: 'pass',
            confirmPassword: '',
            displayName: '',
            dateOfBirth: new Date(),
        };
        const result = validateCredentials(credentials, 'login');
        expect(result.isValid).toBe(false);
    });

    it('should return true for valid signUp credentials', () => {
        const credentials: CredentialsType = {
            email: 'test@example.com',
            confirmEmail: 'test@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            displayName: '',
            dateOfBirth: new Date(),
        };
        const result = validateCredentials(credentials, 'signUp');
        expect(result.isValid).toBe(true);
    });

    it('should return false for mismatched emails in signUp', () => {
        const credentials: CredentialsType = {
            email: 'test@example.com',
            confirmEmail: 'test2@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            displayName: '',
            dateOfBirth: new Date(),
        };
        const result = validateCredentials(credentials, 'signUp');
        expect(result.isValid).toBe(false);
    });

    it('should return false for mismatched passwords in signUp', () => {
        const credentials: CredentialsType = {
            email: 'test@example.com',
            confirmEmail: 'test@example.com',
            password: 'password123',
            confirmPassword: 'password456',
            displayName: '',
            dateOfBirth: new Date(),
        };
        const result = validateCredentials(credentials, 'signUp');
        expect(result.isValid).toBe(false);
    });
});