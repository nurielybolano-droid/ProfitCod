'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting login with:', form.email)
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      console.log('Login result:', result)

      if (!result) {
        throw new Error('No se recibió respuesta del servidor de autenticación. Posible error de configuración.')
      }

      if (result.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Credenciales incorrectas. Revisa tu email y contraseña.')
        } else {
          setError('Error de Auth.js: ' + result.error)
          window.alert('ERROR DE AUTH.JS: ' + result.error)
        }
      } else {
        console.log('Login successful! Session should be active now.')
        console.log('FREEZING REDIRECT FOR 3 SECONDS... Check Console/Network tabs.')
        
        // Let user see the success log
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('CRITICAL LOGIN ERROR:', err)
      window.alert('ERROR CRÍTICO (Ver consola): ' + err.message)
      setError('Error crítico: ' + (err.message || 'Error desconocido network/server'))
    } finally {
      setLoading(false)
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
          <h1 className="auth-title" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', fontFamily: 'Syne' }}>Iniciar sesión</h1>
          <p className="auth-subtitle" style={{ fontSize: '0.85rem', color: 'var(--muted2)', marginTop: '0.5rem' }}>Bienvenido de nuevo a tu control de beneficios</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
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
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password" style={{ color: 'var(--muted2)' }}>Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="form-error" style={{ color: 'var(--accent)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ justifyContent: 'center', width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Entrar en mi cuenta'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted2)' }}>
          ¿Aún no tienes cuenta?&nbsp;
          <Link href="/register" style={{ color: 'var(--mint)', fontWeight: 600 }}>Crea una ahora</Link>
        </div>
      </div>
    </div>
  )
}
