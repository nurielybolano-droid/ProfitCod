import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProfitCod — Conoce tu beneficio real en e-commerce',
  description: 'Calcula tu beneficio real restando todos los costes ocultos de tu negocio COD. Sin hojas de Excel complicadas.',
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
