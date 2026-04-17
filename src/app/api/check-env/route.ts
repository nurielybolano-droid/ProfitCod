import { NextResponse } from 'next/server'

export async function GET() {
  // We only return true/false to avoid exposing sensitive keys
  return NextResponse.json({
    env: {
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      AUTH_TRUST_HOST: !!process.env.AUTH_TRUST_HOST,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      VERCEL: !!process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV
    },
    message: "If AUTH_SECRET and NEXTAUTH_SECRET are both false, Vercel is NOT providing the secret to the app."
  })
}
