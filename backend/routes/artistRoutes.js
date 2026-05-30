const express = require("express")
const router = express.Router()
const Artist = require("../models/artistModel")

// GET artist by name (used by frontend)
router.get("/by-name/:name", async (req, res) => {
  try {
    const artist = await Artist.findOne({ name: new RegExp(`^${req.params.name}$`, "i") })
    if (!artist) return res.json({ success: false })
    res.json({ success: true, artist })
  } catch { res.json({ success: false }) }
})

// POST create/update artist (admin use)
router.post("/upsert", async (req, res) => {
  try {
    const { name, ...data } = req.body
    const artist = await Artist.findOneAndUpdate({ name }, { name, ...data }, { upsert: true, new: true })
    res.json({ success: true, artist })
  } catch (e) { res.json({ success: false, error: e.message }) }
})

module.exports = router