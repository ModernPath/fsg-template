import type { UserRole, PermissionKey } from "@/types/roles";

/**
 * Role-based permission definitions
 * 
 * Each role has a set of allowed permissions organized by resource and action
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  // Visitor - limited public access
  visitor: [
    "listings:view",
    "companies:search",
  ],

  // Buyer - can view listings, submit offers, manage their profile
  buyer: [
    "listings:view",
    "companies:view",
    "companies:search",
    "deals:create",
    "deals:view",
    "deals:update", // own deals only
    "ndas:sign",
    "ndas:view", // own NDAs only
    "documents:view", // with NDA only
    "buyer_profiles:create",
    "buyer_profiles:view",
    "buyer_profiles:update",
    "buyer_profiles:delete",
  ],

  // Seller - can create/manage companies and deals
  seller: [
    "companies:create",
    "companies:view",
    "companies:update",
    "companies:delete",
    "listings:create",
    "listings:view",
    "listings:update",
    "listings:delete",
    "deals:view",
    "deals:update",
    "documents:create",
    "documents:view",
    "documents:update",
    "documents:delete",
    "ndas:view",
    "buyer_profiles:view", // for interested buyers
  ],

  // Broker - full deal management and matchmaking
  broker: [
    "companies:create",
    "companies:view",
    "companies:update",
    "companies:delete",
    "listings:create",
    "listings:view",
    "listings:update",
    "listings:delete",
    "deals:create",
    "deals:view",
    "deals:update",
    "deals:delete",
    "documents:create",
    "documents:view",
    "documents:update",
    "documents:delete",
    "ndas:create",
    "ndas:view",
    "ndas:update",
    "buyer_profiles:view",
    "buyer_profiles:search",
  ],

  // Partner (banks, insurance, law firms) - risk assessment and financing
  partner: [
    "companies:view",
    "deals:view",
    "documents:view",
    "documents:create", // risk reports, financing proposals
    "ndas:view",
    "payments:create",
    "payments:view",
  ],

  // Admin - full access
  admin: [
    "companies:create",
    "companies:view",
    "companies:update",
    "companies:delete",
    "listings:create",
    "listings:view",
    "listings:update",
    "listings:delete",
    "deals:create",
    "deals:view",
    "deals:update",
    "deals:delete",
    "documents:create",
    "documents:view",
    "documents:update",
    "documents:delete",
    "ndas:create",
    "ndas:view",
    "ndas:update",
    "ndas:delete",
    "buyer_profiles:create",
    "buyer_profiles:view",
    "buyer_profiles:update",
    "buyer_profiles:delete",
    "payments:create",
    "payments:view",
    "payments:update",
    "users:view",
    "users:update",
    "users:delete",
    "audit:view",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: PermissionKey[]
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some((p) => rolePermissions.includes(p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: PermissionKey[]
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.every((p) => rolePermissions.includes(p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): PermissionKey[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get resources accessible by a role
 */
export function getAccessibleResources(role: UserRole): string[] {
  const permissions = getRolePermissions(role);
  const resources = new Set<string>();

  permissions.forEach((permission) => {
    const [resource] = permission.split(":");
    resources.add(resource);
  });

  return Array.from(resources);
}

/**
 * Get actions allowed on a resource for a role
 */
export function getAllowedActions(role: UserRole, resource: string): string[] {
  const permissions = getRolePermissions(role);
  const actions: string[] = [];

  permissions.forEach((permission) => {
    const [res, action] = permission.split(":");
    if (res === resource) {
      actions.push(action);
    }
  });

  return actions;
}

