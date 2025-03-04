// Redux
export type initialStateResetDataPass = {
  email: string;
  resetCode: string;
};

// Require Auth
export type RequireAuthProps = {
  allowedRole: string[];
};

// Login Page
export type LoginFormState = {
  email: string;
  password: string;
};

// Redirect Page
export type RedirectPageProps = {
  message: string;
  dir: string;
  pageName: string;
};

// User Schema
export type UserSchema = {
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses: [];
  id: string;
};

// Reset Password
export type ResetPasswordFormState = {
  password: string;
  confirmPassword: string;
};

// getUser Context
export type  initialStateGetUser = {
  loading: boolean,
  data: UserSchema | null,
  error: string,
}