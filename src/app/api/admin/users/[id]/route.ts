import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user || !(session.user as any).isAdmin) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { isActive, plan, planStatus } = await request.json()

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (plan !== undefined) updateData.plan = plan
    if (planStatus !== undefined) updateData.planStatus = planStatus

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        isActive: true,
        plan: true,
        planStatus: true,
        trialEndsAt: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
