import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  
  // Here we would normally email the admin or save a pending request in DB.
  // For now, we simulate a successful request.

  return NextResponse.json({ url: '/payment/pending' })
})
