type Args = {
  id: string; rating: number; tldr?: string | null; body: string; pros: string[]; cons: string[]; spoilers: boolean;
  game: { title: string; coverUrl?: string | null };
  user: { name: string; image?: string | null };
};

export async function sendReviewEmbed(r: Args) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  const link = `${process.env.NEXTAUTH_URL}/reviews/${r.id}`;
  const stars = Math.round(r.rating / 2);
  let excerpt = r.tldr || r.body.replace(/[#*_>`]/g, "").slice(0, 300) + (r.body.length > 300 ? "…" : "");
  if (r.spoilers) excerpt = `⚠️ Contient des spoilers\n||${excerpt}||`;
  const list = (a: string[]) => a.map((x) => `• ${x}`).join("\n");

  const fields = [
    { name: "Note", value: `${"⭐".repeat(stars)}${"☆".repeat(5 - stars)} — **${r.rating}/10**` },
    ...(r.pros.length ? [{ name: "👍 Points forts", value: list(r.pros), inline: true }] : []),
    ...(r.cons.length ? [{ name: "👎 Points faibles", value: list(r.cons), inline: true }] : []),
    { name: "\u200b", value: `[📖 Lire l'article complet sur le site](${link})` },
  ];
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: `Nouvel avis publié pour ${r.game.title} !`,
        url: link,
        description: excerpt,
        color: 0x7c6cf5,
        author: { name: r.user.name, icon_url: r.user.image ?? undefined },
        thumbnail: r.game.coverUrl ? { url: r.game.coverUrl } : undefined,
        fields,
        timestamp: new Date().toISOString(),
      }],
    }),
  }).catch(() => {});
}
