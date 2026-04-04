import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await isAdminAuthenticated()) {
    redirect('/admin');
  }
  return <>{children}</>;
}
