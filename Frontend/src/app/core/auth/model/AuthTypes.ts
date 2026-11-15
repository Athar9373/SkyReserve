export interface signupFormType {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface loginFormType {
  email: string;
  password: string;
}

export interface authResponse {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role?: 'ADMIN' | 'USER';
  token?: string;
}

export interface authError {
  error: string;
  message: string;
  status: number;
  validationErrors: {
    password?: string;
    phoneNumber?: string;
    email?: string;
  } | null;
}
