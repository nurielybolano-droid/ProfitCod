import Link from 'next/link'

export default function BlogPage() {
  return (
    <div className="section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 className="section-h">Blog de ProfitCod</h1>
      <p className="section-sub">Pronto encontrarás aquí consejos sobre e-commerce, finanzas y escalabilidad.</p>
      <Link href="/" className="btn btn-outline" style={{ width: 'fit-content' }}>Volver al inicio</Link>
    </div>
  )
}
