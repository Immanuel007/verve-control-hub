import { request } from './api';
import { LoginData, SignupData } from '@/types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<LoginData>('/api/obelix/v1/auth/login', { method: 'POST', body: payload, auth: false }),

  signup: (payload: SignupPayload) =>
    request<SignupData>('/api/obelix/v1/auth/signup', { method: 'POST', body: payload, auth: false }),

  resendVerification: async (email: string) => {
    try {
      return await request<unknown>('/api/obelix/v1/auth/verify-email/resend', {
        method: 'POST',
        body: { email },
        auth: false,
      });
    } catch {
      return null;
    }
  },
};
