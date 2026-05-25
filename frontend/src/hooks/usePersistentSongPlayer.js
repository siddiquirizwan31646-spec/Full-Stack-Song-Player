import { useCallback, useMemo } from "react";
import { usePlayer } from "@/context/PlayerContext";

export const usePersistentSongPlayer = (songs = []) => {
  const player = usePlayer();

  const playSongFromList = useCallback(
    async (song) => {
      await player.playSong(song, songs);
    },
    [player, songs]
  );

  return useMemo(
    () => ({
      ...player,
      playSongFromList,
      progressPct: player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0,
    }),
    [player, playSongFromList]
  );
};
