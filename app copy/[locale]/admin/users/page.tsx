'use client'

import { useTranslations } from 'next-intl'
import UserManagementPage from './UserManagementPage'

export default function AdminUsersPage() {
  const t = useTranslations('AdminUsers')

  // Removed auth check for now - handled by middleware and layout
  return <UserManagementPage />
} 