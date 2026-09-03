export interface signupFormType {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface loginFormType {
  email: string;
  password: string;
}

export interface authResponse {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
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
