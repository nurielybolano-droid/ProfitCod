import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { calculateAllMetrics } from '@/lib/calculator'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user || !(session.user as any).isAdmin) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        products: true,
        dailyRecords: {
          include: {
            product: true,
            product2: true
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Calculate metrics using existing calculator logic
    const allMetrics = calculateAllMetrics(user.dailyRecords)
    
    const profit = allMetrics.reduce((acc, m) => acc + m.profit, 0)
    const revenue = allMetrics.reduce((acc, m) => acc + m.revenue, 0)
    const adsSpend = allMetrics.reduce((acc, m) => acc + m.adsSpend, 0)
    const investment = allMetrics.reduce((acc, m) => acc + m.totalInvestment, 0)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      },
      products: user.products,
      metrics: {
        profit,
        revenue,
        adsSpend,
        investment,
        netGain: profit // User specifically asked for "ganancia neta de sus movimientos"
      }
    })
  } catch (error) {
    console.error('Error fetching user metrics:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
