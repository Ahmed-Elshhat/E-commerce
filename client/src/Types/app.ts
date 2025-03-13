// Redux
export type initialStateResetDataPass = {
  email: string;
  resetCode: string;
};

export type initialStateLang = {
  lang: string;
};

// Require Auth
export type RequireAuthProps = {
  allowedRole: string[];
};

// Signup page
export type SignupFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  _id: string;
  startShift: number;
  endShift: number;
};

// Category Schema
export type CategorySchema = {
  id: string;
  name: string;
};

// Reset Password
export type ResetPasswordFormState = {
  password: string;
  confirmPassword: string;
};

// getUser Context
export type initialStateGetUser = {
  loading: boolean;
  data: UserSchema | null;
  error: string;
};

// Cart
export type CartState = {
  data: {
    _id: string;
    user: string;
    totalCartPrice: number;
    cartItems: {
      _id: string;
      color: string;
      price: number;
      quantity: number;
      product: {
        title: string;
        imageCover: string;
      };
    }[];
  };
  numOfCartItems: number;
};
