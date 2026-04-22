import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  
  if (!session?.user || !(session.user as any).isAdmin) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    let settings = await prisma.systemSettings.findFirst()
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { stripeEnabled: true, codEnabled: true }
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  
  if (!session?.user || !(session.user as any).isAdmin) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const data = await request.json()
    let settings = await prisma.systemSettings.findFirst()
    
    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          stripeEnabled: data.stripeEnabled !== undefined ? data.stripeEnabled : settings.stripeEnabled,
          codEnabled: data.codEnabled !== undefined ? data.codEnabled : settings.codEnabled,
        }
      })
    } else {
      settings = await prisma.systemSettings.create({
        data: {
          stripeEnabled: data.stripeEnabled ?? true,
          codEnabled: data.codEnabled ?? true,
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
