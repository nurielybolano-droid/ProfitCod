import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function RecordsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="app-shell">
      <Sidebar
        userName={session.user.name ?? 'Usuario'}
        userEmail={session.user.email ?? ''}
      />
      <div className="main-content">
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}
