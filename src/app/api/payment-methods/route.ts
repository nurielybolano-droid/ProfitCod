import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst()
    
    // If no settings exist yet, create default
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          stripeEnabled: true,
          codEnabled: true
        }
      })
    }

    return NextResponse.json({
      stripeEnabled: settings.stripeEnabled,
      codEnabled: settings.codEnabled
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json({ error: 'Error loading settings' }, { status: 500 })
  }
}
