export interface IDeviceSession {
  sessionToken: string;
  ip: string;
  userAgent: string;
  lastActive: Date;
  createdAt: Date;
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "editor";
  avatar?: string;
  bio?: string;
  resetToken?: string;
  resetExpires?: Date;
  otp?: string | undefined;
  otpExpires?: Date;
  otpAttempts?: number;
  otpRequestCount?: number;
  lastOtpRequestTime?: Date;
  deviceSessions?: IDeviceSession[];
  tokenVersion?: number;
}

export interface ILogin {
  email: string;
  password: string;
}
