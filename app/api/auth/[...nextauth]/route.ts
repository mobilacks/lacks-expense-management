import NextAuth, { NextAuthOptions } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { supabase } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        // Check if user exists in Supabase
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single()

        if (!existingUser) {
          // User not in system - they need to be added by admin first
          console.log('User not found in system:', user.email)
          return false
        }

        if (!existingUser.is_active) {
          // User deactivated
          console.log('User is deactivated:', user.email)
          return false
        }

        // Update entra_id if not set
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
    async jwt({ token, user, account }) {
      if (user) {
        // Fetch user details from Supabase
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
