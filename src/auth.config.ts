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

      if (isLoggedIn) {
        const pStatus = (auth?.user as any)?.planStatus
        // Allow access to upgrade page for trial/cancelled/expired
        if (nextUrl.pathname.startsWith('/upgrade') || nextUrl.pathname.startsWith('/api/payment')) {
          return true
        }
        
        // If not active and not on upgrade page, redirect to upgrade
        if (pStatus !== 'active' && pStatus !== 'trial' && !isAdmin) {
           return Response.redirect(new URL('/upgrade', nextUrl))
        }
        return true
      }

      return false
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as any).isAdmin
        token.plan = (user as any).plan
        token.planStatus = (user as any).planStatus
      }
      
      // Update token on session update
      if (trigger === "update" && session) {
        if (session.planStatus) token.planStatus = session.planStatus
        if (session.plan) token.plan = session.plan
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).isAdmin = token.isAdmin
        ;(session.user as any).plan = token.plan
        ;(session.user as any).planStatus = token.planStatus
      }
      return session
    },
  },
  providers: [], // Add providers with empty array here, will be defined in auth.ts
  session: {
    strategy: 'jwt',
  },
} satisfies NextAuthConfig
