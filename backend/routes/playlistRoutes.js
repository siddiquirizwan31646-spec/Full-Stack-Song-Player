import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { Playlist } from "../models/playlistModel.js";

const router = express.Router();

const normalizeName = (name = "") => name.trim().replace(/\s+/g, " ").toLowerCase();

router.use(isAuthenticated);

router.get("/", async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      playlists,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Playlist name is required",
      });
    }

    const normalizedName = normalizeName(name);
    const existingPlaylist = await Playlist.findOne({
      userId: req.userId,
      normalizedName,
    });

    if (existingPlaylist) {
      return res.status(409).json({
        success: false,
        message: "You already have a playlist with this name",
      });
    }

    const playlist = await Playlist.create({
      name,
      normalizedName,
      userId: req.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Playlist created successfully",
      playlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/:id/songs", async (req, res) => {
  try {
    const { id } = req.params;
    const { songId, songName, artist, cover_url, mp3_url, duration } = req.body;

    if (!songId || !songName) {
      return res.status(400).json({
        success: false,
        message: "songId and songName are required",
      });
    }

    const playlist = await Playlist.findOne({ _id: id, userId: req.userId });
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const alreadyAdded = playlist.songs.some((song) => song.songId === String(songId));
    if (alreadyAdded) {
      return res.status(409).json({
        success: false,
        message: "Song already exists in this playlist",
      });
    }

    playlist.songs.push({
      songId: String(songId),
      songName: songName.trim(),
      artist: artist?.trim() || "",
      cover_url: cover_url || "",
      mp3_url: mp3_url || "",
      duration: Number(duration) || 0,
      addedAt: new Date(),
    });

    await playlist.save();

    return res.status(200).json({
      success: true,
      message: "Song added to playlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/:id/songs/:songId", async (req, res) => {
  try {
    const { id, songId } = req.params;

    const playlist = await Playlist.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $pull: { songs: { songId: String(songId) } } },
      { new: true }
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Song removed from playlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedPlaylist = await Playlist.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedPlaylist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
