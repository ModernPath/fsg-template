/**
 * BizExit Dashboard Layout
 * Server component wrapper for dashboard layout
 */

import { Metadata } from "next";
import { generateLocalizedMetadata } from "@/utils/metadata";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    locale: string;
  }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateLocalizedMetadata(locale, "Dashboard", {
    title: "Dashboard",
    description: "BizExit M&A Platform Dashboard",
    type: "website",
    canonicalUrl: "/dashboard",
    noindex: true, // Dashboard pages should not be indexed
  });
}

// Server component wrapper
export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <DashboardLayoutClient params={{ locale }}>
      {children}
    </DashboardLayoutClient>
  );
}
