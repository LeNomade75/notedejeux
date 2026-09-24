const QUERY = `query ($s: String) {
  Page(perPage: 12) {
    media(search: $s, type: ANIME, sort: SEARCH_MATCH) {
      id title { romaji english } coverImage { large } startDate { year month day } genres description(asHtml: false)
    }
  }
}`;

export async function searchAnime(q: string) {
  const r = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { s: q } }),
  });
  if (!r.ok) throw new Error(`AniList ${r.status} : ${await r.text()}`);
  const d = await r.json();
  return (d.data?.Page?.media ?? []).map((m: any) => ({
    anilistId: m.id,
    mediaType: "ANIME",
    title: m.title.english ?? m.title.romaji,
    summary: m.description ? String(m.description).replace(/<[^>]+>/g, "").slice(0, 1000) : undefined,
    genre: m.genres?.[0],
    coverUrl: m.coverImage?.large,
    releaseDate: m.startDate?.year
      ? new Date(Date.UTC(m.startDate.year, (m.startDate.month ?? 1) - 1, m.startDate.day ?? 1)).toISOString()
      : undefined,
    platforms: [],
  }));
}
