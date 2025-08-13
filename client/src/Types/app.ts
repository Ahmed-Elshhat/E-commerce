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
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses: [];
  id: string;
  _id: string;
  startShift: {
    hour: number;
    minutes: number;
  };
  endShift: {
    hour: number;
    minutes: number;
  };
};

// Category Schema
export type CategorySchema = {
  _id: string;
  nameAr: string;
  nameEn: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
};

// Brand Schema
export type BrandSchema = {
  _id: string;
  nameAr: string;
  nameEn: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
};

// Coupon Schema
export type CouponSchema = {
  _id: string;
  name: string;
  discount: number;
  expire: string;
  createdAt: Date;
  updatedAt: Date;
};

// Review Schema
export type ReviewSchema = {
  _id: string;
  title: string
  ratings: number;
  user: {
    _id: string;
    name: string;
  };
  product: string;
  createdAt: Date;
  updatedAt: Date;
};

// Product Schema
export type ProductSchema = {
  _id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  quantity: number;
  sold: number;
  price: number;
  priceAfterDiscount: number;
  colors: string[];
  coverImage: string;
  images: { _id: string; url: string }[];
  ratingsAverage: number;
  ratingsQuantity: number;
  createdAt: null;
  updatedAt: null;
  category: CategorySchema;
  brand: BrandSchema;
  reviews: ReviewSchema;
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
        titleAr: string;
        titleEn: string;
        imageCover: string;
        coverImageFull: string
      };
    }[];
  };
  numOfCartItems: number;
};
