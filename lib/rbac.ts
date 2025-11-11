/**
 * Role-Based Access Control (RBAC) Helpers for BizExit
 * 
 * This module provides helper functions for checking user permissions
 * in the BizExit multi-tenant platform.
 */

import { createClient } from "@/utils/supabase/server";

// User roles in BizExit
export enum UserRole {
  SELLER = "seller",
  BROKER = "broker",
  BUYER = "buyer",
  PARTNER = "partner",
  ADMIN = "admin",
  ANALYST = "analyst",
}

// Permission types
export enum Permission {
  // Company permissions
  COMPANY_CREATE = "company:create",
  COMPANY_READ = "company:read",
  COMPANY_UPDATE = "company:update",
  COMPANY_DELETE = "company:delete",
  COMPANY_PUBLISH = "company:publish",
  
  // Deal permissions
  DEAL_CREATE = "deal:create",
  DEAL_READ = "deal:read",
  DEAL_UPDATE = "deal:update",
  DEAL_DELETE = "deal:delete",
  DEAL_ADVANCE_STAGE = "deal:advance_stage",
  
  // Listing permissions
  LISTING_CREATE = "listing:create",
  LISTING_READ = "listing:read",
  LISTING_UPDATE = "listing:update",
  LISTING_DELETE = "listing:delete",
  LISTING_PUBLISH = "listing:publish",
  
  // NDA permissions
  NDA_CREATE = "nda:create",
  NDA_READ = "nda:read",
  NDA_SIGN = "nda:sign",
  NDA_VERIFY = "nda:verify",
  
  // Payment permissions
  PAYMENT_CREATE = "payment:create",
  PAYMENT_READ = "payment:read",
  PAYMENT_PROCESS = "payment:process",
  
  // Organization permissions
  ORG_READ = "org:read",
  ORG_UPDATE = "org:update",
  ORG_INVITE_USER = "org:invite_user",
  ORG_REMOVE_USER = "org:remove_user",
  
  // Admin permissions
  ADMIN_READ = "admin:read",
  ADMIN_WRITE = "admin:write",
  AUDIT_LOG_READ = "audit:read",
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SELLER]: [
    Permission.COMPANY_CREATE,
    Permission.COMPANY_READ,
    Permission.COMPANY_UPDATE,
    Permission.DEAL_READ,
    Permission.LISTING_READ,
    Permission.NDA_READ,
    Permission.PAYMENT_READ,
    Permission.ORG_READ,
  ],
  [UserRole.BROKER]: [
    Permission.COMPANY_CREATE,
    Permission.COMPANY_READ,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_PUBLISH,
    Permission.DEAL_CREATE,
    Permission.DEAL_READ,
    Permission.DEAL_UPDATE,
    Permission.DEAL_ADVANCE_STAGE,
    Permission.LISTING_CREATE,
    Permission.LISTING_READ,
    Permission.LISTING_UPDATE,
    Permission.LISTING_PUBLISH,
    Permission.NDA_CREATE,
    Permission.NDA_READ,
    Permission.NDA_VERIFY,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_PROCESS,
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_INVITE_USER,
  ],
  [UserRole.BUYER]: [
    Permission.COMPANY_READ,
    Permission.DEAL_READ,
    Permission.LISTING_READ,
    Permission.NDA_READ,
    Permission.NDA_SIGN,
    Permission.PAYMENT_READ,
  ],
  [UserRole.PARTNER]: [
    Permission.COMPANY_READ,
    Permission.DEAL_READ,
    Permission.LISTING_READ,
    Permission.NDA_READ,
  ],
  [UserRole.ADMIN]: [
    ...Object.values(Permission), // Admin has all permissions
  ],
  [UserRole.ANALYST]: [
    Permission.COMPANY_READ,
    Permission.DEAL_READ,
    Permission.LISTING_READ,
    Permission.NDA_READ,
    Permission.PAYMENT_READ,
    Permission.ORG_READ,
    Permission.AUDIT_LOG_READ,
  ],
};

/**
 * User context with organization and role information
 */
export interface UserContext {
  userId: string;
  organizationId: string;
  role: UserRole;
  isAdmin: boolean;
}

/**
 * Get the current user's context (organization and role)
 */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }
  
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role, is_admin")
    .eq("id", user.id)
    .single();
  
  if (profileError || !profile) {
    return null;
  }
  
  return {
    userId: user.id,
    organizationId: profile.organization_id,
    role: profile.role as UserRole,
    isAdmin: profile.is_admin || false,
  };
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userContext: UserContext,
  permission: Permission,
): boolean {
  // Admins always have all permissions
  if (userContext.isAdmin) {
    return true;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userContext.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userContext: UserContext,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(userContext, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userContext: UserContext,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(userContext, permission));
}

/**
 * Assert that a user has a specific permission, throw error if not
 */
export function assertPermission(
  userContext: UserContext,
  permission: Permission,
): void {
  if (!hasPermission(userContext, permission)) {
    throw new Error(
      `Permission denied: User does not have permission '${permission}'`,
    );
  }
}

/**
 * Check if a resource belongs to the user's organization
 */
export async function isResourceInOrganization(
  resourceId: string,
  tableName: string,
  userContext: UserContext,
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from(tableName)
    .select("organization_id")
    .eq("id", resourceId)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return data.organization_id === userContext.organizationId;
}

/**
 * Assert that a resource belongs to the user's organization
 */
export async function assertResourceInOrganization(
  resourceId: string,
  tableName: string,
  userContext: UserContext,
): Promise<void> {
  const inOrg = await isResourceInOrganization(
    resourceId,
    tableName,
    userContext,
  );
  
  if (!inOrg) {
    throw new Error(
      `Access denied: Resource '${resourceId}' not found in your organization`,
    );
  }
}

/**
 * Get all organizations the user has access to
 * (For now, users only have access to one organization)
 */
export async function getUserOrganizations(
  userId: string,
): Promise<string[]> {
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();
  
  if (error || !profile?.organization_id) {
    return [];
  }
  
  return [profile.organization_id];
}

/**
 * Check if user can access a specific company
 */
export async function canAccessCompany(
  companyId: string,
  userContext: UserContext,
): Promise<boolean> {
  // Check permission first
  if (!hasPermission(userContext, Permission.COMPANY_READ)) {
    return false;
  }
  
  // Check if company is in user's organization
  return await isResourceInOrganization(companyId, "companies", userContext);
}

/**
 * Check if user can access a specific deal
 */
export async function canAccessDeal(
  dealId: string,
  userContext: UserContext,
): Promise<boolean> {
  // Check permission first
  if (!hasPermission(userContext, Permission.DEAL_READ)) {
    return false;
  }
  
  // Check if deal is in user's organization
  return await isResourceInOrganization(dealId, "deals", userContext);
}

/**
 * Middleware helper to enforce authentication and get user context
 */
export async function requireAuth(): Promise<UserContext> {
  const userContext = await getUserContext();
  
  if (!userContext) {
    throw new Error("Authentication required");
  }
  
  return userContext;
}

/**
 * Middleware helper to enforce both authentication and a specific permission
 */
export async function requirePermission(
  permission: Permission,
): Promise<UserContext> {
  const userContext = await requireAuth();
  assertPermission(userContext, permission);
  return userContext;
}

/**
 * Middleware helper to enforce admin access
 */
export async function requireAdmin(): Promise<UserContext> {
  const userContext = await requireAuth();
  
  if (!userContext.isAdmin) {
    throw new Error("Admin access required");
  }
  
  return userContext;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  userContext: UserContext,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, any>,
): Promise<void> {
  const supabase = await createClient();
  
  await supabase.from("audit_logs").insert({
    user_id: userContext.userId,
    organization_id: userContext.organizationId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata: metadata || {},
  });
}

