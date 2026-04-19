'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface SidebarProps {
  userName: string
  userEmail: string
}

interface Product {
  id: string
  name: string
}

const navItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  { 
    href: '/records', 
    label: 'Registros',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  { 
    href: '/products', 
    label: 'Productos',
    id: 'nav-products',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 7.5V16.5L12 21L3 16.5V7.5L12 3L21 7.5Z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    )
  },
]

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [isProductsOpen, setIsProductsOpen] = useState(false)

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data)
      })
      .catch(err => console.error('Error fetching products for sidebar:', err))
  }, [])

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">Profit<span>Cod</span></span>
      </div>

      <div className="sidebar-nav" style={{ flex: 1 }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isProducts = item.id === 'nav-products'

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
                
                {isProducts && (
                  <button 
                    className={`nav-item-dropdown-toggle ${isProductsOpen ? 'open' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      setIsProductsOpen(!isProductsOpen)
                    }}
                    title="Ver productos"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                )}
              </div>

              {isProducts && isProductsOpen && products.length > 0 && (
                <div className="submenu">
                  {products.map(p => (
                    <Link 
                      key={p.id} 
                      href={`/products?id=${p.id}`}
                      className="submenu-item"
                    >
                      <span className="submenu-dot" />
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p className="user-name">{userName}</p>
            <p className="user-email">{userEmail}</p>
          </div>
          <button
            id="sidebar-logout"
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
