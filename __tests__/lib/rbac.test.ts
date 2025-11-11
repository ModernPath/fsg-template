/**
 * RBAC Helper Functions Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  UserRole,
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  assertPermission,
  type UserContext,
} from "@/lib/rbac";

describe("RBAC Helper Functions", () => {
  describe("hasPermission", () => {
    it("should grant all permissions to admin", () => {
      const adminContext: UserContext = {
        userId: "user-1",
        organizationId: "org-1",
        role: UserRole.ADMIN,
        isAdmin: true,
      };

      expect(hasPermission(adminContext, Permission.COMPANY_CREATE)).toBe(true);
      expect(hasPermission(adminContext, Permission.COMPANY_DELETE)).toBe(true);
      expect(hasPermission(adminContext, Permission.ADMIN_READ)).toBe(true);
      expect(hasPermission(adminContext, Permission.PAYMENT_PROCESS)).toBe(true);
    });

    it("should grant seller permissions to seller role", () => {
      const sellerContext: UserContext = {
        userId: "user-2",
        organizationId: "org-1",
        role: UserRole.SELLER,
        isAdmin: false,
      };

      expect(hasPermission(sellerContext, Permission.COMPANY_CREATE)).toBe(true);
      expect(hasPermission(sellerContext, Permission.COMPANY_READ)).toBe(true);
      expect(hasPermission(sellerContext, Permission.COMPANY_UPDATE)).toBe(true);
      expect(hasPermission(sellerContext, Permission.COMPANY_DELETE)).toBe(false);
      expect(hasPermission(sellerContext, Permission.DEAL_CREATE)).toBe(false);
      expect(hasPermission(sellerContext, Permission.ADMIN_READ)).toBe(false);
    });

    it("should grant broker permissions to broker role", () => {
      const brokerContext: UserContext = {
        userId: "user-3",
        organizationId: "org-1",
        role: UserRole.BROKER,
        isAdmin: false,
      };

      expect(hasPermission(brokerContext, Permission.COMPANY_CREATE)).toBe(true);
      expect(hasPermission(brokerContext, Permission.COMPANY_PUBLISH)).toBe(true);
      expect(hasPermission(brokerContext, Permission.DEAL_CREATE)).toBe(true);
      expect(hasPermission(brokerContext, Permission.DEAL_ADVANCE_STAGE)).toBe(true);
      expect(hasPermission(brokerContext, Permission.LISTING_PUBLISH)).toBe(true);
      expect(hasPermission(brokerContext, Permission.ADMIN_READ)).toBe(false);
    });

    it("should grant buyer permissions to buyer role", () => {
      const buyerContext: UserContext = {
        userId: "user-4",
        organizationId: "org-2",
        role: UserRole.BUYER,
        isAdmin: false,
      };

      expect(hasPermission(buyerContext, Permission.COMPANY_READ)).toBe(true);
      expect(hasPermission(buyerContext, Permission.NDA_SIGN)).toBe(true);
      expect(hasPermission(buyerContext, Permission.COMPANY_CREATE)).toBe(false);
      expect(hasPermission(buyerContext, Permission.DEAL_CREATE)).toBe(false);
      expect(hasPermission(buyerContext, Permission.NDA_CREATE)).toBe(false);
    });

    it("should grant partner permissions to partner role", () => {
      const partnerContext: UserContext = {
        userId: "user-5",
        organizationId: "org-1",
        role: UserRole.PARTNER,
        isAdmin: false,
      };

      expect(hasPermission(partnerContext, Permission.COMPANY_READ)).toBe(true);
      expect(hasPermission(partnerContext, Permission.DEAL_READ)).toBe(true);
      expect(hasPermission(partnerContext, Permission.COMPANY_UPDATE)).toBe(false);
      expect(hasPermission(partnerContext, Permission.DEAL_UPDATE)).toBe(false);
    });

    it("should grant analyst permissions to analyst role", () => {
      const analystContext: UserContext = {
        userId: "user-6",
        organizationId: "org-1",
        role: UserRole.ANALYST,
        isAdmin: false,
      };

      expect(hasPermission(analystContext, Permission.COMPANY_READ)).toBe(true);
      expect(hasPermission(analystContext, Permission.DEAL_READ)).toBe(true);
      expect(hasPermission(analystContext, Permission.AUDIT_LOG_READ)).toBe(true);
      expect(hasPermission(analystContext, Permission.COMPANY_UPDATE)).toBe(false);
      expect(hasPermission(analystContext, Permission.DEAL_CREATE)).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if user has at least one permission", () => {
      const sellerContext: UserContext = {
        userId: "user-2",
        organizationId: "org-1",
        role: UserRole.SELLER,
        isAdmin: false,
      };

      expect(
        hasAnyPermission(sellerContext, [
          Permission.COMPANY_READ,
          Permission.DEAL_CREATE,
        ]),
      ).toBe(true);
    });

    it("should return false if user has none of the permissions", () => {
      const buyerContext: UserContext = {
        userId: "user-4",
        organizationId: "org-2",
        role: UserRole.BUYER,
        isAdmin: false,
      };

      expect(
        hasAnyPermission(buyerContext, [
          Permission.COMPANY_DELETE,
          Permission.DEAL_CREATE,
        ]),
      ).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true if user has all permissions", () => {
      const brokerContext: UserContext = {
        userId: "user-3",
        organizationId: "org-1",
        role: UserRole.BROKER,
        isAdmin: false,
      };

      expect(
        hasAllPermissions(brokerContext, [
          Permission.COMPANY_CREATE,
          Permission.DEAL_CREATE,
          Permission.LISTING_PUBLISH,
        ]),
      ).toBe(true);
    });

    it("should return false if user is missing any permission", () => {
      const sellerContext: UserContext = {
        userId: "user-2",
        organizationId: "org-1",
        role: UserRole.SELLER,
        isAdmin: false,
      };

      expect(
        hasAllPermissions(sellerContext, [
          Permission.COMPANY_CREATE,
          Permission.DEAL_CREATE, // Seller doesn't have this
        ]),
      ).toBe(false);
    });
  });

  describe("assertPermission", () => {
    it("should not throw for valid permission", () => {
      const brokerContext: UserContext = {
        userId: "user-3",
        organizationId: "org-1",
        role: UserRole.BROKER,
        isAdmin: false,
      };

      expect(() =>
        assertPermission(brokerContext, Permission.COMPANY_CREATE)
      ).not.toThrow();
    });

    it("should throw for invalid permission", () => {
      const buyerContext: UserContext = {
        userId: "user-4",
        organizationId: "org-2",
        role: UserRole.BUYER,
        isAdmin: false,
      };

      expect(() =>
        assertPermission(buyerContext, Permission.COMPANY_DELETE)
      ).toThrow("Permission denied");
    });
  });
});

