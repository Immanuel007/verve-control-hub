export interface ApiResponse<T> {
  code: string;
  description: string | null;
  logId: unknown;
  errors: unknown;
  data: T;
}

export interface LoginData {
  accessToken: string;
  refreshtoken: string;
  jti: string | null;
  email: string;
  mobileNo: string | null;
  scope: string | null;
  tokenType: string | null;
  twoFactorLogin: boolean;
  code?: string | null;
  description?: string | null;
}

export interface SignupData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  accessToken?: string;
}

export class ApiError extends Error {
  code: string;
  description: string;
  errors: unknown;
  status: number;
  constructor(opts: { code: string; description: string; errors?: unknown; status: number }) {
    super(opts.description || 'Request failed');
    this.name = 'ApiError';
    this.code = opts.code;
    this.description = opts.description;
    this.errors = opts.errors;
    this.status = opts.status;
  }
}
