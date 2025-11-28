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
            .update({ entra_id: acco
