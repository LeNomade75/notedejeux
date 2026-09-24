const IMG = "https://image.tmdb.org/t/p/w500";

export async function searchTmdb(q: string, type: "MOVIE" | "SERIES") {
  if (!process.env.TMDB_API_KEY) throw new Error("TMDB_API_KEY manquant dans .env");
  const kind = type === "MOVIE" ? "movie" : "tv";
  const url = `https://api.themoviedb.org/3/search/${kind}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&include_adult=false&query=${encodeURIComponent(q)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`TMDB ${r.status} : ${await r.text()}`);
  const d = await r.json();
  return (d.results ?? []).slice(0, 12).map((m: any) => {
    const date = m.release_date || m.first_air_date;
    return {
      tmdbId: m.id,
      mediaType: type,
      title: m.title ?? m.name,
      summary: m.overview ? String(m.overview).slice(0, 1000) : undefined,
      coverUrl: m.poster_path ? IMG + m.poster_path : undefined,
      releaseDate: date ? new Date(date).toISOString() : undefined,
      platforms: [],
    };
  });
}
