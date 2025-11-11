"use client";

import { UserRole } from "@/types/roles";
import { BuyerDashboard } from "./roles/BuyerDashboard";
import { SellerDashboard } from "./roles/SellerDashboard";
import { BrokerDashboard } from "./roles/BrokerDashboard";
import { PartnerDashboard } from "./roles/PartnerDashboard";
import { AdminDashboard } from "./roles/AdminDashboard";
import { VisitorDashboard } from "./roles/VisitorDashboard";

interface RoleDashboardProps {
  role: UserRole;
  userId: string;
  organizationId?: string;
}

/**
 * Role-based Dashboard Router
 * 
 * Renders the appropriate dashboard based on user role
 */
export function RoleDashboard({
  role,
  userId,
  organizationId,
}: RoleDashboardProps) {
  switch (role) {
    case "buyer":
      return <BuyerDashboard userId={userId} />;
    case "seller":
      return <SellerDashboard userId={userId} organizationId={organizationId} />;
    case "broker":
      return <BrokerDashboard userId={userId} organizationId={organizationId} />;
    case "partner":
      return <PartnerDashboard userId={userId} organizationId={organizationId} />;
    case "admin":
      return <AdminDashboard userId={userId} />;
    case "visitor":
    default:
      return <VisitorDashboard />;
  }
}

