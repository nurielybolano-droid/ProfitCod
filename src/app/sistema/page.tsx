'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/calculator'

interface User {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string
  _count: {
    products: number
    dailyRecords: number
  }
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u))
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Panel de Control</h1>
        <p className="admin-subtitle">Gestiona los usuarios y monitorea su rendimiento global.</p>
      </header>

      <div className="user-list-grid">
        {users.map(user => (
          <div key={user.id} className="admin-card">
            <div className="user-card-header">
              <div className="user-card-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
              <div className={`user-status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                <span className="status-dot"></span>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </div>
            </div>

            <div className="user-metrics-mini">
              <div className="metric-item-mini">
                <span className="metric-label-mini">Productos</span>
                <span className="metric-value-mini">{user._count.products}</span>
              </div>
              <div className="metric-item-mini">
                <span className="metric-label-mini">Registros</span>
                <span className="metric-value-mini">{user._count.dailyRecords}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Estado</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={user.isActive} 
                    onChange={() => toggleUserStatus(user.id, user.isActive)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <Link href={`/sistema/users/${user.id}`} className="btn-pill-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.7rem' }}>
                Ver Detalles
              </Link>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="empty-state">
          <p>No hay usuarios registrados todavía.</p>
        </div>
      )}
    </div>
  )
}
