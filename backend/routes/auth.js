// backend/routes/auth.js  (Google section)
// ADD these routes to your existing auth router.
// Place in: backend/routes/auth.js  OR  backend/routes/googleAuth.js

const express  = require("express");
const jwt      = require("jsonwebtoken");
const admin    = require("firebase-admin");
const User     = require("../models/User"); // your existing User model

const router = express.Router();

// ── Initialize Firebase Admin (do this ONCE, ideally in server.js) ──────────
// In server.js / app.js add:
//
//   const admin = require("firebase-admin");
//   if (!admin.apps.length) {
//     admin.initializeApp({
//       credential: admin.credential.cert({
//         projectId:   process.env.FIREBASE_PROJECT_ID,
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//         privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//       }),
//     });
//   }
//
// Then mount this router:  app.use("/api/auth", authRouter);
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/google
 * Verifies Firebase ID token, upserts user in MongoDB, returns JWT.
 */
router.post("/google", async (req, res) => {
  const { idToken, name, email, photo, uid } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Firebase ID token is required." });
  }

  try {
    // 1. Verify the Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);

    if (decoded.uid !== uid) {
      return res.status(401).json({ message: "Token UID mismatch." });
    }

    const verifiedEmail = decoded.email || email;
    if (!verifiedEmail) {
      return res.status(400).json({ message: "No email found in Google account." });
    }

    // 2. Upsert user in MongoDB
    let user = await User.findOne({ email: verifiedEmail });

    if (user) {
      // Existing user — update Google fields if they were blank
      let changed = false;
      if (!user.googleId)  { user.googleId  = decoded.uid; changed = true; }
      if (!user.photo && photo) { user.photo = photo; changed = true; }
      if (!user.username && name) { user.username = name; changed = true; }
      if (!user.authProvider) { user.authProvider = "google"; changed = true; }
      if (changed) await user.save();
    } else {
      // New Google user — create account (no password needed)
      user = await User.create({
        username:     name || verifiedEmail.split("@")[0],
        email:        verifiedEmail,
        googleId:     decoded.uid,
        photo:        photo || "",
        authProvider: "google",
        // password field left empty / null for Google users
        // your User schema should make password optional
        emailVerified: true,
      });
    }

    // 3. Generate your own JWT (same way as email login)
    const token = jwt.sign(
      {
        id:    user._id,
        email: user.email,
        role:  user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // 4. Return token + safe user object
    return res.status(200).json({
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        photo:    user.photo || "",
        role:     user.role || "user",
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    console.error("[Google Auth Error]", err);

    if (err.code === "auth/id-token-expired") {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    if (err.code === "auth/argument-error" || err.code === "auth/invalid-id-token") {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    return res.status(500).json({ message: "Authentication failed. Please try again." });
  }
});

module.exports = router;
