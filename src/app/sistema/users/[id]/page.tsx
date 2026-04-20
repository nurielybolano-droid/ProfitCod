'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/calculator'

interface Product {
  id: string
  name: string
  pvp: number
  costProduct: number
}

interface UserData {
  user: {
    id: string
    name: string
    email: string
    isActive: boolean
  }
  products: Product[]
  metrics: {
    profit: number
    revenue: number
    adsSpend: number
    investment: number
    netGain: number
  }
}

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('UserDetailPage mounted with ID:', id)
    if (id) {
      fetchUserData()
    } else {
      console.warn('No ID found in params')
    }
  }, [id])

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}/metrics`)
      if (res.ok) {
        const jsonData = await res.json()
        setData(jsonData)
      } else {
        router.push('/sistema')
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="admin-container">
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Link href="/sistema" className="btn-pill-outline" style={{ display: 'inline-flex', gap: '8px', marginBottom: '1rem', padding: '0.4rem 1rem', fontSize: '0.65rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Volver
          </Link>
          <h1 className="admin-title">{data.user.name}</h1>
          <p className="admin-subtitle">{data.user.email}</p>
        </div>
        <div className={`user-status-badge ${data.user.isActive ? 'status-active' : 'status-inactive'}`} style={{ marginBottom: '0.5rem' }}>
          <span className="status-dot"></span>
          {data.user.isActive ? 'Cuenta Activa' : 'Cuenta Suspendida'}
        </div>
      </header>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'Syne' }}>Rendimiento Global</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Profit Total</span>
            <div className="kpi-value" style={{ color: data.metrics.profit >= 0 ? 'var(--mint)' : 'var(--accent)' }}>
              {formatCurrency(data.metrics.profit)}
            </div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Ganancia Neta</span>
            <div className="kpi-value">
              {formatCurrency(data.metrics.netGain)}
            </div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Ingresos</span>
            <div className="kpi-value">
              {formatCurrency(data.metrics.revenue)}
            </div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Gasto en Ads</span>
            <div className="kpi-value" style={{ color: 'var(--muted2)' }}>
              {formatCurrency(data.metrics.adsSpend)}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'Syne' }}>Productos Configurados</h2>
        <div className="user-list-grid">
          {data.products.map(product => (
            <div key={product.id} className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700 }}>{product.name}</h3>
                <span className="admin-badge">ID: {product.id.slice(0, 8)}</span>
              </div>
              <div className="user-metrics-mini">
                <div className="metric-item-mini">
                  <span className="metric-label-mini">PVP</span>
                  <span className="metric-value-mini">{formatCurrency(product.pvp)}</span>
                </div>
                <div className="metric-item-mini">
                  <span className="metric-label-mini">Costo Base</span>
                  <span className="metric-value-mini">{formatCurrency(product.costProduct)}</span>
                </div>
              </div>
            </div>
          ))}
          {data.products.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p>Este usuario no tiene productos configurados.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
