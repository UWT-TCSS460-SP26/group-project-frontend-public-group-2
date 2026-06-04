import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    accessTokenExpiresAt?: number;
  }
}

function decodeJwtExp(token?: string): number | undefined {
  if (!token) return undefined;
  const parts = token.split(".");
  if (parts.length < 2) return undefined;
  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const parsed = JSON.parse(
      Buffer.from(payload, "base64").toString("utf8"),
    ) as { exp?: unknown };
    const exp =
      typeof parsed.exp === "number"
        ? parsed.exp
        : typeof parsed.exp === "string"
          ? Number(parsed.exp)
          : NaN;
    return Number.isFinite(exp) ? exp : undefined;
  } catch {
    return undefined;
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
      // provider stamped on it. Some providers omit `expires_at`, so we fall
      // back to `expires_in` and then the JWT's own `exp` claim.
      if (account) {
        const accessToken = account.access_token;
        if (!accessToken) return null;

        const expiresAt =
          (typeof account.expires_at === "number" ? account.expires_at : undefined)
          ?? (typeof account.expires_in === "number"
            ? Math.floor(Date.now() / 1000) + account.expires_in
            : undefined)
          ?? decodeJwtExp(accessToken)
          ?? decodeJwtExp(account.id_token ?? undefined);

        return {
          ...token,
          accessToken,
          idToken: account.id_token,
          accessTokenExpiresAt: expiresAt,
        };
      }

      // Subsequent calls — invalidate the session once the access token has
      // expired. Auth² does not expose refresh tokens to us, so the user
      // re-signs in. Returning `null` clears the JWT cookie, so the Header,
      // /profile, and every write gate see a clean signed-out state — instead
      // of the broken "looks signed in but every write returns 401" trap.
      const accessToken = token.accessToken as string | undefined;
      if (!accessToken) return null;

      const expiresAt =
        (typeof token.accessTokenExpiresAt === "number"
          ? token.accessTokenExpiresAt
          : undefined)
        ?? decodeJwtExp(accessToken)
        ?? decodeJwtExp(token.idToken as string | undefined);

      // Small skew buffer so we don't render authenticated UI at the exact
      // expiry boundary and fail immediately on the next write request.
      if (typeof expiresAt === "number" && Date.now() / 1000 >= expiresAt - 30) {
        return null;
      }

      if (typeof token.accessTokenExpiresAt !== "number" && expiresAt) {
        return { ...token, accessTokenExpiresAt: expiresAt };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.idToken = token.idToken as string | undefined;
      session.accessTokenExpiresAt = token.accessTokenExpiresAt as number | undefined;
      return session;
    },
  },
});
