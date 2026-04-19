import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import LandingClient from './LandingClient'

export default async function HomePage() {
  const session = await auth()
  if (session) {
    redirect('/dashboard')
  }

  return <LandingClient />
}
