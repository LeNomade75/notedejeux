let token: { value: string; exp: number } | null = null;

async function getToken() {
  if (token && token.exp > Date.now()) return token.value;
  const r = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );
  const d = await r.json();
  if (!d.access_token) throw new Error(`Twitch : ${d.message ?? JSON.stringify(d)}`);
  token = { value: d.access_token, exp: Date.now() + (d.expires_in - 300) * 1000 };
  return token.value;
}

export async function searchGames(q: string) {
  const safe = q.replace(/["\\]/g, "").slice(0, 80);
  const r = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: { "Client-ID": process.env.TWITCH_CLIENT_ID!, Authorization: `Bearer ${await getToken()}` },
    body: `search "${safe}"; fields name,summary,first_release_date,cover.image_id,platforms.abbreviation,genres.name; limit 12;`,
  });
  if (!r.ok) throw new Error(`IGDB ${r.status} : ${await r.text()}`);
  const rows = await r.json();
  return rows.map((g: any) => ({
    igdbId: g.id,
    title: g.name,
    summary: g.summary?.slice(0, 1000),
    genre: g.genres?.[0]?.name,
    coverUrl: g.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : undefined,
    releaseDate: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : undefined,
    platforms: (g.platforms ?? []).map((p: any) => p.abbreviation).filter(Boolean),
  }));
}