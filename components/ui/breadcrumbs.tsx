"use client";

/**
 * Breadcrumbs Component
 * Provides hierarchical navigation
 */

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm text-gray-600 dark:text-gray-400", className)}
    >
      <ol className="flex items-center space-x-2">
        {/* Home Icon */}
        <li className="flex items-center">
          {items[0]?.href ? (
            <Link
              href={items[0].href}
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          ) : (
            <Home className="h-4 w-4" />
          )}
        </li>

        {/* Breadcrumb items */}
        {items.slice(1).map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            {item.href && index < items.length - 2 ? (
              <Link
                href={item.href}
                className="hover:text-gray-900 dark:hover:text-white transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

