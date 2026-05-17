const normalizeUrl = (value) => (value || "").trim().replace(/\/+$/, "");

export const API_URL = normalizeUrl(
  import.meta.env.VITE_API_URL || "https://full-stack-song-player-4.onrender.com"
);

export const APP_URL = normalizeUrl(
  import.meta.env.VITE_APP_URL || "https://qalbaudio.vercel.app"
);

const adminEmailList = (import.meta.env.VITE_UPLOAD_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const canAccessUploadCenter = (user) => {
  if (!user?.email) {
    return false;
  }

  if (!adminEmailList.length) {
    return true;
  }

  return adminEmailList.includes(String(user.email).trim().toLowerCase());
};
