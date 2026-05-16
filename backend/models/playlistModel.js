import mongoose from "mongoose";

const playlistSongSchema = new mongoose.Schema(
  {
    songId: { type: String, required: true },
    songName: { type: String, required: true },
    artist: { type: String, default: "" },
    cover_url: { type: String, default: "" },
    mp3_url: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    songs: {
      type: [playlistSongSchema],
      default: [],
    },
  },
  { timestamps: true }
);

playlistSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });

export const Playlist = mongoose.model("Playlist", playlistSchema);
