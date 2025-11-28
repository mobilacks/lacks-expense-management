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
    async signIn({ user, account }) {
      if (!user.email) {
        console.error('[AUTH] No email provided');
        return false;
      }

      try {
        console.log('[AUTH] Checking user in database:', user.email);
        
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error || !existingUser) {
          console.error('[AUTH] User not found:', user.email, error);
          return false;
        }

        console.log('[AUTH] User found in DB:', {
          email: existingUser.email,
          role: existingUser.role,
          is_active: existingUser.is_active
        });

        if (!existingUser.is_active) {
          console.error('[AUTH] User is inactive:', user.email);
          return false;
        }

        // Update entra_id if not set
        if (!existingUser.entra_id && account?.providerAccountId) {
          await supabase
            .from('users')
            .update({ 
              entra_id: account.providerAccountId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);
        }

        return true;
      } catch (error) {
        console.error('[AUTH] Error during sign in:', error);
        return false;
      }
    },
    
    async jwt({ token, user, trigger }) {
      console.log('[JWT] Callback triggered:', { trigger, hasUser: !!user, email: token.email });
      
      // Always fetch fresh data from database on sign in or update
      if (user?.email || trigger === 'update') {
        const email = user?.email || token.email;
        
        if (!email) {
          console.error('[JWT] No email available');
          return token;
        }

        console.log('[JWT] Fetching user data from DB for:', email);

        const { data: dbUser, error } = await supabase
          .from('users')
          .select('id, email, name, role, department_id')
          .eq('email', email as string)
          .single();

        if (error) {
          console.error('[JWT] Error fetching user:', error);
          return token;
        }

        if (dbUser) {
          console.log('[JWT] ✅ Fresh data from DB:', {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            department_id: dbUser.department_id
          });

          // Store in token
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.department_id = dbUser.department_id;
        }
      }
      
      console.log('[JWT] Final token:', {
        id: token.id,
        email: token.email,
        role: token.role
      });
      
      return token;
    },
    
    async session({ session, token }) {
      console.log('[SESSION] Building session from token:', {
        tokenRole: token.role,
        tokenId: token.id,
        tokenEmail: token.email
      });

      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.department_id = token.department_id as string;

        console.log('[SESSION] ✅ Final session.user:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          department_id: session.user.department_id
        });
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: false,
};
