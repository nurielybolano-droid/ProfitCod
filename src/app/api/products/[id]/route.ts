import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const PUT = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const userId = req.auth.user.id
  const { id } = await params as { id: string }

  try {
    const body = await req.json()
    const {
      name, pvp, costProduct, iva, cpa,
      costShipping, feeCod,
      rateShipping, rateDelivery, rateReturn,
      units,
    } = body

    const product = await prisma.product.update({
      where: { id, userId },
      data: {
        name,
        pvp:          pvp          != null ? Number(pvp)          : undefined,
        costProduct:  costProduct  != null ? Number(costProduct)  : undefined,
        iva:          iva          != null ? Number(iva)          : undefined,
        cpa:          cpa          != null ? Number(cpa)          : undefined,
        costShipping: costShipping != null ? Number(costShipping) : undefined,
        feeCod:       feeCod       != null ? Number(feeCod)       : undefined,
        rateShipping: rateShipping != null ? Number(rateShipping) : undefined,
        rateDelivery: rateDelivery != null ? Number(rateDelivery) : undefined,
        rateReturn:   rateReturn   != null ? Number(rateReturn)   : undefined,
        units:        units        != null ? Number(units)        : undefined,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('PROD_PUT_ERR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
})

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const userId = req.auth.user.id
  const { id } = await params as { id: string }

  try {
    await prisma.product.delete({
      where: { id, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PROD_DELETE_ERR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
})
