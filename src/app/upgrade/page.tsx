'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function UpgradePage() {
  const router = useRouter()
  const [methods, setMethods] = useState({ stripeEnabled: false, codEnabled: false })
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(data => {
        setMethods(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handlePayment = async (method: 'stripe' | 'cod') => {
    setProcessing(true)
    try {
      const endpoint = method === 'stripe' ? '/api/payment/stripe' : '/api/payment/cod'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan })
      })
      
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to initiate payment')
        setProcessing(false)
      }
    } catch (e) {
      console.error(e)
      alert('Error connecting to server')
      setProcessing(false)
    }
  }

  const plans = [
    { id: 'pro', name: 'Pro', price: '29', desc: 'Para vendedores activos.' },
    { id: 'business', name: 'Business', price: '79', desc: 'Para equipos y agencias.' }
  ]

  return (
    <div className="auth-page" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '2rem',
      background: 'var(--night)',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div className="auth-card glass-panel" style={{ 
        maxWidth: '500px', 
        width: '100%', 
        padding: '3rem',
        textAlign: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 87, 51, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '1px solid rgba(255, 87, 51, 0.2)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'Syne', marginBottom: '0.5rem' }}>Acceso Restringido</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted2)' }}>Tu periodo de prueba ha finalizado o necesitas actualizar tu suscripción para acceder a la plataforma.</p>
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          {plans.map(p => (
            <div 
              key={p.id} 
              onClick={() => setSelectedPlan(p.id)}
              style={{ 
                padding: '1.25rem', 
                border: `2px solid ${selectedPlan === p.id ? 'var(--mint)' : 'var(--border)'}`, 
                borderRadius: '12px', 
                cursor: 'pointer',
                background: selectedPlan === p.id ? 'rgba(0, 200, 150, 0.05)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <h3 style={{ fontWeight: 700, fontFamily: 'Syne', fontSize: '1.1rem' }}>{p.name}</h3>
                <span style={{ fontWeight: 800 }}>€{p.price}/mes</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted2)' }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!methods.stripeEnabled && !methods.codEnabled && (
              <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>No hay métodos de pago disponibles. Contacta con soporte.</p>
            )}
            
            {methods.stripeEnabled && (
              <button 
                className="btn btn-primary" 
                onClick={() => handlePayment('stripe')}
                disabled={processing}
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
              >
                Pagar con Tarjeta (Stripe)
              </button>
            )}
            
            {methods.codEnabled && (
              <button 
                onClick={() => handlePayment('cod')}
                disabled={processing}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '0.85rem', 
                  background: 'transparent',
                  border: '1px solid var(--border)', 
                  color: 'var(--text)',
                  borderRadius: '100px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Pago Contra Reembolso / Transferencia
              </button>
            )}
          </div>
        )}
        
        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
