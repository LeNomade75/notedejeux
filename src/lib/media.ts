export type MediaType = "GAME" | "MOVIE" | "SERIES" | "ANIME" | "VIDEO";
export type SubKey = "graphics" | "gameplay" | "story" | "soundtrack";
export const MEDIA_TYPES: MediaType[] = ["GAME", "MOVIE", "SERIES", "ANIME", "VIDEO"];

// Les 4 colonnes de sous-notes sont les mêmes pour tous les types, seuls les libellés changent
export const MEDIA: Record<MediaType, {
  label: string; plural: string; a: string; source: string;
  hours: string; hoursSuffix: string; asked: string; subs: [SubKey, string][];
}> = {
  GAME: {
    label: "Jeu", plural: "Jeux", a: "un jeu", source: "IGDB",
    hours: "Heures de jeu", hoursSuffix: "de jeu", asked: "Tu as joué à ce jeu ?",
    subs: [["graphics", "Graphismes"], ["gameplay", "Gameplay"], ["story", "Histoire"], ["soundtrack", "Bande-son"]],
  },
  MOVIE: {
    label: "Film", plural: "Films", a: "un film", source: "TMDB",
    hours: "Heures de visionnage", hoursSuffix: "de visionnage", asked: "Tu as vu ce film ?",
    subs: [["graphics", "Réalisation"], ["gameplay", "Interprétation"], ["story", "Scénario"], ["soundtrack", "Bande-son"]],
  },
  SERIES: {
    label: "Série", plural: "Séries", a: "une série", source: "TMDB",
    hours: "Heures de visionnage", hoursSuffix: "de visionnage", asked: "Tu as vu cette série ?",
    subs: [["graphics", "Réalisation"], ["gameplay", "Interprétation"], ["story", "Scénario"], ["soundtrack", "Bande-son"]],
  },
  ANIME: {
    label: "Anime", plural: "Animes", a: "un anime", source: "AniList",
    hours: "Heures de visionnage", hoursSuffix: "de visionnage", asked: "Tu as vu cet anime ?",
    subs: [["graphics", "Animation"], ["gameplay", "Personnages"], ["story", "Histoire"], ["soundtrack", "Bande-son"]],
  },
  VIDEO: {
    label: "Vidéo", plural: "Vidéos", a: "une vidéo", source: "YouTube",
    hours: "Heures de visionnage", hoursSuffix: "de visionnage", asked: "Tu as vu cette vidéo ?",
    subs: [["graphics", "Montage"], ["gameplay", "Contenu"], ["story", "Écriture"], ["soundtrack", "Son / musique"]],
  },
};

const GAME_STATUS: Record<string, string> = { COMPLETED: "Terminé", IN_PROGRESS: "En cours", DROPPED: "Abandonné", PLATINUM: "100 % / Platine" };
const WATCH_STATUS: Record<string, string> = { COMPLETED: "Vu", IN_PROGRESS: "En cours", DROPPED: "Abandonné", PLATINUM: "Vu à 100 %" };

export const statusLabel = (t: MediaType, s: string) => (t === "GAME" ? GAME_STATUS : WATCH_STATUS)[s] ?? s;
export const statusOptions = (t: MediaType): [string, string][] =>
  (["COMPLETED", "IN_PROGRESS", "DROPPED", ...(t === "GAME" ? ["PLATINUM"] : [])] as string[]).map((s) => [s, statusLabel(t, s)]);
