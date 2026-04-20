import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdmin = (auth?.user as any)?.isAdmin

      const isPublicPage = 
        nextUrl.pathname === '/' || 
        nextUrl.pathname.startsWith('/privacidad') || 
        nextUrl.pathname.startsWith('/terminos') || 
        nextUrl.pathname.startsWith('/blog')

      const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
      const isAdminPage = nextUrl.pathname.startsWith('/sistema')
      
      if (isAuthPage) {
        if (isLoggedIn) {
          if (isAdmin) return Response.redirect(new URL('/sistema', nextUrl))
          return Response.redirect(new URL('/dashboard', nextUrl))
        }
        return true
      }

      if (isAdminPage) {
        if (!isLoggedIn) return false
        if (!isAdmin) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }

      if (isPublicPage) return true

      return isLoggedIn
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as any).isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).isAdmin = token.isAdmin
      }
      return session
    },
  },
  providers: [], // Add providers with empty array here, will be defined in auth.ts
  session: {
    strategy: 'jwt',
  },
} satisfies NextAuthConfig
