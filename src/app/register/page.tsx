'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', plan: 'starter' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Select Plan, 2: Details

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        setError(data.error || 'Error en el registro')
        return
      }

      if (form.plan === 'pro' || form.plan === 'business') {
        router.push('/login?registered=true&pendingPayment=true')
      } else {
        router.push('/login?registered=true')
      }
    } catch (err) {
      setLoading(false)
      setError('Error de conexión con el servidor')
    }
  }

  const plans = [
    { id: 'starter', name: 'Starter', price: '0', desc: 'Prueba gratuita de 7 días.' },
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
      background: 'var(--night)'
    }}>
      <div className="auth-card glass-panel" style={{ 
        maxWidth: '440px', 
        width: '100%', 
        padding: '3rem',
        textAlign: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border)'
      }}>
        <div className="auth-header" style={{ marginBottom: step === 1 ? '1.5rem' : '2.5rem' }}>
          <div className="logo" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Profit<span>Cod</span>
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', fontFamily: 'Syne' }}>
            {step === 1 ? 'Elige tu plan' : 'Crear cuenta'}
          </h1>
          <p className="auth-subtitle" style={{ fontSize: '0.85rem', color: 'var(--muted2)', marginTop: '0.5rem' }}>
            {step === 1 ? 'Selecciona la opción que mejor se adapte a tu negocio' : 'Únete a la nueva era de analítica e-commerce'}
          </p>
        </div>

        {step === 1 ? (
          <div className="plan-selection" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            {plans.map(p => (
              <div 
                key={p.id} 
                onClick={() => setForm(f => ({ ...f, plan: p.id }))}
                style={{ 
                  padding: '1.25rem', 
                  border: `2px solid ${form.plan === p.id ? 'var(--mint)' : 'var(--border)'}`, 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  background: form.plan === p.id ? 'rgba(0, 200, 150, 0.05)' : 'transparent',
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
            
            <button
              onClick={() => setStep(2)}
              className="btn btn-primary"
              style={{ justifyContent: 'center', width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            >
              Continuar con {plans.find(p => p.id === form.plan)?.name}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            <div style={{ textAlign: 'right', marginBottom: '-0.5rem' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--mint)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>
                &larr; Cambiar plan
              </button>
            </div>
          <div className="form-group">
            <label className="form-label" htmlFor="name" style={{ color: 'var(--muted2)' }}>Nombre Completo</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Tu nombre"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email" style={{ color: 'var(--muted2)' }}>Correo Electrónico</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="nombre@ejemplo.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password" style={{ color: 'var(--muted2)' }}>Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>

          {error && <p className="form-error" style={{ color: 'var(--accent)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary"
            style={{ justifyContent: 'center', width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Crear mi cuenta'}
          </button>
        </form>
        )}

        <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted2)' }}>
          ¿Ya tienes una cuenta?&nbsp;
          <Link href="/login" style={{ color: 'var(--mint)', fontWeight: 600 }}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  )
}
