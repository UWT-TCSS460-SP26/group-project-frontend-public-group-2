import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: "tcss460",
      name: "TCSS 460 Auth²",
      type: "oidc",
      issuer: process.env.AUTH_TCSS460_ISSUER!,
      clientId: process.env.AUTH_TCSS460_CLIENT_ID!,
      clientSecret: process.env.AUTH_TCSS460_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          audience: process.env.AUTH_TCSS460_AUDIENCE!,
        },
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.idToken = token.idToken as string | undefined;
      return session;
    },
  },
});
