import { User } from "../../user/user.model";

const findUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

export { findUserByEmail };
