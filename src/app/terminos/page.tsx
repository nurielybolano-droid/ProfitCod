import Link from 'next/link'

export default function TerminosPage() {
  return (
    <div className="section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 className="section-h">Términos y Condiciones</h1>
      <p className="section-sub">Esta página estará disponible próximamente. Conoce las reglas para usar ProfitCod.</p>
      <Link href="/" className="btn btn-outline" style={{ width: 'fit-content' }}>Volver al inicio</Link>
    </div>
  )
}
