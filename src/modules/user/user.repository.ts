import { User } from "./user.model";

interface UserListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  role?: string;
}

/**
 * 🔹 Get single user
 */
const getUserById = async (id: string) => {
  return User.findById(id).select("-password").populate("tenantId", "name");
};

/**
 * 🔹 Get users by tenant
 */
const buildUserFilter = (tenantId: string, query: UserListQuery) => {
  const filter: any = { tenantId };

  if (query.role) {
    filter.role = query.role;
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const getUsersByTenant = async (tenantId: string, query: UserListQuery) => {
  const filter = buildUserFilter(tenantId, query);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email tenantId role profileImage createdAt updatedAt")
      .populate("tenantId", "name")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, total };
};

const deleteUserById = async (id: string) => {
  return User.findByIdAndDelete(id);
};

const updateUserRoleById = async (id: string, role: string) => {
  return User.findByIdAndUpdate(id, { role }, { returnDocument: "after" })
    .select("-password")
    .populate("tenantId", "name");
};

const updateUserProfileImage = async (
  id: string,
  profileImage: {
    url: string;
    publicId: string;
    uploadedAt: Date;
  },
) => {
  return User.findByIdAndUpdate(
    id,
    { profileImage },
    { returnDocument: "after" },
  )
    .select("-password")
    .populate("tenantId", "name");
};

export {
  getUserById,
  getUsersByTenant,
  deleteUserById,
  updateUserRoleById,
  updateUserProfileImage,
};
