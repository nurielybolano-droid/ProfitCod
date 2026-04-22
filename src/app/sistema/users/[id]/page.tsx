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
    plan: string
    planStatus: string
    trialEndsAt: string
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

  const handleUpdatePlan = async (updates: { plan?: string, planStatus?: string }) => {
    if (!id || !data) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        const updatedUser = await res.json()
        setData({
          ...data,
          user: { ...data.user, ...updatedUser }
        })
      } else {
        alert('Error updating user plan')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating user plan')
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

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'Syne' }}>Suscripción y Plan</h2>
        <div className="admin-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(200px, 1fr)', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--muted2)', marginBottom: '0.8rem' }}>Plan Actual</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {['starter', 'pro', 'business'].map(p => (
                <button 
                  key={p}
                  onClick={() => handleUpdatePlan({ plan: p })}
                  className={`btn ${data.user.plan === p ? 'btn-primary' : 'btn-outline'}`}
                  style={{ textTransform: 'capitalize', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  {p}
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: '0.9rem', color: 'var(--muted2)', marginBottom: '0.8rem' }}>Estado de Pago</h3>
             <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['trial', 'active', 'expired', 'cancelled'].map(s => (
                <button 
                  key={s}
                  onClick={() => handleUpdatePlan({ planStatus: s })}
                  className={`btn ${data.user.planStatus === s ? 'btn-primary' : 'btn-outline'}`}
                  style={{ textTransform: 'capitalize', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--muted2)', marginBottom: '1rem' }}>Detalles de Suscripción</h3>
            <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--muted2)', display: 'inline-block', width: '90px' }}>Plan:</span>
              <strong style={{ textTransform: 'capitalize' }}>{data.user.plan}</strong>
            </div>
            <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--muted2)', display: 'inline-block', width: '90px' }}>Estado:</span>
              <strong style={{ textTransform: 'capitalize', color: data.user.planStatus === 'active' ? 'var(--mint)' : data.user.planStatus === 'trial' ? '#EF9F27' : 'var(--accent)' }}>
                {data.user.planStatus}
              </strong>
            </div>
            {data.user.trialEndsAt && (
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted2)', display: 'inline-block', width: '90px' }}>Fin Prueba:</span>
                <strong>{new Date(data.user.trialEndsAt).toLocaleDateString()}</strong>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
