'use client'

import Link from 'next/link'

export default function PendingPaymentPage() {
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
            width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 200, 150, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '1px solid rgba(0, 200, 150, 0.2)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'Syne', marginBottom: '0.5rem' }}>Solicitud Recibida</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted2)' }}>Hemos recibido tu solicitud de pago. Nuestro equipo se pondrá en contacto contigo muy pronto para facilitarte los detalles bancarios o confirmar el contra reembolso.</p>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', background: 'var(--surface2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          Una vez confirmado el pago, activaremos tu cuenta manualmente en menos de 24 horas.
        </p>

        <div style={{ marginTop: '2rem' }}>
          <Link href="/login" className="btn btn-outline" style={{ display: 'inline-flex', padding: '0.85rem 2rem' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
