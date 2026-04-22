import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  
  // Here we would normally create a Stripe checkout session.
  // Since Stripe key is not available, we return an error or we could return a URL to a mock payment page.
  // As requested, Stripe is just a reference for now.
  
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe no está configurado.' }, { status: 500 })
  }

  /* 
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: 'PRICE_ID', quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/upgrade`,
  });
  return NextResponse.json({ url: session.url });
  */

  return NextResponse.json({ error: 'Integración pendiente.' }, { status: 501 })
})
