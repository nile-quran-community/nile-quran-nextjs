export interface SignupErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  referrer?: string;
  username?: string;
  password?: string;
}

export interface SignupFormValues {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  referrer: string;
}

export interface SignupFormState {
  errors: SignupErrors;
  values: SignupFormValues;
  success?: boolean;
  data?: Record<string, unknown>;
}