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
      // Auth² only supports client_secret_post (per its /.well-known/openid-configuration);
      // openid-client's default of client_secret_basic gets rejected at the token endpoint.
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
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
      // First sign-in — persist the access token + the expiration the OIDC
      // provider stamped on it. Auth.js gives us `expires_at` as unix seconds.
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          idToken: account.id_token,
          accessTokenExpiresAt: account.expires_at,
        };
      }

      // Subsequent calls — invalidate the session once the access token has
      // expired. Auth² does not expose refresh tokens to us, so the user
      // re-signs in. Returning `null` clears the JWT cookie, so the Header,
      // /profile, and every write gate see a clean signed-out state — instead
      // of the broken "looks signed in but every write returns 401" trap.
      const expiresAt = token.accessTokenExpiresAt as number | undefined;
      if (typeof expiresAt === "number" && Date.now() / 1000 >= expiresAt) {
        return null;
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
