import { ClientSession } from "mongoose";
import { User } from "../../user/user.model";
import { Tenant } from "../../tenant/tenant.model";

// Find existing user
const findUserByEmail = async (email: string) => {
  return User.findOne({ email }).select("_id").lean();
};

// Create tenant
const createTenant = async (name: string, session?: ClientSession) => {
  if (!session) {
    return Tenant.create({ name });
  }

  const [tenant] = await Tenant.create([{ name }], { session });

  return tenant;
};

// Create user
const createUser = async (data: any, session?: ClientSession) => {
  if (!session) {
    return User.create(data);
  }

  const [user] = await User.create([data], { session });

  return user;
};

export { findUserByEmail, createTenant, createUser };
