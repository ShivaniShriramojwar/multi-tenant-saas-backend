import { User } from "../../user/user.model";

const findUserByEmail = async (email: string) => {
  return User.findOne({ email }).select("+failedLoginAttempts +lockedUntil");
};

const recordFailedLogin = async (
  userId: string,
  failedLoginAttempts: number,
  lockedUntil?: Date,
) => {
  return User.findByIdAndUpdate(userId, {
    failedLoginAttempts,
    lockedUntil,
  });
};

const resetLoginFailures = async (userId: string) => {
  return User.findByIdAndUpdate(userId, {
    $set: { failedLoginAttempts: 0 },
    $unset: { lockedUntil: 1 },
  });
};

export { findUserByEmail, recordFailedLogin, resetLoginFailures };
