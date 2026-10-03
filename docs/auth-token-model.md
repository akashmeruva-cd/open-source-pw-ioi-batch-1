# Auth Token Model

This document describes the security and lifecycle model for tokens used in our authentication system, specifically for password resets and session management.

## Password Reset Tokens

To ensure security and prevent account takeover, the password reset flow uses a custom token system.

### Token Generation & Storage
1.  **Generation**: When a password reset is requested, the system generates a cryptographically random 32-byte string, converted to a hexadecimal token.
2.  **Hashing**: The token is never stored in plain text. A SHA-256 hash of the token is generated using `node:crypto`.
3.  **Database Storage**: The SHA-256 hash, along with the associated `userId`, token `type` (`PASSWORD_RESET`), and an `expiresAt` timestamp (set to 1 hour after generation), is stored in the `authTokens` table.

### Security Guarantees
*   **Anti-Enumeration**: The `/api/auth/password-reset/request` endpoint always returns a success message, regardless of whether the email address exists in the database.
*   **Single-Use**: Upon successful use of a reset token (confirming the new password), the token record is deleted from the `authTokens` table.
*   **Time-Limited**: Tokens are only valid for 1 hour. Requests using an expired token, or a token that cannot be found in the database (or has already been used), are rejected.

## Session Tokens (Refresh Tokens)

Session management is handled through a custom implementation rather than relying solely on Supabase Auth.

### Token Model
*   Each user session is linked to a `REFRESH` token stored in the `authTokens` table.
*   These are used to maintain authenticated states and issue new access tokens.

### Revocation
*   For security (e.g., "Sign out everywhere" or after a password change), the system provides functionality to revoke all `REFRESH` tokens for a given `userId`. This immediately invalidates all active sessions for that user across all devices/browsers.
