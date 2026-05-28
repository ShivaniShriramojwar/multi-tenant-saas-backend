import { User } from "../../user/user.model";
import { Tenant } from "../../tenant/tenant.model";

// Find existing user
const findUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

// Create tenant
const createTenant = async (name: string) => {
  return Tenant.create({ name });
};

// Create user
const createUser = async (data: any) => {
  return User.create(data);
};

export { findUserByEmail, createTenant, createUser };
