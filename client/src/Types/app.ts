// Redux
export type initialStateResetDataPass = {
  email: string;
  resetCode: string;
};

// Require Auth
export type RequireAuthProps = {
  allowedRole: string[];
};

export type RequireAuthUser = {
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses: [];
  id: string;
};
