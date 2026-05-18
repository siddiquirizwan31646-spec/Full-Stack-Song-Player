// backend/models/User.js
// UPDATED User schema — adds Google fields, keeps all existing fields intact.
// Place at: backend/models/User.js  (replace or merge with your existing one)

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type:     String,
      required: true,
      trim:     true,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    // ── Password (optional for Google users) ──────────────────────────────
    password: {
      type:   String,
      // NOT required — Google users have no password
      select: false, // never returned in queries unless explicitly requested
    },

    // ── Google OAuth fields ────────────────────────────────────────────────
    googleId: {
      type:    String,
      default: null,
      index:   true,
      sparse:  true, // allows multiple null values (non-Google users)
    },
    photo: {
      type:    String,
      default: "",
    },
    authProvider: {
      type:    String,
      enum:    ["local", "google"],
      default: "local",
    },

    // ── Existing fields (keep yours, these are common examples) ───────────
    role: {
      type:    String,
      enum:    ["user", "admin"],
      default: "user",
    },
    emailVerified: {
      type:    Boolean,
      default: false,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },

    // Add any other fields your existing schema has here...
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ── Hash password before save (only if password was modified) ─────────────
userSchema.pre("save", async function (next) {
  // Skip hashing if no password (Google users) or password not modified
  if (!this.password || !this.isModified("password")) return next();
  try {
    const salt   = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare password (safe for Google users) ────────────
userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false; // Google user has no password
  return bcrypt.compare(candidate, this.password);
};

// ── Virtual: safe public profile ─────────────────────────────────────────
userSchema.virtual("publicProfile").get(function () {
  return {
    id:           this._id,
    username:     this.username,
    email:        this.email,
    photo:        this.photo,
    role:         this.role,
    authProvider: this.authProvider,
    emailVerified: this.emailVerified,
    createdAt:    this.createdAt,
  };
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
