export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignUpResponse {
  userId: string;
  email: string;
  token: string;
  expiresIn: number;
}

export interface SignUpPendingResponse {
  requiresConfirmation: true;
  userId: string;
  email: string;
}

export interface AuthErrorResponse {
  error: string;
}
