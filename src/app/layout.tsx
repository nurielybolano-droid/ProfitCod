import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProfitCod - Dashboard COD',
  description: 'Gestión y análisis de negocio Cash On Delivery. Calcula beneficios, métricas y alertas automáticas.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
