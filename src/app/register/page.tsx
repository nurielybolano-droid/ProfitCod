'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

      router.push('/login?registered=true')
    } catch (err) {
      setLoading(false)
      setError('Error de conexión con el servidor')
    }
  }

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
        <div className="auth-header" style={{ marginBottom: '2.5rem' }}>
          <div className="logo" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Profit<span>Cod</span>
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', fontFamily: 'Syne' }}>Crear cuenta</h1>
          <p className="auth-subtitle" style={{ fontSize: '0.85rem', color: 'var(--muted2)', marginTop: '0.5rem' }}>Únete a la nueva era de analítica e-commerce</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
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

        <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted2)' }}>
          ¿Ya tienes una cuenta?&nbsp;
          <Link href="/login" style={{ color: 'var(--mint)', fontWeight: 600 }}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  )
}
