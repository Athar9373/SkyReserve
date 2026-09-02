export type SignupFormType = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
};

export type LoginFormType = { email: string; password: string };

export interface AuthResponse {
  token?: string;
  message?: string;
}

export interface ResetPasswordType {
  email: string;
  password: string;
}
