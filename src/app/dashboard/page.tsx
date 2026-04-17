import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard — ProfitCod',
  description: 'Panel principal de métricas y beneficios de tu negocio COD.',
}

export default function DashboardPage() {
  return <DashboardClient />
}
