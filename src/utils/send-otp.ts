import { User } from "../modules/auth/auth.model.ts";
import { generateOTP, hashOTP } from "./create-otp";
import { sendEmail } from "./send-mail";

export const sendOTP = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const otp = generateOTP();
  const hashedOtp = hashOTP(otp);

  user.otp = hashedOtp;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  user.otpAttempts = 0;

  await user.save({ validateBeforeSave: false });

  await sendEmail(email, "Your OTP Code", `<h2>Your OTP is: ${otp}</h2>`);

  return true;
};
