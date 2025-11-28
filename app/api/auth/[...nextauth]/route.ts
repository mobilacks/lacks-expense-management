import NextAuth, { NextAuthOptions } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { supabase } from '@/lib/supabase'

const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || 'placeholder',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || 'placeholder',
      tenantId: process.env.AZURE_AD_TENANT_ID || 'placeholder',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false

      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single()

        if (!existingUser) {
          console.log('User not found in system:', user.email)
          return false
        }

        if (!existingUser.is_active) {
          console.log('User is deactivated:', user.email)
          return false
        }

        if (!existingUser.entra_id && account?.providerAccountId) {
          await supabase
            .from('users')
            .update({ entra_id: account.providerAccountId })
            .eq('id', existingUser.id)
        }

        return true
      } catch (error) {
        console.error('Error during sign in:', error)
        return false
      }
    },
    async jwt({ token, user }) {
      if (user) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, name, email, role, department_id')
          .eq('email', user.email)
          .single()

        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          token.departmentId = dbUser.department_id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.departmentId = token.departmentId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
