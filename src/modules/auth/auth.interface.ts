export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "editor";
}

export interface ILogin {
  email: string;
  password: string;
}
