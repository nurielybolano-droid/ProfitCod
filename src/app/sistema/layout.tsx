import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!(session.user as any).isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="app-shell">
      <AdminSidebar 
        userName={session.user.name || 'Admin'} 
        userEmail={session.user.email || ''} 
      />
      <div className="main-content">
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}
