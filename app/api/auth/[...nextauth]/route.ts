import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const handler = NextAuth({
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
        return false;
      }

      try {
        // Check if user exists in Supabase
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('id, email, name, role, is_active, department_id, entra_id')
          .eq('email', user.email.toLowerCase())
          .single();

        if (error || !existingUser) {
          console.log('User not found in database:', user.email);
          return false;
        }

        // Check if user is active
        if (!existingUser.is_active) {
          console.log('User is inactive:', user.email);
          return false;
        }

        // Update entra_id if not set
        if (!existingUser.entra_id && account?.providerAccountId) {
          await supabase
            .from('users')
            .update({ entra_id: account.providerAccountId })
            .eq('id', existingUser.id);
        }

        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && user.email) {
        try {
          // Fetch user data from Supabase
          const { data: dbUser, error } = await supabase
            .from('users')
            .select('id, email, name, role, is_active, department_id')
            .eq('email', user.email.toLowerCase())
            .single();

          if (dbUser && !error) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.department_id = dbUser.department_id;
            token.email = dbUser.email;
            token.name = dbUser.name;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.department_id = token.department_id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

export { handler as GET, handler as POST };
