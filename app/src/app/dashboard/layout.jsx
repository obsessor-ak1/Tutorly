import React from 'react';
import { loginStatus } from '@/lib/userauth';
import { DashboardLayoutClient } from '@/components/DashboardLayoutClient';

export default async function DashboardLayout({ children }) {
  // Enforce authentication on all /dashboard routes
  const session = await loginStatus(true);

  return (
    <DashboardLayoutClient user={session?.user}>
      {children}
    </DashboardLayoutClient>
  );
}

