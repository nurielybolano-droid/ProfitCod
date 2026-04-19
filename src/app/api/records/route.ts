import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const PRODUCT_SELECT = {
  id: true, name: true, pvp: true, costProduct: true, units: true,
  costEnvio: true, feeCod: true, iva: true, cpa: true,
  rateShipping: true, rateDelivery: true, costReturn: true, fixedCostDaily: true,
} as const

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const userId = req.auth.user.id
  const { searchParams } = new URL(req.url)
  const productIdsParam = searchParams.get('productIds')
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')

  const whereClause: any = { userId }

  if (productIdsParam && productIdsParam !== 'all') {
    const ids = productIdsParam.split(',').filter(Boolean)
    if (ids.length > 0) {
      whereClause.OR = [
        { productId: { in: ids } },
        { product2Id: { in: ids } }
      ]
    }
  }

  if (startParam || endParam) {
    whereClause.date = {}
    if (startParam) {
      // Ensure we start at the beginning of the day in UTC
      whereClause.date.gte = new Date(`${startParam}T00:00:00.000Z`)
    }
    if (endParam) {
      // Ensure we end at the very end of the day in UTC
      whereClause.date.lte = new Date(`${endParam}T23:59:59.999Z`)
    }
  }

  try {
    const records = await prisma.dailyRecord.findMany({
      where: whereClause,
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
