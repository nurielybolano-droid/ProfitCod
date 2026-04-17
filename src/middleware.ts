import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth') || nextUrl.pathname.startsWith('/api/register')
  const isPublicAsset = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/favicon.ico') || nextUrl.pathname.startsWith('/img')

  // 1. Allow API Auth and Public Assets
  if (isApiAuth || isPublicAsset) {
    return NextResponse.next()
  }

  // 2. Redirect logged-in users away from auth pages (login/register)
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // 3. Redirect logged-out users to login for all other pages
  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname
    if (nextUrl.search) {
      callbackUrl += nextUrl.search
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
