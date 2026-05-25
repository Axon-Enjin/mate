import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const scope = "openid profile email User.Read Calendars.ReadWrite offline_access";
const tenantId = process.env.AZURE_AD_TENANT_ID;
const tokenEndpoint = tenantId
  ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  : undefined;

async function refreshAccessToken(token: any) {
  try {
    if (!tokenEndpoint) {
      return { ...token, error: "MissingTenantId" };
    }

    if (!token.refreshToken) {
      return { ...token, error: "MissingRefreshToken" };
    }

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID || "",
        client_secret: process.env.AZURE_AD_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
        scope,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw new Error(
        refreshedTokens.error_description || "Failed to refresh access token"
      );
    }

    const expiresInSeconds = Number(refreshedTokens.expires_in || 0);
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + expiresInSeconds;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + expiresInSeconds * 1000,
      expiresAt: expiresAtSeconds,
      refreshToken: refreshedTokens.refresh_token || token.refreshToken,
      idToken: refreshedTokens.id_token || token.idToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: tenantId
        ? `https://login.microsoftonline.com/${tenantId}/v2.0`
        : undefined,
      authorization: {
        params: {
          scope,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.accessTokenExpires = (account.expires_at || 0) * 1000;
        token.idToken = account.id_token;
      }

      const accessTokenExpires = token.accessTokenExpires as number | undefined;
      if (accessTokenExpires && Date.now() < accessTokenExpires - 60_000) {
        return token;
      }

      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Always use Microsoft Entra object id — stable across logins (never email).
      if (token.sub) {
        session.user.id = token.sub;
      }

      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
});