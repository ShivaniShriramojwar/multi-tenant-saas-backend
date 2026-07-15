import { getUserProfileService } from "../user.service";
import { getUserById } from "../user.repository";
import { ROLES } from "../../../common/constants/roles";

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
      tenant: {
        id: "",
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
