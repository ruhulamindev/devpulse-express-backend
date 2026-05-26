export interface SignupServiceInput {
  name: string;
  email: string;
  password: string;
  role?: "contributor" | "maintainer";
}

export interface LoginServiceInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "contributor" | "maintainer";
  created_at: string;
  updated_at: string;
}

export interface LoginServiceResponse {
  token: string;
  user: AuthUser;
}