"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.developerId = exports.superAdminId = exports.tenantBId = exports.tenantAId = exports.roleBearer = exports.bearer = exports.authToken = exports.authPayload = void 0;
const jwt_util_1 = require("../../src/common/utils/jwt.util");
const roles_1 = require("../../src/common/constants/roles");
const tenantAId = "64f000000000000000000001";
exports.tenantAId = tenantAId;
const tenantBId = "64f000000000000000000002";
exports.tenantBId = tenantBId;
const superAdminId = "64f000000000000000000101";
exports.superAdminId = superAdminId;
const developerId = "64f000000000000000000102";
exports.developerId = developerId;
const authPayload = (overrides = {}) => ({
    userId: superAdminId,
    tenantId: tenantAId,
    role: roles_1.ROLES.SUPER_ADMIN,
    ...overrides,
});
exports.authPayload = authPayload;
const authToken = (overrides = {}) => {
    return (0, jwt_util_1.generateToken)(authPayload(overrides));
};
exports.authToken = authToken;
const bearer = (overrides = {}) => {
    return `Bearer ${authToken(overrides)}`;
};
exports.bearer = bearer;
const roleBearer = (role, tenantId = tenantAId) => {
    return bearer({
        role,
        tenantId,
        userId: role === roles_1.ROLES.DEVELOPER ? developerId : superAdminId,
    });
};
exports.roleBearer = roleBearer;
