// lib/auth.ts

import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      if (!user.email) {
        console.error('No email provided');
        return false;
      }

      try {
        // Check if user exists in Supabase
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('id, email, name, role, department_id, is_active, entra_id')
          .eq('email', user.email)
          .single();

        if (error || !existingUser) {
          console.error('User not found in database:', user.email, error);
          return false;
        }

        // Check if user is active
        if (!existingUser.is_active) {
          console.error('User is inactive:', user.email);
          return false;
        }

        // Update entra_id if not set
        if (!existingUser.entra_id && account?.providerAccountId) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              entra_id: account.providerAccountId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('Error updating entra_id:', updateError);
          }
        }

        console.log('User signed in successfully:', {
          email: existingUser.email,
          role: existingUser.role,
          id: existingUser.id
        });

        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
    async jwt({ token, user, account, trigger }) {
      // On sign in or when session is updated
      if (user?.email || trigger === 'update') {
        const email = user?.email || token.email;
        
        if (!email) return token;

        const { data: dbUser, error } = await supabase
          .from('users')
          .select('id, email, name, role, department_id')
          .eq('email', email)
          .single();

        if (error) {
          console.error('Error fetching user in jwt callback:', error);
          return token;
        }

        if (dbUser) {
          console.log('JWT callback - User data from DB:', {
            email: dbUser.email,
            role: dbUser.role,
            id: dbUser.id
          });

          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.department_id = dbUser.department_id;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        console.log('Session callback - Token data:', {
          email: token.email,
          role: token.role,
          id: token.id
        });

        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.department_id = token.department_id as string;

        console.log('Session callback - Final session.user:', {
          email: session.user.email,
          role: session.user.role,
          id: session.user.id
        });
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true, // Enable debug mode to see console logs
};
