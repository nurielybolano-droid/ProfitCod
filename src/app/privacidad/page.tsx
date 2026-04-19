import Link from 'next/link'

export default function PrivacidadPage() {
  return (
    <div className="section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 className="section-h">Política de Privacidad</h1>
      <p className="section-sub">Esta página estará disponible próximamente. ProfitCod se toma muy en serio tu privacidad.</p>
      <Link href="/" className="btn btn-outline" style={{ width: 'fit-content' }}>Volver al inicio</Link>
    </div>
  )
}
