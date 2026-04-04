import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminShell from './AdminShell';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f4f6f8' }} />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
