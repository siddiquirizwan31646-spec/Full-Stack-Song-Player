const FAVORITES_STORAGE_PREFIX = "qalb-audio-favorites";

export const getFavoritesStorageKey = (userId) =>
  `${FAVORITES_STORAGE_PREFIX}:${userId || "guest"}`;

export const normalizeFavoriteSong = (song = {}) => {
  const normalizedId = song.id ?? song.songId ?? null;

  if (normalizedId === null || normalizedId === undefined) {
    return null;
  }

  return {
    id: normalizedId,
    name: song.name ?? song.songName ?? "Untitled audio",
    artist: song.artist ?? "",
    cover_url: song.cover_url ?? "",
    mp3_url: song.mp3_url ?? "",
    duration: Number(song.duration) || 0,
    location: song.location ?? "",
    description: song.description ?? "",
    music_type: song.music_type ?? "",
    para_number: song.para_number ?? null,
    date: song.date ?? null,
    addedAt: song.addedAt ?? new Date().toISOString(),
  };
};

export const readFavoriteSongs = (storageKey) => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((song) => normalizeFavoriteSong(song))
      .filter(Boolean);
  } catch {
    return [];
  }
};
