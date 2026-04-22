import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, plan } = body

    if (!name || !email || !password || !plan) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    const validPlans = ['starter', 'pro', 'business']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Plan seleccionado no válido' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7 days trial

    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword,
        plan,
        planStatus: 'trial',
        trialEndsAt
      },
      select: { id: true, name: true, email: true, createdAt: true, plan: true, planStatus: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Error del servidor: ' + (err.message || 'Unknown') }, { status: 500 })
  }
}
