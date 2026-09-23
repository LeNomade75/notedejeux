import type { NextAuthOptions } from "next-auth";
import Discord from "next-auth/providers/discord";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { error: "/refus" },
  callbacks: {
    async signIn({ account, profile }) {
      try {
        console.log("[auth] vérification du serveur Discord…");
        const res = await fetch("https://discord.com/api/users/@me/guilds", {
          headers: { Authorization: `Bearer ${account?.access_token}` },
          signal: AbortSignal.timeout(8000),
        });
        console.log("[auth] réponse Discord :", res.status);
        if (!res.ok) return false;

        const guilds: { id: string }[] = await res.json();
        if (!guilds.some((g) => g.id === process.env.DISCORD_GUILD_ID)) {
          console.log("[auth] pas membre du serveur", process.env.DISCORD_GUILD_ID);
          return "/refus";
        }

        const p = profile as { id: string; username: string; global_name?: string; avatar?: string };
        const name = p.global_name ?? p.username;
        const image = p.avatar ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png` : null;
        console.log("[auth] enregistrement de l'utilisateur en base…");
        await prisma.user.upsert({
          where: { discordId: p.id },
          update: { name, image },
          create: { discordId: p.id, name, image },
        });
        console.log("[auth] OK");
        return true;
      } catch (e) {
        console.error("[auth] erreur :", e);
        return false;
      }
    },
    async jwt({ token, profile }) {
      if (profile) token.discordId = (profile as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      (session.user as { discordId?: string }).discordId = token.discordId as string;
      return session;
    },
  },
};