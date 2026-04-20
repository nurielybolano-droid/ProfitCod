'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface AdminSidebarProps {
  userName: string
  userEmail: string
}

const navItems = [
  { 
    href: '/sistema', 
    label: 'Usuarios',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  { 
    href: '/dashboard', 
    label: 'Vista Usuario',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  },
]

export default function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="sidebar admin-sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">Profit<span>Cod</span> <small className="admin-badge">ADMIN</small></span>
      </div>

      <div className="sidebar-nav" style={{ flex: 1 }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <div key={item.href} className="nav-item-wrapper">
              <div className={`nav-item-container ${isActive ? 'active' : ''}`}>
                <Link
                  href={item.href}
                  className="nav-item-link"
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {item.label}
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar admin-avatar">{initials}</div>
          <div className="user-info">
            <p className="user-name">{userName}</p>
            <p className="user-email">{userEmail}</p>
          </div>
          <button
            className="logout-btn"
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Cerrar sesión"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
