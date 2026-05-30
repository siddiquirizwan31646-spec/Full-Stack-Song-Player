import mongoose from "mongoose"

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  bio: String,
  tagline: String,
  quote: String,
  background_image: String,
  location: String,
  monthly_listeners: String,
  avg_rating: Number,
}, { timestamps: true })

export default mongoose.model("Artist", artistSchema)