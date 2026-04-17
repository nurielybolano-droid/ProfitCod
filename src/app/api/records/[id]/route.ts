import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const PUT = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const userId = req.auth.user.id
  const { id } = await params as { id: string }

  try {
    const body = await req.json()
    const {
      productId, product2Id, date,
      ordersReceived1, ordersReceived2,
      ordersConfirmed1, ordersConfirmed2,
      ordersShipped,
      ordersDelivered1, ordersDelivered2,
      returns,
      adsSpend, fixedCosts,
      notes,
    } = body

    const record = await prisma.dailyRecord.update({
      where: { id, userId },
      data: {
        productId:        productId        ?? undefined,
        product2Id:       product2Id !== undefined ? (product2Id || null) : undefined,
        date:             date ? new Date(date) : undefined,
        ordersReceived1:  ordersReceived1  != null ? Number(ordersReceived1)  : undefined,
        ordersReceived2:  ordersReceived2  != null ? Number(ordersReceived2)  : undefined,
        ordersConfirmed1: ordersConfirmed1 != null ? Number(ordersConfirmed1) : undefined,
        ordersConfirmed2: ordersConfirmed2 != null ? Number(ordersConfirmed2) : undefined,
        ordersShipped:    ordersShipped    != null ? Number(ordersShipped)    : undefined,
        ordersDelivered1: ordersDelivered1 != null ? Number(ordersDelivered1) : undefined,
        ordersDelivered2: ordersDelivered2 != null ? Number(ordersDelivered2) : undefined,
        returns:          returns          != null ? Number(returns)          : undefined,
        adsSpend:         adsSpend         != null ? Number(adsSpend)         : undefined,
        fixedCosts:       fixedCosts       != null ? Number(fixedCosts)       : undefined,
        notes:            notes !== undefined ? (notes || null) : undefined,
      },
      include: {
        product:  true,
        product2: true,
      },
    })
    return NextResponse.json(record)
  } catch (error: any) {
    console.error('REC_PUT_ERR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
})

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const userId = req.auth.user.id
  const { id } = await params as { id: string }

  try {
    await prisma.dailyRecord.delete({ where: { id, userId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('REC_DEL_ERR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
})
