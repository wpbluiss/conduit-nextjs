// Types for the conduit-backend auth API (POST /api/v1/auth).
// Backend source: wpbluiss/conduit-backend#25.
//
// These types describe the wire contract only. Token storage strategy and
// session integration with the Supabase middleware layer are open questions
// tracked in conduit-nextjs#149.

/** Payload sent to POST /api/v1/auth for new account creation. */
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Successful response (HTTP 201) from POST /api/v1/auth.
 * `token` is a custom JWT; `expiresIn` is seconds until expiry.
 */
export interface SignupSuccessResponse {
  userId: string;
  email: string;
  token: string;
  expiresIn: number;
}

/**
 * Error codes returned by the backend on signup failure.
 * - `DUPLICATE_EMAIL`   → HTTP 409 — email already registered
 * - `VALIDATION_ERROR`  → HTTP 400 — weak password (< 8 chars, no letter/digit) or blank name
 * - `INVALID_EMAIL`     → HTTP 422 — email format rejected
 */
export type SignupErrorCode =
  | "DUPLICATE_EMAIL"
  | "VALIDATION_ERROR"
  | "INVALID_EMAIL"
  | "UNKNOWN_ERROR";

/** Error response body returned by the backend on signup failure. */
export interface SignupErrorResponse {
  error: string;
  code?: SignupErrorCode;
}

/** Password validation rules enforced by the backend. */
export const PASSWORD_RULES = {
  minLength: 8,
  requiresLetter: true,
  requiresDigit: true,
} as const;

/** Returns true when `password` satisfies all backend password rules. */
export function isPasswordValid(password: string): boolean {
  return (
    password.length >= PASSWORD_RULES.minLength &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  );
}

/** Maps an HTTP status code from POST /api/v1/auth to a user-facing message. */
export function signupErrorMessage(status: number, body?: SignupErrorResponse): string {
  if (status === 409) return "That email is already registered.";
  if (status === 422) return "Please enter a valid email address.";
  if (status === 400) {
    if (body?.error?.toLowerCase().includes("name")) return "Name is required.";
    return "Password must be at least 8 characters and include a letter and a digit.";
  }
  return body?.error ?? "Something went wrong. Please try again.";
}
