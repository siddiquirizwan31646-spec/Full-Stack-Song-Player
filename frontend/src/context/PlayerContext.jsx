import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const PlayerContext = createContext(null);

const clampVolume = (value) => {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return 0.8;
  }

  return Math.min(1, Math.max(0, nextValue));
};

const normalizeQueue = (songs = []) =>
  Array.isArray(songs) ? songs.filter((song) => song?.mp3_url) : [];

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const currentSongRef = useRef(null);
  const volumeRef = useRef(0.8);

  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  if (!audioRef.current && typeof Audio !== "undefined") {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
  }

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const setVolume = useCallback((nextVolume) => {
    const safeVolume = clampVolume(nextVolume);
    volumeRef.current = safeVolume;
    setVolumeState(safeVolume);

    if (audioRef.current) {
      audioRef.current.volume = safeVolume;
    }
  }, []);

  const startSong = useCallback(async (song, providedQueue = [], forcedIndex) => {
    const audio = audioRef.current;
    if (!audio || !song?.mp3_url) {
      return;
    }

    const normalizedQueue = normalizeQueue(providedQueue);
    const nextIndex =
      Number.isInteger(forcedIndex)
        ? forcedIndex
        : normalizedQueue.findIndex((item) => String(item?.id) === String(song.id));

    if (normalizedQueue.length) {
      setQueue(normalizedQueue);
      setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
    } else {
      setQueue([song]);
      setCurrentIndex(0);
    }

    const nextSong = nextIndex >= 0 && normalizedQueue[nextIndex] ? normalizedQueue[nextIndex] : song;
    const currentSongId = currentSongRef.current?.id;
    const isSameSong = String(currentSongId ?? "") === String(nextSong.id ?? "");

    setCurrentSong(nextSong);
    setCurrentTime(0);
    setDuration(Number(nextSong.duration) || 0);

    if (!isSameSong || audio.src !== nextSong.mp3_url) {
      audio.src = nextSong.mp3_url;
    } else {
      audio.currentTime = 0;
    }

    audio.volume = volumeRef.current;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
      throw error;
    }
  }, []);

  const playSong = useCallback(
    async (song, providedQueue = queueRef.current) => {
      await startSong(song, providedQueue);
    },
    [startSong]
  );

  const playNext = useCallback(async () => {
    const nextIndex = currentIndexRef.current + 1;
    const nextSong = queueRef.current[nextIndex];

    if (!nextSong) {
      return;
    }

    await startSong(nextSong, queueRef.current, nextIndex);
  }, [startSong]);

  const playPrev = useCallback(async () => {
    const nextIndex = currentIndexRef.current - 1;
    const nextSong = queueRef.current[nextIndex];

    if (!nextSong) {
      return;
    }

    await startSong(nextSong, queueRef.current, nextIndex);
  }, [startSong]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentSongRef.current) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback((nextTime) => {
    const audio = audioRef.current;
    const safeTime = Number(nextTime);

    if (!audio || !Number.isFinite(safeTime)) {
      return;
    }

    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, []);

  const resetPlayer = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    setQueue([]);
    setCurrentIndex(-1);
    setCurrentSong(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const isCurrentSong = useCallback(
    (songId) => String(currentSong?.id ?? "") === String(songId ?? ""),
    [currentSong]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return undefined;
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handleLoadedMetadata = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : Number(currentSongRef.current?.duration) || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = async () => {
      const nextIndex = currentIndexRef.current + 1;
      const nextSong = queueRef.current[nextIndex];

      if (!nextSong) {
        setIsPlaying(false);
        setCurrentTime(0);
        return;
      }

      try {
        await startSong(nextSong, queueRef.current, nextIndex);
      } catch {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [startSong]);

  const value = useMemo(
    () => ({
      queue,
      currentSong,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      volume,
      playSong,
      playNext,
      playPrev,
      togglePlay,
      seekTo,
      setVolume,
      resetPlayer,
      isCurrentSong,
      hasNext: currentIndex >= 0 && currentIndex < queue.length - 1,
      hasPrev: currentIndex > 0,
    }),
    [
      queue,
      currentSong,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      volume,
      playSong,
      playNext,
      playPrev,
      togglePlay,
      seekTo,
      setVolume,
      resetPlayer,
      isCurrentSong,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used inside <PlayerProvider>");
  }

  return context;
}
