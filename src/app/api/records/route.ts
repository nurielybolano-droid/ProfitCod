import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const PRODUCT_SELECT = {
  id: true, name: true, pvp: true, costProduct: true, units: true,
  costShipping: true, feeCod: true, iva: true, cpa: true,
  rateShipping: true, rateDelivery: true, fixedCostDaily: true,
} as const

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const userId = req.auth.user.id
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  try {
    const records = await prisma.dailyRecord.findMany({
      where: { userId, ...(productId ? { productId } : {}) },
      include: {
        product:  { select: PRODUCT_SELECT },
        product2: { select: PRODUCT_SELECT },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(records)
  } catch (error: any) {
    console.error('REC_GET_ERR:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
})

export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const userId = req.auth.user.id

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

  if (!productId || !date || adsSpend == null) {
    return NextResponse.json({ error: 'Faltan campos obligatorios (productId, date, adsSpend)' }, { status: 400 })
  }

  try {
    const record = await prisma.dailyRecord.create({
      data: {
        userId,
        productId,
        product2Id:       product2Id || null,
        date:             new Date(date),
        ordersReceived1:  Number(ordersReceived1  ?? 0),
        ordersReceived2:  Number(ordersReceived2  ?? 0),
        ordersConfirmed1: Number(ordersConfirmed1 ?? 0),
        ordersConfirmed2: Number(ordersConfirmed2 ?? 0),
        ordersShipped:    Number(ordersShipped    ?? 0),
        ordersDelivered1: Number(ordersDelivered1 ?? 0),
        ordersDelivered2: Number(ordersDelivered2 ?? 0),
        returns:          Number(returns          ?? 0),
        adsSpend:         Number(adsSpend),
        fixedCosts:       Number(fixedCosts       ?? 0),
        notes:            notes ?? null,
      },
      include: {
        product:  { select: PRODUCT_SELECT },
        product2: { select: PRODUCT_SELECT },
      },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un registro para esta fecha y producto' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
})
