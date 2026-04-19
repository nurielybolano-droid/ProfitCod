import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const userId = req.auth.user.id

  try {
    const products = await prisma.product.findMany({ 
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { dailyRecords: true }
        }
      }
    })
    return NextResponse.json(products)
  } catch (error: any) {
    console.error('PROD_GET_ERR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
})

export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const userId = req.auth.user.id

  const body = await req.json()
  const {
    name, pvp, costProduct, iva, cpa,
    costEnvio, feeCod,
    rateShipping, rateDelivery, costReturn,
    units, fixedCostDaily,
    packEnabled, packUnits, packPvp
  } = body

  if (!name || pvp == null || costProduct == null || costEnvio == null || feeCod == null) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  try {
    const product = await prisma.product.create({
      data: {
        userId,
        name,
        pvp:          Number(pvp),
        costProduct:  Number(costProduct),
        iva:          Number(iva ?? 0),
        cpa:          Number(cpa ?? 0),
        costEnvio:    Number(costEnvio),
        feeCod:       Number(feeCod),
        rateShipping: Number(rateShipping ?? 100),
        rateDelivery: Number(rateDelivery ?? 100),
        costReturn:   Number(costReturn ?? 0),
        units:        Number(units ?? 1),
        fixedCostDaily: Number(fixedCostDaily ?? 0),
        packEnabled:  Boolean(packEnabled ?? false),
        packUnits:    Number(packUnits ?? 2),
        packPvp:      packPvp != null ? Number(packPvp) : null,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('PROD_POST_ERR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
})
