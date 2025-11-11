// Force dynamic rendering to ensure route is always available
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import FinanceApplicationFlow from '@/components/auth/FinanceApplicationFlow';

export default function FinanceApplicationPage() {
  return <FinanceApplicationFlow />;
} 