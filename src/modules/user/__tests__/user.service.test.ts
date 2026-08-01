import { getUserProfileService } from "../user.service";
import { getUserById } from "../user.repository";
import { ROLES } from "../../../common/constants/roles";
import { getPermissionsForRole } from "../../../common/permissions/role-permissions";

jest.mock("../user.repository");

describe("getUserProfileService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user profile", async () => {
    const mockUser = {
      _id: "123",
      name: "Shivani",
      email: "shivani@test.com",
      role: ROLES.SUPER_ADMIN,
      tenantId: "tenant-123",
      profileImage: {
        url: "https://example.com/profile.jpg",
        publicId: "profile-123",
        uploadedAt: new Date("2026-06-30T00:00:00.000Z"),
      },
    };

    (getUserById as jest.Mock).mockResolvedValue(mockUser);

    const result = await getUserProfileService("123");

    expect(result).toEqual({
      id: "123",
      name: "Shivani",
      email: "shivani@test.com",
      role: ROLES.SUPER_ADMIN,
      permissions: getPermissionsForRole(ROLES.SUPER_ADMIN),
      tenantId: "tenant-123",
      tenant: {
        id: "tenant-123",
        name: undefined,
      },
      profileImage: mockUser.profileImage,
    });
  });

  it("should throw error when user not found", async () => {
    (getUserById as jest.Mock).mockResolvedValue(null);

    await expect(getUserProfileService("123")).rejects.toThrow(
      "User not found",
    );
  });
});
